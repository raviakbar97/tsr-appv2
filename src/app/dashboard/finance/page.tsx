import { createClient } from '@/lib/supabase/server'
import PeriodList from '@/components/finance/PeriodList'
import ClosePeriodButton from '@/components/finance/ClosePeriodButton'
import { getAvailablePeriods } from './actions'
import PageHeader from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const supabase = await createClient()

  const [{ data: periods }, availablePeriods] = await Promise.all([
    supabase
      .from('accounting_periods')
      .select('*')
      .order('start_date', { ascending: false }),
    getAvailablePeriods(),
  ])

  const closableCount = availablePeriods.filter((p) => p.canClose).length

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Billing period closing and revenue analysis"
      />

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-[var(--muted)]">
          {closableCount > 0 ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {closableCount} period{closableCount !== 1 ? 's' : ''} ready to close
            </span>
          ) : availablePeriods.length === 0 ? (
            <span>No periods available yet</span>
          ) : (
            <span>
              {availablePeriods.length} pending period{availablePeriods.length !== 1 ? 's' : ''} (incomplete)
            </span>
          )}
        </div>
        <ClosePeriodButton />
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Closed Periods
        </h2>
        <PeriodList periods={periods ?? []} />
      </div>
    </div>
  )
}
