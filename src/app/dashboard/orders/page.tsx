import { createClient } from "@/lib/supabase/server";
import OrderTable from "@/components/orders/OrderTable";
import { enrichOrderItems } from "@/lib/profit";

export const dynamic = "force-dynamic";

interface OrderItemRow {
  id: string;
  sku_id: string | null;
  variation_id: string | null;
  parent_sku: string;
  product_name: string;
  variation_name: string | null;
  discounted_price: number;
  quantity: number;
  buyer_paid: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  order_status: string;
  created_at: string;
  paid_at: string | null;
  payment_method: string | null;
  buyer_username: string | null;
  city: string | null;
  province: string | null;
  order_items: OrderItemRow[] | null;
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  const typedOrders = (orders ?? []) as unknown as OrderRow[];

  if (!orders || orders.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and recap your Shopee orders
          </p>
        </div>
        <OrderTable orders={[]} />
      </div>
    );
  }

  // Collect unique SKU and variation IDs from all order items
  const skuIds = [...new Set<string>(
    typedOrders.flatMap(o =>
      (o.order_items?.map(i => i.sku_id) ?? []).filter((v): v is string => Boolean(v))
    )
  )];
  const variationIds = [...new Set<string>(
    typedOrders.flatMap(o =>
      (o.order_items?.map(i => i.variation_id) ?? []).filter((v): v is string => Boolean(v))
    )
  )];

  // Fetch SKU base prices, variation overrides, and fees
  const [skusRes, variationsRes, feesRes] = await Promise.all([
    skuIds.length > 0
      ? supabase.from("skus").select("id, base_price").in("id", skuIds)
      : Promise.resolve({ data: [] }),
    variationIds.length > 0
      ? supabase.from("sku_variations").select("id, base_price_override").in("id", variationIds)
      : Promise.resolve({ data: [] }),
    skuIds.length > 0
      ? supabase.from("sku_fees").select("sku_id, value, max_value, fees(fee_type)").in("sku_id", skuIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build lookup maps
  const skuMap = new Map((skusRes.data ?? []).map(s => [s.id, Number(s.base_price)]));
  const variationMap = new Map((variationsRes.data ?? []).map(v => [v.id, v.base_price_override]));

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

  // Enrich orders with calculated financial data using shared logic
  const enrichedOrders = typedOrders.map(order => {
    const enriched = enrichOrderItems(
      (order.order_items ?? []).map(item => ({
        sku_id: item.sku_id,
        variation_id: item.variation_id,
        discounted_price: Number(item.discounted_price),
        quantity: item.quantity,
      })),
      skuMap,
      variationMap,
      feesBySku,
    );

    const rawItems = (order.order_items ?? []);
    const items = enriched.map((e, i) => ({
      product_name: rawItems[i].product_name,
      parent_sku: rawItems[i].parent_sku,
      variation_name: rawItems[i].variation_name,
      quantity: rawItems[i].quantity,
      selling_price: e.selling_price,
      base_price: e.base_price,
      admin_fee: e.admin_fee,
      margin: e.margin,
    }));

    // Order-level totals
    const total_selling = items.reduce((s, i) => s + i.selling_price, 0);
    const hasNullBase = items.some(i => i.base_price === null);
    const total_base = hasNullBase ? null : items.reduce((s, i) => s + (i.base_price ?? 0), 0);
    const total_admin_fee = items.reduce((s, i) => s + i.admin_fee, 0);
    const total_margin = total_base != null ? Math.round(total_selling - total_base - total_admin_fee) : null;

    return {
      id: order.id,
      order_number: order.order_number,
      order_status: order.order_status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      payment_method: order.payment_method,
      buyer_username: order.buyer_username,
      city: order.city,
      province: order.province,
      items,
      total_selling,
      total_base,
      total_admin_fee,
      total_margin,
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and recap your Shopee orders
        </p>
      </div>
      <OrderTable orders={enrichedOrders} />
    </div>
  );
}
