'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Target,
  ArrowUpDown,
  Receipt,
  Percent,
} from 'lucide-react'
import formatCurrency from '@/lib/format/currency'

interface Period {
  id: string
  period_name: string
  start_date: string
  end_date: string
  total_orders: number
  total_items_sold: number
  total_revenue: string
  total_cost: string
  total_cogs: string
  total_admin_fee: string
  total_service_fee: string
  total_other_fees: string
  total_margin: string
  margin_percentage: string
}

interface SKUStat {
  id: string
  sku_id: string
  sku_code: string
  sku_name: string
  quantity_sold: number
  total_revenue: string
  total_cogs: string
  total_admin_fee: string
  total_service_fee: string
  total_other_fees: string
  total_margin: string
  revenue_percentage: string
}

interface PeriodDetailViewProps {
  period: Period
  stats: SKUStat[]
}

type SortField = 'quantity_sold' | 'total_revenue' | 'total_margin' | 'revenue_percentage'
type SortOrder = 'asc' | 'desc'

export default function PeriodDetailView({ period, stats }: PeriodDetailViewProps) {
  const [sortField, setSortField] = useState<SortField>('total_revenue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const sortedStats = [...stats].sort((a, b) => {
    const aVal = parseFloat(a[sortField] as string)
    const bVal = parseFloat(b[sortField] as string)
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const revenue = parseFloat(period.total_revenue)
  const cogs = parseFloat(period.total_cogs)
  const adminFee = parseFloat(period.total_admin_fee)
  const serviceFee = parseFloat(period.total_service_fee)
  const otherFees = parseFloat(period.total_other_fees)
  const totalFees = adminFee + serviceFee + otherFees
  const margin = parseFloat(period.total_margin)
  const marginPercent = parseFloat(period.margin_percentage)

  return (
    <div className="space-y-6">
      {/* Summary Cards - Main Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Revenue</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {formatCurrency(revenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">COGS</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {formatCurrency(cogs)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Receipt size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Fees</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {formatCurrency(totalFees)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${margin >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {margin >= 0 ? (
                <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Margin</p>
              <p className={`text-lg font-semibold ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(margin)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Percent size={20} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Margin %</p>
              <p className={`text-lg font-semibold ${marginPercent >= 20 ? 'text-green-600 dark:text-green-400' : marginPercent >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {marginPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <TrendingUp size={20} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Orders</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {period.total_orders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Package size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Items Sold</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {period.total_items_sold.toLocaleString()} pcs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      {(adminFee > 0 || serviceFee > 0 || otherFees > 0) && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Fee Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminFee > 0 && (
              <div className="bg-[var(--accent)]/30 rounded-lg p-4">
                <p className="text-sm text-[var(--muted)] mb-1">Admin Fee</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  {formatCurrency(adminFee)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {revenue > 0 ? ((adminFee / revenue) * 100).toFixed(1) : 0}% of revenue
                </p>
              </div>
            )}
            {serviceFee > 0 && (
              <div className="bg-[var(--accent)]/30 rounded-lg p-4">
                <p className="text-sm text-[var(--muted)] mb-1">Service Fee</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  {formatCurrency(serviceFee)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {revenue > 0 ? ((serviceFee / revenue) * 100).toFixed(1) : 0}% of revenue
                </p>
              </div>
            )}
            {otherFees > 0 && (
              <div className="bg-[var(--accent)]/30 rounded-lg p-4">
                <p className="text-sm text-[var(--muted)] mb-1">Other Fees</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">
                  {formatCurrency(otherFees)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {revenue > 0 ? ((otherFees / revenue) * 100).toFixed(1) : 0}% of revenue
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SKU Breakdown Table */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          SKU Breakdown
        </h2>

        {stats.length === 0 ? (
          <p className="text-[var(--muted)] text-center py-8">No SKU data for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
                    SKU Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
                    Product Name
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
                    onClick={() => toggleSort('quantity_sold')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Qty
                      <ArrowUpDown size={14} className={sortField === 'quantity_sold' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
                    onClick={() => toggleSort('total_revenue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revenue
                      <ArrowUpDown size={14} className={sortField === 'total_revenue' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
                    COGS
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)]">
                    Fees
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
                    onClick={() => toggleSort('total_margin')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Margin
                      <ArrowUpDown size={14} className={sortField === 'total_margin' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--foreground)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
                    onClick={() => toggleSort('revenue_percentage')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Rev %
                      <ArrowUpDown size={14} className={sortField === 'revenue_percentage' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((stat) => {
                  const statCogs = parseFloat(stat.total_cogs)
                  const statAdminFee = parseFloat(stat.total_admin_fee)
                  const statServiceFee = parseFloat(stat.total_service_fee)
                  const statOtherFees = parseFloat(stat.total_other_fees)
                  const statFees = statAdminFee + statServiceFee + statOtherFees
                  const statMargin = parseFloat(stat.total_margin)

                  return (
                    <tr
                      key={stat.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-sm text-[var(--muted)]">
                        {stat.sku_code}
                      </td>
                      <td className="py-3 px-4 text-[var(--foreground)]">
                        {stat.sku_name}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--foreground)]">
                        {stat.quantity_sold.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--foreground)]">
                        {formatCurrency(parseFloat(stat.total_revenue))}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--muted)]">
                        {formatCurrency(statCogs)}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--muted)]">
                        {formatCurrency(statFees)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={statMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {formatCurrency(statMargin)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-[var(--foreground)]">
                            {parseFloat(stat.revenue_percentage).toFixed(1)}%
                          </span>
                          <div className="w-16 h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] rounded-full"
                              style={{ width: `${Math.min(parseFloat(stat.revenue_percentage), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
