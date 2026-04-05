"use server";

import { parseXlsx } from "@/lib/import/parser";
import { mapRowsToOrders } from "@/lib/import/mapper";
import { createClient } from "@/lib/supabase/server";

export async function parseUpload(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const buffer = await file.arrayBuffer();
  const rows = parseXlsx(buffer);

  if (rows.length === 0) return { error: "No rows found in file" };

  const { orders, items, skippedCount } = mapRowsToOrders(rows);

  return {
    orderCount: orders.size,
    itemCount: items.length,
    skippedCount: skippedCount ?? 0,
    orders: Array.from(orders.values()),
    items,
  };
}

/** Normalize a product name for fuzzy matching: lowercase, collapse whitespace */
function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function confirmImport(data: string) {
  const parsed = JSON.parse(data);
  const { orders: orderList, items } = parsed;
  const supabase = await createClient();

  // Check which order_numbers already exist to skip duplicates
  const incomingNumbers = orderList.map((o: { order_number: string }) => o.order_number);
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("order_number")
    .in("order_number", incomingNumbers);

  const existingSet = new Set(
    (existingOrders ?? []).map((o: { order_number: string }) => o.order_number)
  );

  // Filter out orders that already exist
  const newOrders = orderList.filter(
    (o: { order_number: string }) => !existingSet.has(o.order_number)
  );
  const newOrderNumbers = new Set(newOrders.map((o: { order_number: string }) => o.order_number));
  const newItems = items.filter(
    (i: { order_number: string }) => newOrderNumbers.has(i.order_number)
  );

  const skippedDuplicates = existingSet.size;

  if (newOrders.length === 0) {
    return {
      success: true,
      orderCount: 0,
      itemCount: 0,
      skippedDuplicates,
      message: skippedDuplicates > 0
        ? `All ${skippedDuplicates} orders already exist. No new orders imported.`
        : "No orders to import.",
    };
  }

  // Fetch SKUs by name for auto-linking
  const [skusRes, variationsRes] = await Promise.all([
    supabase.from("skus").select("id, name"),
    supabase.from("sku_variations").select("id, sku_id, variation_name"),
  ]);

  // Build product name → sku_id lookup (normalized)
  const skuNameMap = new Map<string, string>();
  for (const s of skusRes.data ?? []) {
    skuNameMap.set(normalize(s.name), s.id);
  }

  const variationMap = new Map(
    (variationsRes.data ?? []).map((v) => [`${v.sku_id}:${normalize(v.variation_name)}`, v.id])
  );

  // Insert new orders
  let upserted = 0;
  for (const order of newOrders) {
    const { error } = await supabase
      .from("orders")
      .insert(order);
    if (error) {
      return { error: `Failed to insert order ${order.order_number}: ${error.message}` };
    }
    upserted++;
  }

  // Fetch order IDs for FK linking
  const { data: orderRows } = await supabase
    .from("orders")
    .select("id, order_number")
    .in("order_number", Array.from(newOrderNumbers));

  const orderIdMap = new Map(
    (orderRows ?? []).map((o: { id: string; order_number: string }) => [o.order_number, o.id])
  );

  // Insert items with SKU linking by product name
  const itemInserts = newItems.map((item: { order_number: string; parent_sku: string; product_name: string; sku_reference: string | null; variation_name: string | null; original_price: number; discounted_price: number; quantity: number; buyer_paid: number; total_discount: number; seller_discount: number; shopee_discount: number; product_weight: string | null }) => {
    const order_id = orderIdMap.get(item.order_number);
    const sku_id = skuNameMap.get(normalize(item.product_name)) ?? null;

    let variation_id = null;
    if (sku_id && item.variation_name) {
      variation_id = variationMap.get(`${sku_id}:${normalize(item.variation_name)}`) ?? null;
    }

    return {
      order_id,
      sku_id,
      variation_id,
      parent_sku: item.parent_sku,
      product_name: item.product_name,
      sku_reference: item.sku_reference,
      variation_name: item.variation_name,
      original_price: item.original_price,
      discounted_price: item.discounted_price,
      quantity: item.quantity,
      buyer_paid: item.buyer_paid,
      total_discount: item.total_discount,
      seller_discount: item.seller_discount,
      shopee_discount: item.shopee_discount,
      product_weight: item.product_weight,
    };
  }).filter((i: { order_id: unknown }) => i.order_id);

  if (itemInserts.length > 0) {
    const { error } = await supabase.from("order_items").insert(itemInserts);
    if (error) {
      return { error: `Failed to insert items: ${error.message}` };
    }
  }

  return {
    success: true,
    orderCount: upserted,
    itemCount: itemInserts.length,
    skippedDuplicates,
  };
}
