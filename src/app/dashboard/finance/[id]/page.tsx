import { createClient } from '@/lib/supabase/server'
import { getPeriodDetails } from '../actions'
import { notFound } from 'next/navigation'
import PeriodDetailView from '@/components/finance/PeriodDetailView'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getPeriodDetails(id)

  if ('error' in result || !result.period) {
    notFound()
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/dashboard/finance"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Periods
        </Link>
      </div>

      <PageHeader
        title={result.period.period_name}
        subtitle="Detailed revenue and margin breakdown by SKU"
      />

      <PeriodDetailView period={result.period} stats={result.stats} />
    </div>
  )
}
