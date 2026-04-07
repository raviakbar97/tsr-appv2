import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import WarehouseTable from '@/components/inventory/WarehouseTable'
import PageHeader from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function WarehousePage() {
  const supabase = await createClient()

  const [{ data: items }, { data: bomRows }, { data: convRows }] = await Promise.all([
    supabase
      .from('warehouse_items')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('warehouse_bom')
      .select('produced_item_id, ingredient_item_id, quantity_per_unit'),
    supabase
      .from('warehouse_unit_conversions')
      .select('warehouse_item_id, unit_name, factor'),
  ])

  // Build a map of produced_item_id → BOM ingredients with ingredient details
  const bomMap = new Map<string, { ingredient_item_id: string; quantity_per_unit: number; ingredient?: { id: string; name: string; unit: string; buying_price: number } }[]>()

  // Build a map of warehouse_item_id → unit conversions
  const convMap = new Map<string, { unit_name: string; factor: number }[]>()
  if (convRows && convRows.length > 0) {
    for (const row of convRows) {
      const list = convMap.get(row.warehouse_item_id) ?? []
      list.push({ unit_name: row.unit_name, factor: Number(row.factor) })
      convMap.set(row.warehouse_item_id, list)
    }
  }

  if (bomRows && bomRows.length > 0 && items) {
    const itemMap = new Map(items.map((i) => [i.id, i]))
    for (const row of bomRows) {
      const list = bomMap.get(row.produced_item_id) ?? []
      const ingredientItem = itemMap.get(row.ingredient_item_id)
      list.push({
        ingredient_item_id: row.ingredient_item_id,
        quantity_per_unit: row.quantity_per_unit,
        ingredient: ingredientItem
          ? { id: ingredientItem.id, name: ingredientItem.name, unit: ingredientItem.unit, buying_price: Number(ingredientItem.buying_price) }
          : undefined,
      })
      bomMap.set(row.produced_item_id, list)
    }
  }

  // Attach BOM to items
  const itemsWithBom = (items ?? []).map((item) => ({
    ...item,
    warehouse_bom: bomMap.get(item.id) ?? [],
    unit_conversions: convMap.get(item.id) ?? [],
  }))

  return (
    <div>
      <PageHeader title="Warehouse" subtitle="Manage raw materials, produced items, and Bill of Materials">
        <Link
          href="/dashboard/inventory/warehouse/po"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary-light)] rounded-lg hover:bg-[var(--primary-light)] transition-colors duration-[var(--transition-fast)]"
        >
          <ClipboardList size={16} /> Purchase Orders
        </Link>
      </PageHeader>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
        <WarehouseTable items={itemsWithBom} allItems={itemsWithBom} />
      </div>
    </div>
  )
}
