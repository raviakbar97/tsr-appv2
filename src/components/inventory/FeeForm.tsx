'use client'

import { useState } from 'react'
import { createFee, updateFee } from '@/app/dashboard/inventory/fees/actions'
import { X } from 'lucide-react'

interface Fee {
  id: string
  name: string
  fee_type: 'fixed' | 'percentage'
  is_active: boolean
}

interface FeeFormProps {
  fee?: Fee
  onClose: () => void
}

export default function FeeForm({ fee, onClose }: FeeFormProps) {
  const [name, setName] = useState(fee?.name ?? '')
  const [feeType, setFeeType] = useState<'fixed' | 'percentage'>(fee?.fee_type ?? 'percentage')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isEdit = !!fee

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('name', name)
    formData.set('fee_type', feeType)

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
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
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
                onClick={() => setFeeType('fixed')
              }
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
                  feeType === 'fixed'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Fixed Rate (IDR)
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {feeType === 'percentage'
                ? 'Value (% of selling price) will be set per SKU'
                : 'Fixed amount (IDR) will be set per SKU'}
            </p>
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
