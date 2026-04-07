'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createStockTransaction } from '@/app/dashboard/inventory/stock/actions'

interface Variation {
  id: string
  variation_name: string
}

interface StockFormProps {
  skuId: string
  variations: Variation[]
  onClose: () => void
}

export default function StockForm({ skuId, variations, onClose }: StockFormProps) {
  const [type, setType] = useState<'in' | 'out'>('in')
  const [variationId, setVariationId] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await createStockTransaction({
      sku_id: skuId,
      variation_id: variationId || null,
      quantity: parseInt(quantity),
      type,
      transaction_date: date,
      notes,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Record Stock Movement</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  type === 'in'
                    ? 'bg-green-50 border-green-300 text-[var(--accent)]'
                    : 'border-[var(--border-strong)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                Stock In
              </button>
              <button
                type="button"
                onClick={() => setType('out')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  type === 'out'
                    ? 'bg-[var(--danger-light)] border-red-300 text-[var(--danger)]'
                    : 'border-[var(--border-strong)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                Stock Out
              </button>
            </div>
          </div>

          {variations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Variation</label>
              <select
                value={variationId}
                onChange={(e) => setVariationId(e.target.value)}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Default (no variation)</option>
                {variations.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variation_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Optional notes"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface-hover)] rounded-lg hover:bg-[var(--border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                type === 'in'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Saving...' : `Record Stock ${type === 'in' ? 'In' : 'Out'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
