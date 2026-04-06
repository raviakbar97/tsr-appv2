import { createClient } from '@/lib/supabase/server'
import PurchaseOrderTable from '@/components/inventory/PurchaseOrderTable'

export const dynamic = 'force-dynamic'

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()

  const [{ data: purchaseOrders }, { data: warehouseItems }, { data: convRows }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*, purchase_order_items(*, warehouse_items(id, name, unit))')
      .order('created_at', { ascending: false }),
    supabase
      .from('warehouse_items')
      .select('id, name, unit, buying_price, source_type')
      .eq('is_active', true),
    supabase
      .from('warehouse_unit_conversions')
      .select('warehouse_item_id, unit_name, factor'),
  ])

  // Attach conversions to warehouse items
  const convMap = new Map<string, { unit_name: string; factor: number }[]>()
  if (convRows) {
    for (const row of convRows) {
      const list = convMap.get(row.warehouse_item_id) ?? []
      list.push({ unit_name: row.unit_name, factor: Number(row.factor) })
      convMap.set(row.warehouse_item_id, list)
    }
  }
  const itemsWithConvs = (warehouseItems ?? []).map((item) => ({
    ...item,
    unit_conversions: convMap.get(item.id) ?? [],
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record incoming stock from suppliers
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PurchaseOrderTable
          purchaseOrders={purchaseOrders ?? []}
          warehouseItems={itemsWithConvs}
        />
      </div>
    </div>
  )
}
