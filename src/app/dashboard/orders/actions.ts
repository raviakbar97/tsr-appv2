"use server";

import { createClient } from "@/lib/supabase/server";

export async function pruneOrders(mode: "all" | "range", from?: string, to?: string) {
  const supabase = await createClient();

  if (mode === "all") {
    // Delete all order_items first, then orders (or use CASCADE)
    const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return { error: error.message };
    return { success: true };
  }

  if (mode === "range" && from && to) {
    // Delete orders where created_at falls within [from, to] (inclusive)
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
