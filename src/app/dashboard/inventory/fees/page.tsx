import { createClient } from '@/lib/supabase/server'
import FeeTable from '@/components/inventory/FeeTable'

export const dynamic = 'force-dynamic'

export default async function FeesPage() {
  const supabase = await createClient()
  const { data: fees } = await supabase
    .from('fees')
    .select('*, fee_tiers(*)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Registry</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage fee types that can be assigned to SKUs. Add tiers to pre-define value options.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <FeeTable fees={fees ?? []} />
      </div>
    </div>
  )
}
