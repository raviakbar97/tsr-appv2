'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Factory, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
  id: string
  type: 'in' | 'out' | 'production' | 'order_deduction'
  quantity: number
  reference_id: string | null
  note: string | null
  created_at: string
}

interface BOMRow {
  ingredient_item_id: string
  quantity_per_unit: number
  ingredient?: { id: string; name: string; unit: string; buying_price: number }
}

interface WarehouseTransactionHistoryProps {
  item: {
    id: string
    name: string
    source_type: 'purchased' | 'produced'
    stock: number
    unit: string
    buying_price: number
    warehouse_bom?: BOMRow[]
  }
  onClose: () => void
}

const typeLabels: Record<string, { label: string; color: string }> = {
  in: { label: 'Stock In', color: 'bg-green-50 text-[var(--accent)]' },
  out: { label: 'Stock Out', color: 'bg-[var(--danger-light)] text-[var(--danger)]' },
  production: { label: 'Production', color: 'bg-purple-50 text-purple-700' },
  order_deduction: { label: 'Order Deduction', color: 'bg-amber-50 text-[var(--warning)]' },
}

export default function WarehouseTransactionHistory({ item, onClose }: WarehouseTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      const supabase = createClient()
      const { data } = await supabase
        .from('warehouse_transactions')
        .select('*')
        .eq('warehouse_item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setTransactions(data ?? [])
      setLoading(false)
    }
    fetchTransactions()
  }, [item.id])

  const bomCost = item.warehouse_bom?.reduce((sum, b) => {
    const ingredient = b.ingredient
    return sum + (ingredient ? ingredient.buying_price * b.quantity_per_unit : 0)
  }, 0) ?? 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {item.name} — Details
          </h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        {/* Item Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--surface-hover)] rounded-lg p-3">
            <p className="text-xs text-[var(--muted)] mb-1">Type</p>
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${
              item.source_type === 'purchased' ? 'text-[var(--primary)]' : 'text-purple-700'
            }`}>
              {item.source_type === 'purchased' ? <ShoppingCart size={14} /> : <Factory size={14} />}
              {item.source_type === 'purchased' ? 'Purchased' : 'Produced'}
            </span>
          </div>
          <div className="bg-[var(--surface-hover)] rounded-lg p-3">
            <p className="text-xs text-[var(--muted)] mb-1">Current Stock</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{item.stock} {item.unit}</p>
          </div>
          <div className="bg-[var(--surface-hover)] rounded-lg p-3">
            <p className="text-xs text-[var(--muted)] mb-1">Buying Price</p>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Rp {Number(item.source_type === 'produced' && bomCost > 0 ? bomCost : item.buying_price).toLocaleString('id-ID')}
              {item.source_type === 'produced' && bomCost > 0 && (
                <span className="text-xs text-[var(--muted)] ml-1">(BOM cost)</span>
              )}
            </p>
          </div>
        </div>

        {/* BOM Breakdown */}
        {item.source_type === 'produced' && item.warehouse_bom && item.warehouse_bom.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Bill of Materials</h3>
            <div className="bg-[var(--surface-hover)] rounded-lg p-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--muted)] text-xs">
                    <th className="text-left pb-2 font-medium">Ingredient</th>
                    <th className="text-right pb-2 font-medium">Qty</th>
                    <th className="text-right pb-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.warehouse_bom.map((b, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-[var(--foreground)]">{b.ingredient?.name ?? 'Unknown'}</td>
                      <td className="py-1.5 text-right text-[var(--foreground-secondary)]">{b.quantity_per_unit}</td>
                      <td className="py-1.5 text-right text-[var(--foreground-secondary)]">
                        Rp {Number(b.ingredient ? b.ingredient.buying_price * b.quantity_per_unit : 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td className="py-1.5 text-[var(--foreground)]">Total</td>
                    <td className="py-1.5"></td>
                    <td className="py-1.5 text-right text-[var(--foreground)]">
                      Rp {Number(bomCost).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Transaction History</h3>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No transactions yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] text-xs">
                  <th className="text-left pb-2 font-medium">Date</th>
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-right pb-2 font-medium">Qty</th>
                  <th className="text-left pb-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 text-[var(--foreground-secondary)]">
                      {new Date(t.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeLabels[t.type]?.color ?? 'bg-[var(--surface-hover)] text-[var(--foreground-secondary)]'}`}>
                        {typeLabels[t.type]?.label ?? t.type}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-[var(--foreground)]">{t.quantity}</td>
                    <td className="py-2 text-[var(--muted)]">{t.note ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface-hover)] rounded-lg hover:bg-[var(--border)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
