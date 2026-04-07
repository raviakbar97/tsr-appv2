'use client'

import { Plus, Trash2 } from 'lucide-react'

interface Variation {
  variation_name: string
  base_price_override: string
  warehouse_item_id: string
  warehouse_item_qty: string
}

interface WarehouseItem {
  id: string
  name: string
  unit: string
  source_type: 'purchased' | 'produced'
}

interface SKUVariationsProps {
  variations: Variation[]
  onChange: (variations: Variation[]) => void
  warehouseItems?: WarehouseItem[]
}

export default function SKUVariations({ variations, onChange, warehouseItems = [] }: SKUVariationsProps) {
  function sanitizePrice(raw: string): string {
    let s = raw.replace(/[Rr]p\.?\s?/g, '').replace(/[^\d.,]/g, '')
    if (!s) return ''
    const decMatch = s.match(/[.,](\d{1,2})$/)
    if (decMatch) {
      const intPart = s.slice(0, -decMatch[0].length).replace(/[.,]/g, '')
      return intPart + '.' + decMatch[1]
    }
    return s.replace(/[.,]/g, '')
  }

  function addVariation() {
    onChange([...variations, { variation_name: '', base_price_override: '', warehouse_item_id: '', warehouse_item_qty: '1' }])
  }

  function removeVariation(index: number) {
    onChange(variations.filter((_, i) => i !== index))
  }

  function updateVariation(index: number, field: keyof Variation, value: string) {
    const updated = [...variations]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-[var(--foreground-secondary)]">Variations</label>
        <button
          type="button"
          onClick={addVariation}
          className="text-sm text-[var(--primary)] hover:text-[var(--primary)] flex items-center gap-1"
        >
          <Plus size={14} /> Add Variation
        </button>
      </div>

      {variations.length === 0 ? (
        <p className="text-xs text-[var(--muted)] py-2">No variations. Click &quot;Add Variation&quot; to add options like size, color, etc.</p>
      ) : (
        <div className="space-y-3">
          {variations.map((v, i) => (
            <div key={i} className="border border-[var(--border)] rounded-lg p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={v.variation_name}
                  onChange={(e) => updateVariation(i, 'variation_name', e.target.value)}
                  placeholder="Variation name"
                  className="flex-1 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={v.base_price_override}
                  onChange={(e) => updateVariation(i, 'base_price_override', sanitizePrice(e.target.value))}
                  onBlur={(e) => updateVariation(i, 'base_price_override', sanitizePrice(e.target.value))}
                  placeholder="Price"
                  className="w-32 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeVariation(i)}
                  className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {warehouseItems.length > 0 && (
                <div className="flex gap-2 items-center">
                  <select
                    value={v.warehouse_item_id}
                    onChange={(e) => updateVariation(i, 'warehouse_item_id', e.target.value)}
                    className="flex-1 border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">No warehouse link</option>
                    {warehouseItems.map((wi) => (
                      <option key={wi.id} value={wi.id}>
                        {wi.name} ({wi.source_type})
                      </option>
                    ))}
                  </select>
                  {v.warehouse_item_id && (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={v.warehouse_item_qty}
                      onChange={(e) => updateVariation(i, 'warehouse_item_qty', e.target.value.replace(/[^\d]/g, ''))}
                      className="w-16 border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Qty"
                      title="Qty of warehouse item consumed per 1 unit sold"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
