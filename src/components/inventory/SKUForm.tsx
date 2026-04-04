'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createSKU, updateSKU } from '@/app/dashboard/inventory/actions'
import SKUVariations from './SKUVariations'
import SKUFeeAssignment from './SKUFeeAssignment'

interface Fee {
  id: string
  name: string
  percentage: number
  is_active: boolean
}

interface Variation {
  id?: string
  variation_name: string
  base_price_override: number | null
}

interface SKUData {
  id?: string
  name: string
  sku_code: string
  base_price: number
  is_active?: boolean
  variations?: Variation[]
  sku_fees?: { fee_id: string }[]
}

interface SKUFormProps {
  sku?: SKUData
  fees: Fee[]
  onClose: () => void
}

interface VariationInput {
  variation_name: string
  base_price_override: string
}

export default function SKUForm({ sku, fees, onClose }: SKUFormProps) {
  const isEdit = !!sku?.id
  const [name, setName] = useState(sku?.name ?? '')
  const [skuCode, setSkuCode] = useState(sku?.sku_code ?? '')
  const [basePrice, setBasePrice] = useState(sku?.base_price?.toString() ?? '0')
  const [variations, setVariations] = useState<VariationInput[]>(
    sku?.variations?.map((v) => ({
      variation_name: v.variation_name,
      base_price_override: v.base_price_override?.toString() ?? '',
    })) ?? []
  )
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>(
    sku?.sku_fees?.map((f) => f.fee_id) ?? []
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const parsedVariations = variations
      .filter((v) => v.variation_name.trim())
      .map((v) => ({
        variation_name: v.variation_name.trim(),
        base_price_override: v.base_price_override ? parseFloat(v.base_price_override) : null,
      }))

    const data = {
      name: name.trim(),
      sku_code: skuCode.trim(),
      base_price: parseFloat(basePrice) || 0,
      variations: parsedVariations,
      fee_ids: selectedFeeIds,
    }

    const result = isEdit
      ? await updateSKU(sku!.id!, { ...data, is_active: sku!.is_active ?? true })
      : await createSKU(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit SKU' : 'Add SKU'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. SKU-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <SKUVariations variations={variations} onChange={setVariations} />

          <SKUFeeAssignment
            fees={fees}
            selectedFeeIds={selectedFeeIds}
            onChange={setSelectedFeeIds}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
