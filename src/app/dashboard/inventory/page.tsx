import { createClient } from '@/lib/supabase/server'
import SKUTable from '@/components/inventory/SKUTable'
import PageHeader from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: skus }, { data: fees }, { data: warehouseItems }] = await Promise.all([
    supabase
      .from('skus')
      .select(`*, sku_variations(*), sku_fees(fee_id, value, max_value, fee_tier_id, fees(*, fee_tiers(*)))`)
      .order('created_at', { ascending: false }),
    supabase.from('fees').select('*, fee_tiers(*)').order('name'),
    supabase.from('warehouse_items').select('id, name, unit, source_type').eq('is_active', true).order('name'),
  ])

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage your SKUs, variations, and fee assignments" />

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
        <SKUTable skus={skus ?? []} fees={fees ?? []} warehouseItems={warehouseItems ?? []} />
      </div>
    </div>
  )
}
