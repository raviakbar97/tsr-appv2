'use client'

import { useState } from 'react'
import { createFee, updateFee } from '@/app/dashboard/inventory/fees/actions'
import { X, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

interface FeeTier {
  id: string
  tier_name: string
  value: number
  max_value: number | null
  sort_order: number
}

interface Fee {
  id: string
  name: string
  fee_type: 'fixed' | 'percentage'
  is_active: boolean
  fee_tiers?: FeeTier[]
}

interface TierInput {
  tier_name: string
  value: string
  max_value: string
  has_max: boolean
}

interface FeeFormProps {
  fee?: Fee
  onClose: () => void
}

export default function FeeForm({ fee, onClose }: FeeFormProps) {
  const [name, setName] = useState(fee?.name ?? '')
  const [feeType, setFeeType] = useState<'fixed' | 'percentage'>(fee?.fee_type ?? 'percentage')
  const [tiersOpen, setTiersOpen] = useState(false)
  const [tiers, setTiers] = useState<TierInput[]>(
    fee?.fee_tiers?.map((t) => ({
      tier_name: t.tier_name,
      value: t.value.toString(),
      max_value: t.max_value?.toString() ?? '',
      has_max: t.max_value !== null && t.max_value > 0,
    })) ?? []
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isEdit = !!fee

  function addTier() {
    setTiers([...tiers, { tier_name: '', value: '', max_value: '', has_max: false }])
    if (!tiersOpen) setTiersOpen(true)
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  function updateTier(index: number, field: keyof TierInput, value: string | boolean) {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('name', name)
    formData.set('fee_type', feeType)

    const validTiers = tiers.filter((t) => t.tier_name.trim())
    if (validTiers.length > 0) {
      formData.set(
        'tiers',
        JSON.stringify(
          validTiers.map((t, i) => ({
            tier_name: t.tier_name.trim(),
            value: parseFloat(t.value) || 0,
            max_value: t.has_max ? (parseFloat(t.max_value) || null) : null,
            sort_order: i,
          }))
        )
      )
    }

    const result = isEdit
      ? await updateFee(fee.id, formData)
      : await createFee(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Fee' : 'Add Fee'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Commission, Shipping Fee"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFeeType('percentage')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
                  feeType === 'percentage'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setFeeType('fixed')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
                  feeType === 'fixed'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Fixed Rate (IDR)
              </button>
            </div>
          </div>

          {/* Tiers Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setTiersOpen(!tiersOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="font-medium">
                Tiers
                {tiers.length > 0 && (
                  <span className="ml-1.5 text-xs text-blue-600 font-normal">
                    ({tiers.filter((t) => t.tier_name.trim()).length} defined)
                  </span>
                )}
              </span>
              {tiersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {tiersOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 pt-2">
                  Add tiers to pre-define value options for this fee. Without tiers, values are typed manually per SKU.
                </p>

                {tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tier.tier_name}
                      onChange={(e) => updateTier(i, 'tier_name', e.target.value)}
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tier name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.value}
                      onChange={(e) => updateTier(i, 'value', e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={feeType === 'percentage' ? '%' : 'IDR'}
                    />
                    {feeType === 'percentage' && (
                      <label className="flex items-center gap-1 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={tier.has_max}
                          onChange={(e) => {
                            updateTier(i, 'has_max', e.target.checked)
                            if (!e.target.checked) updateTier(i, 'max_value', '')
                          }}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs text-gray-500">Cap</span>
                      </label>
                    )}
                    {tier.has_max && feeType === 'percentage' && (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.max_value}
                        onChange={(e) => updateTier(i, 'max_value', e.target.value)}
                        className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Max IDR"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="p-1 text-gray-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTier}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={14} /> Add Tier
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
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
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
