'use client'

import { useState } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { adjustWarehouseStock, produceItem } from '@/app/dashboard/inventory/warehouse/actions'

interface WarehouseStockFormProps {
  item: {
    id: string
    name: string
    source_type: 'purchased' | 'produced'
    stock: number
    unit: string
  }
  unitConversions: { unit_name: string; factor: number }[]
  onClose: () => void
}

export default function WarehouseStockForm({ item, unitConversions, onClose }: WarehouseStockFormProps) {
  const [mode, setMode] = useState<'adjust' | 'produce'>(item.source_type === 'produced' ? 'produce' : 'adjust')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState('')
  const [selectedUnit, setSelectedUnit] = useState(item.unit)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const allUnits = [
    { name: item.unit, factor: 1 },
    ...unitConversions.map((c) => ({ name: c.unit_name, factor: c.factor })),
  ]

  const currentFactor = allUnits.find((u) => u.name === selectedUnit)?.factor ?? 1
  const baseQty = Math.round(parseInt(quantity) * currentFactor)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const qty = baseQty
    if (!qty || qty <= 0) {
      setError('Enter a valid quantity')
      setLoading(false)
      return
    }

    let result
    if (mode === 'produce') {
      result = await produceItem({
        produced_item_id: item.id,
        quantity: qty,
        note: note.trim() || undefined,
      })
    } else {
      result = await adjustWarehouseStock({
        warehouse_item_id: item.id,
        type,
        quantity: qty,
        note: note.trim() || undefined,
      })
    }

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
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {mode === 'produce' ? 'Produce' : 'Adjust Stock'} — {item.name}
          </h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        {item.source_type === 'produced' && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode('produce')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
                mode === 'produce'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-[var(--surface-hover)] text-[var(--foreground-secondary)] border border-[var(--border)]'
              }`}
            >
              Produce from BOM
            </button>
            <button
              type="button"
              onClick={() => setMode('adjust')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
                mode === 'adjust'
                  ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]'
                  : 'bg-[var(--surface-hover)] text-[var(--foreground-secondary)] border border-[var(--border)]'
              }`}
            >
              Manual Adjust
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Current stock: <span className="font-medium text-[var(--foreground)]">{item.stock} {item.unit}</span>
          </p>

          {mode === 'adjust' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-1 ${
                  type === 'in'
                    ? 'bg-[var(--accent-light)] text-[var(--accent)] border border-green-200'
                    : 'bg-[var(--surface-hover)] text-[var(--foreground-secondary)] border border-[var(--border)]'
                }`}
              >
                <TrendingUp size={14} /> Stock In
              </button>
              <button
                type="button"
                onClick={() => setType('out')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-1 ${
                  type === 'out'
                    ? 'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]'
                    : 'bg-[var(--surface-hover)] text-[var(--foreground-secondary)] border border-[var(--border)]'
                }`}
              >
                <TrendingDown size={14} /> Stock Out
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="flex-1 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Enter quantity"
                required
              />
              {allUnits.length > 1 && (
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {allUnits.map((u) => (
                    <option key={u.name} value={u.name}>
                      {u.name}{u.factor > 1 ? ` (= ${u.factor} ${item.unit})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {currentFactor > 1 && parseInt(quantity) > 0 && (
              <p className="text-xs text-[var(--muted)] mt-1">
                = {baseQty} {item.unit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Optional note"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
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
                mode === 'produce'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : type === 'in'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : mode === 'produce' ? 'Produce' : type === 'in' ? 'Stock In' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
