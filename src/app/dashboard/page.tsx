import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enrichOrderItems } from "@/lib/profit";

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

  const skuIds = [...new Set(items.map(i => i.sku_id).filter(Boolean))] as string[];
  const variationIds = [...new Set(items.map(i => i.variation_id).filter(Boolean))] as string[];

  const [skusPriceRes, variationPriceRes, feesRes] = await Promise.all([
    skuIds.length > 0 ? supabase.from("skus").select("id, base_price").in("id", skuIds) : Promise.resolve({ data: [] }),
    variationIds.length > 0 ? supabase.from("sku_variations").select("id, base_price_override").in("id", variationIds) : Promise.resolve({ data: [] }),
    skuIds.length > 0 ? supabase.from("sku_fees").select("sku_id, value, max_value, fees(fee_type)").in("sku_id", skuIds) : Promise.resolve({ data: [] }),
  ]);

  const skuMap = new Map((skusPriceRes.data ?? []).map(s => [s.id, Number(s.base_price)]));
  const variationMap = new Map((variationPriceRes.data ?? []).map(v => [v.id, v.base_price_override]));

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

  const itemsByOrder = new Map<string, typeof items>();
  for (const i of items) {
    const list = itemsByOrder.get(i.order_id) ?? [];
    list.push(i);
    itemsByOrder.set(i.order_id, list);
  }

  let totalProfit = 0;
  let profitKnown = 0;

  for (const [, orderItems] of itemsByOrder) {
    const enriched = enrichOrderItems(
      orderItems.map(item => ({
        sku_id: item.sku_id,
        variation_id: item.variation_id,
        discounted_price: Number(item.discounted_price),
        quantity: item.quantity,
      })),
      skuMap,
      variationMap,
      feesBySku,
    );

    for (const e of enriched) {
      if (e.margin != null) {
        totalProfit += e.margin;
        profitKnown++;
      }
    }
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--foreground-secondary)] mt-1">Overview of your business</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-[var(--transition-fast)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[var(--primary-light)] rounded-lg"><ShoppingCart size={16} className="text-[var(--primary)]" /></div>
            <span className="text-xs font-medium text-[var(--foreground-secondary)]">Orders</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{totalOrders}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{items.length} items</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-[var(--transition-fast)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[var(--accent-light)] rounded-lg"><Package size={16} className="text-[var(--accent)]" /></div>
            <span className="text-xs font-medium text-[var(--foreground-secondary)]">SKUs</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{skuCount}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Products</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-[var(--transition-fast)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[var(--warning-light)] rounded-lg"><DollarSign size={16} className="text-[var(--warning)]" /></div>
            <span className="text-xs font-medium text-[var(--foreground-secondary)]">Revenue</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{fmt(totalRevenue)}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">From {totalOrders} orders</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-[var(--transition-fast)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[var(--primary-light)] rounded-lg"><TrendingUp size={16} className="text-[var(--primary)]" /></div>
            <span className="text-xs font-medium text-[var(--foreground-secondary)]">Profit</span>
          </div>
          <p className={`text-xl md:text-2xl font-bold ${totalProfit >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
            {profitKnown > 0 ? fmt(totalProfit) : "—"}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {profitKnown > 0 ? `${profitKnown} items tracked` : "Set base prices"}
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 transition-colors duration-[var(--transition-fast)]">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-[var(--foreground-secondary)]">No orders yet. Import your Shopee data to get started.</p>
        ) : (
          <div className="space-y-1">
            {recentOrders.map((o) => {
              const oItems = itemsByOrder.get(o.id) ?? [];
              const itemCount = oItems.reduce((s, i) => s + i.quantity, 0);
              const orderTotal = oItems.reduce((s, i) => s + Number(i.discounted_price) * i.quantity, 0);
              const productSummary = oItems.length <= 2
                ? oItems.map((i) => i.product_name).join(", ")
                : `${oItems[0].product_name} + ${oItems.length - 1} more`;

              return (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all duration-[var(--transition-fast)]">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <span className="text-xs text-[var(--muted)] whitespace-nowrap hidden sm:block">{formatDate(o.created_at)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{productSummary}</p>
                      <p className="text-xs text-[var(--muted)]">{o.order_number} · {itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--foreground)] whitespace-nowrap ml-4">{fmt(orderTotal)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
