'use client'

import { Trash2 } from 'lucide-react'
import { deleteStockTransaction } from '@/app/dashboard/inventory/stock/actions'

interface Variation {
  id: string
  variation_name: string
}

interface Transaction {
  id: string
  sku_id: string
  quantity: number
  type: 'in' | 'out'
  transaction_date: string
  notes: string | null
  variation_id: string | null
  created_at: string
  skus: { name: string; sku_code: string }
}

interface StockHistoryProps {
  transactions: Transaction[]
  variations: Variation[]
}

export default function StockHistory({ transactions, variations }: StockHistoryProps) {
  async function handleDelete(id: string, skuId: string) {
    if (confirm('Delete this transaction?')) {
      await deleteStockTransaction(id, skuId)
    }
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-hover)]">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Date</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">SKU</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Variation</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Type</th>
            <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)]">Qty</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Notes</th>
            <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)]"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-[var(--muted)]">
                No stock movements recorded yet
              </td>
            </tr>
          ) : (
            transactions.map((t) => {
              const variation = variations.find((v) => v.id === t.variation_id)
              return (
                <tr key={t.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3 text-[var(--foreground-secondary)]">{t.transaction_date}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--foreground)]">{t.skus.name}</span>
                    <span className="text-xs text-[var(--muted)] ml-1">({t.skus.sku_code})</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-secondary)]">
                    {variation?.variation_name ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.type === 'in'
                          ? 'bg-green-50 text-[var(--accent)]'
                          : 'bg-[var(--danger-light)] text-[var(--danger)]'
                      }`}
                    >
                      {t.type === 'in' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--foreground)]">{t.quantity}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{t.notes ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(t.id, t.sku_id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--danger)]"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
