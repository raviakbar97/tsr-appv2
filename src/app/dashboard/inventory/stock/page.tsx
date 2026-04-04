import { createClient } from '@/lib/supabase/server'
import StockHistory from '@/components/inventory/StockHistory'
import StockPageClient from './StockPageClient'

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record and view all stock in/out transactions
        </p>
      </div>

      <div className="mb-6">
        <StockPageClient skus={skus ?? []} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Transaction History</h2>
        <StockHistory transactions={transactions ?? []} variations={allVariations} />
      </div>
    </div>
  )
}
