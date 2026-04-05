"use server";

import { createClient } from "@/lib/supabase/server";

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
