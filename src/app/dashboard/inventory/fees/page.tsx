import { createClient } from '@/lib/supabase/server'
import FeeTable from '@/components/inventory/FeeTable'
import PageHeader from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function FeesPage() {
  const supabase = await createClient()
  const { data: fees } = await supabase
    .from('fees')
    .select('*, fee_tiers(*)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title="Fee Registry" subtitle="Manage fee types that can be assigned to SKUs. Add tiers to pre-define value options." />

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
        <FeeTable fees={fees ?? []} />
      </div>
    </div>
  )
}
