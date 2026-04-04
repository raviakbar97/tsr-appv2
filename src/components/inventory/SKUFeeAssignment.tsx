'use client'

interface Fee {
  id: string
  name: string
  fee_type: 'fixed' | 'percentage'
  is_active: boolean
}

interface FeeAssignment {
  fee_id: string
  value: string
  max_value: string
  has_max: boolean
}

interface SKUFeeAssignmentProps {
  fees: Fee[]
  assignments: FeeAssignment[]
  onChange: (assignments: FeeAssignment[]) => void
}

export default function SKUFeeAssignment({ fees, assignments, onChange }: SKUFeeAssignmentProps) {
  function toggleFee(feeId: string) {
    const existing = assignments.find((a) => a.fee_id === feeId)
    if (existing) {
      onChange(assignments.filter((a) => a.fee_id !== feeId))
    } else {
      onChange([...assignments, { fee_id: feeId, value: '', max_value: '', has_max: false }])
    }
  }

  function updateField(feeId: string, field: keyof FeeAssignment, value: string | boolean) {
    onChange(
      assignments.map((a) => (a.fee_id === feeId ? { ...a, [field]: value } : a))
    )
  }

  const activeFees = fees.filter((f) => f.is_active)

  if (activeFees.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fee Assignment</label>
        <p className="text-xs text-gray-400">No active fees available. Create fees in the Fee Registry first.</p>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Fee Assignment</label>
      <div className="space-y-3">
        {activeFees.map((fee) => {
          const assignment = assignments.find((a) => a.fee_id === fee.id)
          const isChecked = !!assignment
          return (
            <div key={fee.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFee(fee.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 font-medium">
                  {fee.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  fee.fee_type === 'percentage' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {fee.fee_type === 'percentage' ? '%' : 'IDR'}
                </span>
              </div>

              {isChecked && (
                <div className="mt-2 ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-20">
                      {fee.fee_type === 'percentage' ? 'Percentage' : 'Amount'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={assignment?.value ?? ''}
                      onChange={(e) => updateField(fee.id, 'value', e.target.value)}
                      placeholder={fee.fee_type === 'percentage' ? 'e.g. 4' : 'e.g. 5000'}
                      className="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-xs text-gray-400">
                      {fee.fee_type === 'percentage' ? '%' : 'IDR'}
                    </span>
                  </div>

                  {fee.fee_type === 'percentage' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-20">Max fee</label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignment?.has_max ?? false}
                          onChange={(e) => {
                            updateField(fee.id, 'has_max', e.target.checked)
                            if (!e.target.checked) updateField(fee.id, 'max_value', '')
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500">Cap</span>
                      </label>
                      {assignment?.has_max && (
                        <>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={assignment?.max_value ?? ''}
                            onChange={(e) => updateField(fee.id, 'max_value', e.target.value)}
                            placeholder="e.g. 40000"
                            className="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <span className="text-xs text-gray-400">IDR</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
