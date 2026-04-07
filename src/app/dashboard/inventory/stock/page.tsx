import { createClient } from '@/lib/supabase/server'
import StockHistory from '@/components/inventory/StockHistory'
import StockPageClient from './StockPageClient'
import PageHeader from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function StockPage() {
  const supabase = await createClient()

  const [
    { data: transactions },
    { data: skus },
    { data: fees },
  ] = await Promise.all([
    supabase
      .from('inventory_transactions')
      .select('*, skus(name, sku_code)')
      .order('created_at', { ascending: false }),
    supabase
      .from('skus')
      .select('*, sku_variations(*)')
      .eq('is_active', true)
      .order('name'),
    supabase.from('fees').select('*').eq('is_active', true),
  ])

  // Collect all variations across SKUs
  const allVariations =
    skus?.flatMap((s) => s.sku_variations ?? []) ?? []

  return (
    <div>
      <PageHeader title="Stock Movements" subtitle="Record and view all stock in/out transactions" />

      <div className="mb-6">
        <StockPageClient skus={skus ?? []} />
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Transaction History</h2>
        <StockHistory transactions={transactions ?? []} variations={allVariations} />
      </div>
    </div>
  )
}
