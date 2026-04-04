'use client'

interface Fee {
  id: string
  name: string
  percentage: number
  is_active: boolean
}

interface SKUFeeAssignmentProps {
  fees: Fee[]
  selectedFeeIds: string[]
  onChange: (feeIds: string[]) => void
}

export default function SKUFeeAssignment({ fees, selectedFeeIds, onChange }: SKUFeeAssignmentProps) {
  function toggleFee(feeId: string) {
    if (selectedFeeIds.includes(feeId)) {
      onChange(selectedFeeIds.filter((id) => id !== feeId))
    } else {
      onChange([...selectedFeeIds, feeId])
    }
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
      <div className="space-y-2">
        {activeFees.map((fee) => (
          <label key={fee.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedFeeIds.includes(fee.id)}
              onChange={() => toggleFee(fee.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {fee.name} ({fee.percentage}%)
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
