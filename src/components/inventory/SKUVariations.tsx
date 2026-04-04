'use client'

import { Plus, Trash2 } from 'lucide-react'

interface Variation {
  variation_name: string
  base_price_override: string
}

interface SKUVariationsProps {
  variations: Variation[]
  onChange: (variations: Variation[]) => void
}

export default function SKUVariations({ variations, onChange }: SKUVariationsProps) {
  function addVariation() {
    onChange([...variations, { variation_name: '', base_price_override: '' }])
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
        <label className="block text-sm font-medium text-gray-700">Variations</label>
        <button
          type="button"
          onClick={addVariation}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={14} /> Add Variation
        </button>
      </div>

      {variations.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No variations. Click &quot;Add Variation&quot; to add options like size, color, etc.</p>
      ) : (
        <div className="space-y-2">
          {variations.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={v.variation_name}
                onChange={(e) => updateVariation(i, 'variation_name', e.target.value)}
                placeholder="Variation name"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={v.base_price_override}
                onChange={(e) => updateVariation(i, 'base_price_override', e.target.value)}
                placeholder="Price override (optional)"
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeVariation(i)}
                className="p-1.5 text-gray-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
