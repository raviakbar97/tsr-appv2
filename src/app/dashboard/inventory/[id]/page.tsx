import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SKUDetailView from '@/components/inventory/SKUDetailView'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SKUDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: sku }, { data: fees }, { data: stockRows }, { data: transactions }] =
    await Promise.all([
      supabase
        .from('skus')
        .select(`*, sku_variations(*), sku_fees(fee_id, value, max_value, fees(*))`)
        .eq('id', id)
        .single(),
      supabase.from('fees').select('*').eq('is_active', true).order('name'),
      supabase.from('current_stock').select('*').eq('sku_id', id),
      supabase
        .from('inventory_transactions')
        .select('*')
        .eq('sku_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (!sku) notFound()

  return (
    <SKUDetailView
      sku={sku}
      fees={fees ?? []}
      stockRows={stockRows ?? []}
      transactions={transactions ?? []}
    />
  )
}
