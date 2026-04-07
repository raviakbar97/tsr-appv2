"use server";

import { createClient } from "@/lib/supabase/server";
import { deductWarehouseForOrder } from "@/app/dashboard/inventory/warehouse/actions";
import { revalidatePath } from "next/cache";

/** Normalize a product name for fuzzy matching: lowercase, collapse whitespace */
function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function pruneOrders(mode: "all" | "range", from?: string, to?: string) {
  const supabase = await createClient();

  if (mode === "all") {
    const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return { error: error.message };
    return { success: true };
  }

  if (mode === "range" && from && to) {
    const toEnd = to + "T23:59:59";
    const { error } = await supabase
      .from("orders")
      .delete()
      .gte("created_at", from)
      .lte("created_at", toEnd);
    if (error) return { error: error.message };
    return { success: true };
  }

  return { error: "Invalid parameters" };
}

export async function recalculateOrders() {
  const supabase = await createClient();

  // Fetch all SKUs and variations for matching
  const [skusRes, variationsRes, itemsRes] = await Promise.all([
    supabase.from("skus").select("id, name"),
    supabase.from("sku_variations").select("id, sku_id, variation_name"),
    supabase.from("order_items").select("id, product_name, variation_name, sku_id, variation_id"),
  ]);

  if (!itemsRes.data || itemsRes.data.length === 0) {
    return { updated: 0, total: 0 };
  }

  // Build product name → sku_id lookup (normalized)
  const skuNameMap = new Map<string, string>();
  for (const s of skusRes.data ?? []) {
    skuNameMap.set(normalize(s.name), s.id);
  }

  // Build sku_id:variation_name → variation_id lookup
  const variationMap = new Map<string, string>();
  for (const v of variationsRes.data ?? []) {
    variationMap.set(`${v.sku_id}:${normalize(v.variation_name)}`, v.id);
  }

  // Re-link each order item to the correct SKU and variation by product name
  let updated = 0;
  for (const item of itemsRes.data) {
    const newSkuId = skuNameMap.get(normalize(item.product_name)) ?? null;
    let newVariationId = null;
    if (newSkuId && item.variation_name) {
      newVariationId = variationMap.get(`${newSkuId}:${normalize(item.variation_name)}`) ?? null;
    }

    // Only update if something changed
    if (newSkuId !== item.sku_id || newVariationId !== item.variation_id) {
      const { error } = await supabase
        .from("order_items")
        .update({ sku_id: newSkuId, variation_id: newVariationId })
        .eq("id", item.id);
      if (!error) updated++;
    }
  }

  return {
    updated,
    total: itemsRes.data.length,
  };
}

export async function createManualOrders(
  orders: {
    order_number: string;
    order_status: string;
    created_at: string;
    payment_method?: string;
    buyer_username?: string;
    city?: string;
    province?: string;
    items: {
      product_name: string;
      variation_name?: string;
      parent_sku: string;
      discounted_price: number;
      quantity: number;
    }[];
  }[]
) {
  const supabase = await createClient();

  if (!orders || orders.length === 0) return { error: "No orders provided" };

  // Fetch SKUs and variations for auto-linking
  const [skusRes, variationsRes] = await Promise.all([
    supabase.from("skus").select("id, name"),
    supabase.from("sku_variations").select("id, sku_id, variation_name"),
  ]);

  const skuNameMap = new Map<string, string>();
  for (const s of skusRes.data ?? []) {
    skuNameMap.set(normalize(s.name), s.id);
  }

  const variationMap = new Map(
    (variationsRes.data ?? []).map((v) => [`${v.sku_id}:${normalize(v.variation_name)}`, v.id])
  );

  // Check for duplicate order numbers
  const incomingNumbers = orders.map((o) => o.order_number);
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("order_number")
    .in("order_number", incomingNumbers);

  const existingSet = new Set(
    (existingOrders ?? []).map((o: { order_number: string }) => o.order_number)
  );

  let totalInserted = 0;
  let totalItems = 0;

  for (const order of orders) {
    if (existingSet.has(order.order_number)) continue;

    // Insert order
    const orderRow: Record<string, unknown> = {
      order_number: order.order_number,
      order_status: order.order_status,
      created_at: order.created_at,
      payment_method: order.payment_method || null,
      buyer_username: order.buyer_username || null,
      city: order.city || null,
      province: order.province || null,
    };

    const { error: orderError } = await supabase.from("orders").insert(orderRow);
    if (orderError) return { error: `Failed to insert order ${order.order_number}: ${orderError.message}` };

    // Fetch the inserted order's ID
    const { data: orderRow2 } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", order.order_number)
      .single();

    if (!orderRow2) continue;
    const orderId = orderRow2.id;

    // Insert items
    const itemInserts = order.items.map((item) => {
      const sku_id = skuNameMap.get(normalize(item.product_name)) ?? null;
      let variation_id = null;
      if (sku_id && item.variation_name) {
        variation_id = variationMap.get(`${sku_id}:${normalize(item.variation_name)}`) ?? null;
      }

      return {
        order_id: orderId,
        sku_id,
        variation_id,
        parent_sku: item.parent_sku || "MANUAL",
        product_name: item.product_name,
        variation_name: item.variation_name || null,
        original_price: item.discounted_price,
        discounted_price: item.discounted_price,
        quantity: item.quantity,
        buyer_paid: item.discounted_price * item.quantity,
        total_discount: 0,
        seller_discount: 0,
        shopee_discount: 0,
      };
    });

    if (itemInserts.length > 0) {
      const { error: itemError } = await supabase.from("order_items").insert(itemInserts);
      if (itemError) return { error: `Failed to insert items for ${order.order_number}: ${itemError.message}` };

      totalItems += itemInserts.length;

      // Deduct warehouse stock
      await deductWarehouseForOrder(
        orderId,
        itemInserts.map((i) => ({ sku_id: i.sku_id, variation_id: i.variation_id, quantity: i.quantity }))
      );
    }

    totalInserted++;
  }

  revalidatePath("/dashboard/orders");
  return { success: true, orderCount: totalInserted, itemCount: totalItems };
}

export async function updateOrder(
  orderId: string,
  data: {
    order_number?: string;
    payment_method?: string;
    buyer_username?: string;
    city?: string;
    province?: string;
    items?: {
      id?: string;
      product_name: string;
      variation_name?: string;
      parent_sku: string;
      discounted_price: number;
      quantity: number;
    }[];
  }
) {
  const supabase = await createClient();

  // Update order metadata
  const orderUpdate: Record<string, unknown> = {};
  if (data.order_number !== undefined) orderUpdate.order_number = data.order_number;
  if (data.payment_method !== undefined) orderUpdate.payment_method = data.payment_method || null;
  if (data.buyer_username !== undefined) orderUpdate.buyer_username = data.buyer_username || null;
  if (data.city !== undefined) orderUpdate.city = data.city || null;
  if (data.province !== undefined) orderUpdate.province = data.province || null;

  if (Object.keys(orderUpdate).length > 0) {
    const { error } = await supabase.from("orders").update(orderUpdate).eq("id", orderId);
    if (error) return { error: error.message };
  }

  // Update items if provided
  if (data.items && data.items.length > 0) {
    // Fetch SKUs for auto-linking
    const [skusRes, variationsRes] = await Promise.all([
      supabase.from("skus").select("id, name"),
      supabase.from("sku_variations").select("id, sku_id, variation_name"),
    ]);

    const skuNameMap = new Map<string, string>();
    for (const s of skusRes.data ?? []) {
      skuNameMap.set(normalize(s.name), s.id);
    }

    const variationMap = new Map(
      (variationsRes.data ?? []).map((v) => [`${v.sku_id}:${normalize(v.variation_name)}`, v.id])
    );

    // Delete existing items and re-insert
    await supabase.from("order_items").delete().eq("order_id", orderId);

    const itemInserts = data.items.map((item) => {
      const sku_id = skuNameMap.get(normalize(item.product_name)) ?? null;
      let variation_id = null;
      if (sku_id && item.variation_name) {
        variation_id = variationMap.get(`${sku_id}:${normalize(item.variation_name)}`) ?? null;
      }

      return {
        order_id: orderId,
        sku_id,
        variation_id,
        parent_sku: item.parent_sku || "MANUAL",
        product_name: item.product_name,
        variation_name: item.variation_name || null,
        original_price: item.discounted_price,
        discounted_price: item.discounted_price,
        quantity: item.quantity,
        buyer_paid: item.discounted_price * item.quantity,
        total_discount: 0,
        seller_discount: 0,
        shopee_discount: 0,
      };
    });

    const { error: itemError } = await supabase.from("order_items").insert(itemInserts);
    if (itemError) return { error: itemError.message };
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}
