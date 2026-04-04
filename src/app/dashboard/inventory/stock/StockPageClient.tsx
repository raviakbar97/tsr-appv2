'use client'

import { useState } from 'react'
import StockForm from '@/components/inventory/StockForm'

interface Variation {
  id: string
  variation_name: string
}

interface SKU {
  id: string
  name: string
  sku_code: string
  sku_variations: Variation[]
}

interface StockPageClientProps {
  skus: SKU[]
}

export default function StockPageClient({ skus }: StockPageClientProps) {
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null)

  return (
    <>
      <div className="flex items-center gap-3">
        <select
          onChange={(e) => {
            const sku = skus.find((s) => s.id === e.target.value)
            setSelectedSku(sku ?? null)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue=""
        >
          <option value="" disabled>
            Select SKU to record stock movement...
          </option>
          {skus.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.sku_code})
            </option>
          ))}
        </select>
        {selectedSku && (
          <button
            onClick={() => setSelectedSku(selectedSku)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Record Movement
          </button>
        )}
      </div>

      {selectedSku && (
        <StockForm
          skuId={selectedSku.id}
          variations={selectedSku.sku_variations ?? []}
          onClose={() => setSelectedSku(null)}
        />
      )}
    </>
  )
}
