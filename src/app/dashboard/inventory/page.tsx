import { createClient } from '@/lib/supabase/server'
import SKUTable from '@/components/inventory/SKUTable'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: skus }, { data: fees }] = await Promise.all([
    supabase
      .from('skus')
      .select(`*, sku_variations(*), sku_fees(fee_id, value, max_value, fee_tier_id, fees(*, fee_tiers(*)))`)
      .order('created_at', { ascending: false }),
    supabase.from('fees').select('*, fee_tiers(*)').order('name'),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your SKUs, variations, and fee assignments
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SKUTable skus={skus ?? []} fees={fees ?? []} />
      </div>
    </div>
  )
}
