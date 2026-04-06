import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [ordersRes, itemsRes, skusRes] = await Promise.all([
    supabase.from("orders").select("id, order_number, order_status, created_at").order("created_at", { ascending: false }),
    supabase.from("order_items").select("id, order_id, sku_id, variation_id, product_name, discounted_price, quantity"),
    supabase.from("skus").select("id"),
  ]);

  const orders = ordersRes.data ?? [];
  const items = itemsRes.data ?? [];
  const skuCount = skusRes.data?.length ?? 0;
  const totalOrders = orders.length;
  const totalRevenue = items.reduce((sum, i) => sum + Number(i.discounted_price) * i.quantity, 0);

  // Fetch prices & fees for profit calc
  const skuIds = [...new Set(items.map((i) => i.sku_id).filter(Boolean))] as string[];
  const variationIds = [...new Set(items.map((i) => i.variation_id).filter(Boolean))] as string[];

  const [skusPriceRes, variationPriceRes, feesRes] = await Promise.all([
    skuIds.length > 0 ? supabase.from("skus").select("id, base_price").in("id", skuIds) : Promise.resolve({ data: [] }),
    variationIds.length > 0 ? supabase.from("sku_variations").select("id, base_price_override").in("id", variationIds) : Promise.resolve({ data: [] }),
    skuIds.length > 0 ? supabase.from("sku_fees").select("sku_id, value, max_value, fees(fee_type)").in("sku_id", skuIds) : Promise.resolve({ data: [] }),
  ]);

  const skuMap = new Map((skusPriceRes.data ?? []).map((s) => [s.id, Number(s.base_price)]));
  const variationMap = new Map((variationPriceRes.data ?? []).map((v) => [v.id, v.base_price_override]));

  const feesBySku = new Map<string, { fee_type: string; value: number; max_value: number | null }[]>();
  for (const sf of (feesRes.data ?? [])) {
    const list = feesBySku.get(sf.sku_id) ?? [];
    list.push({
      fee_type: (sf.fees as unknown as { fee_type: string })?.fee_type ?? "percentage",
      value: Number(sf.value),
      max_value: sf.max_value != null ? Number(sf.max_value) : null,
    });
    feesBySku.set(sf.sku_id, list);
  }

  let totalProfit = 0;
  let profitKnown = 0;
  const ORDER_FLAT_FEE = 1250;

  // Group items by order to distribute flat fee per order
  const itemsByOrder = new Map<string, typeof items>();
  for (const i of items) {
    const list = itemsByOrder.get(i.order_id) ?? [];
    list.push(i);
    itemsByOrder.set(i.order_id, list);
  }

  for (const [, orderItems] of itemsByOrder) {
    // First pass: calculate per-item base price and sku admin fee
    const enriched = orderItems.map(item => {
      const sp = Number(item.discounted_price) * item.quantity;
      let basePrice: number | null = null;
      if (item.variation_id && variationMap.has(item.variation_id)) {
        const o = variationMap.get(item.variation_id);
        if (o != null) basePrice = Number(o) * item.quantity;
      } else if (item.sku_id && skuMap.has(item.sku_id)) {
        basePrice = skuMap.get(item.sku_id)! * item.quantity;
      }
      let adminFee = 0;
      if (item.sku_id && feesBySku.has(item.sku_id)) {
        for (const fee of feesBySku.get(item.sku_id)!) {
          let fa = fee.fee_type === "percentage" ? (fee.value / 100) * sp : fee.value;
          if (fee.max_value != null) fa = Math.min(fa, fee.max_value);
          adminFee += fa;
        }
      }
      return { sellingPrice: sp, basePrice, adminFee: Math.round(adminFee) };
    });

    // Second pass: distribute flat per-order fee proportionally (same as orders page)
    const totalSelling = enriched.reduce((s, i) => s + i.sellingPrice, 0);
    let feeRemaining = ORDER_FLAT_FEE;
    const final = enriched.map((item, idx) => {
      const share = idx < enriched.length - 1
        ? Math.round((item.sellingPrice / totalSelling) * ORDER_FLAT_FEE)
        : feeRemaining;
      feeRemaining -= share;
      const admin_fee = item.adminFee + share;
      const margin = item.basePrice != null ? Math.round(item.sellingPrice - item.basePrice - admin_fee) : null;
      return { margin };
    });

    // Sum margins of items with known base price
    for (const f of final) {
      if (f.margin != null) {
        totalProfit += f.margin;
        profitKnown++;
      }
    }
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your business</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-50 rounded-lg"><ShoppingCart size={16} className="text-blue-600" /></div>
            <span className="text-xs font-medium text-gray-500">Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} items</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-50 rounded-lg"><Package size={16} className="text-green-600" /></div>
            <span className="text-xs font-medium text-gray-500">SKUs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{skuCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Products</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-yellow-50 rounded-lg"><DollarSign size={16} className="text-yellow-600" /></div>
            <span className="text-xs font-medium text-gray-500">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-0.5">From {totalOrders} orders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-50 rounded-lg"><TrendingUp size={16} className="text-purple-600" /></div>
            <span className="text-xs font-medium text-gray-500">Profit</span>
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
            {profitKnown > 0 ? fmt(totalProfit) : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {profitKnown > 0 ? `${profitKnown} items tracked` : "Set base prices"}
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet. Import your Shopee data to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => {
              const oItems = itemsByOrder.get(o.id) ?? [];
              const itemCount = oItems.reduce((s, i) => s + i.quantity, 0);
              const orderTotal = oItems.reduce((s, i) => s + Number(i.discounted_price) * i.quantity, 0);
              const productSummary = oItems.length <= 2
                ? oItems.map((i) => i.product_name).join(", ")
                : `${oItems[0].product_name} + ${oItems.length - 1} more`;

              return (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(o.created_at)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{productSummary}</p>
                      <p className="text-xs text-gray-500">{o.order_number} · {itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-4">{fmt(orderTotal)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
