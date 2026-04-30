'use client'

import Link from 'next/link'
import { Eye, TrendingUp, Trash2 } from 'lucide-react'
import formatCurrency from '@/lib/format/currency'
import { deleteAccountingPeriod } from '@/app/dashboard/finance/actions'

interface Period {
  id: string
  start_date: string
  end_date: string
  period_name: string
  total_orders: number
  total_revenue: string
  total_margin: string
  margin_percentage: string
  closed_at: string
}

interface PeriodListProps {
  periods: Period[]
}

export default function PeriodList({ periods }: PeriodListProps) {
  const handleDelete = async (periodId: string, periodName: string) => {
    if (!confirm(`Delete closed period "${periodName}"?\n\nThis will:\n- Unlink all orders from this period\n- Remove all saved statistics\n\nThe orders can be closed again in a new period.`)) {
      return
    }

    const result = await deleteAccountingPeriod(periodId)

    if (result.error) {
      alert(`Failed to delete period: ${result.error}`)
    } else {
      // Refresh the page
      window.location.reload()
    }
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp size={48} className="mx-auto text-[var(--muted)] mb-4" />
        <p className="text-[var(--muted)]">No closed periods yet</p>
        <p className="text-sm text-[var(--muted)] mt-1">
          Close your first billing period to see reports here
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Period
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Orders
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Revenue
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Margin
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Margin %
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Closed
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr
              key={period.id}
              className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="font-medium text-[var(--foreground)]">
                  {period.period_name}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {new Date(period.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  -{' '}
                  {new Date(period.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </td>
              <td className="py-3 px-4 text-right text-[var(--foreground)]">
                {period.total_orders.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right font-medium text-[var(--foreground)]">
                {formatCurrency(parseFloat(period.total_revenue))}
              </td>
              <td className="py-3 px-4 text-right text-[var(--foreground)]">
                {formatCurrency(parseFloat(period.total_margin))}
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    parseFloat(period.margin_percentage) >= 20
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : parseFloat(period.margin_percentage) >= 10
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {parseFloat(period.margin_percentage).toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-4 text-right text-sm text-[var(--muted)]">
                {new Date(period.closed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-1">
                  <Link
                    href={`/dashboard/finance/${period.id}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
                    title="View details"
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(period.id, period.period_name)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-[var(--muted)] hover:text-red-600 dark:hover:text-red-400"
                    title="Delete period"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
