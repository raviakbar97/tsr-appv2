'use client'

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

interface FeeAssignment {
  fee_id: string
  value: string
  max_value: string
  has_max: boolean
  fee_tier_id: string
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
      onChange([...assignments, { fee_id: feeId, value: '', max_value: '', has_max: false, fee_tier_id: '' }])
    }
  }

  function updateField(feeId: string, field: keyof FeeAssignment, value: string | boolean) {
    onChange(
      assignments.map((a) => (a.fee_id === feeId ? { ...a, [field]: value } : a))
    )
  }

  function selectTier(feeId: string, tierId: string, fee: Fee) {
    const tier = fee.fee_tiers?.find((t) => t.id === tierId)
    if (!tier) return
    onChange(
      assignments.map((a) =>
        a.fee_id === feeId
          ? {
              ...a,
              fee_tier_id: tierId,
              value: tier.value.toString(),
              max_value: tier.max_value?.toString() ?? '',
              has_max: tier.max_value !== null && tier.max_value > 0,
            }
          : a
      )
    )
  }

  function clearTier(feeId: string) {
    onChange(
      assignments.map((a) =>
        a.fee_id === feeId
          ? { ...a, fee_tier_id: '', value: '', max_value: '', has_max: false }
          : a
      )
    )
  }

  const activeFees = fees.filter((f) => f.is_active)

  if (activeFees.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">Fee Assignment</label>
        <p className="text-xs text-[var(--muted)]">No active fees available. Create fees in the Fee Registry first.</p>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">Fee Assignment</label>
      <div className="space-y-3">
        {activeFees.map((fee) => {
          const assignment = assignments.find((a) => a.fee_id === fee.id)
          const isChecked = !!assignment
          const hasTiers = (fee.fee_tiers?.length ?? 0) > 0
          const tiers = fee.fee_tiers ?? []

          return (
            <div key={fee.id} className="border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFee(fee.id)}
                  className="rounded border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)] font-medium">
                  {fee.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  fee.fee_type === 'percentage' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-[var(--warning)]'
                }`}>
                  {fee.fee_type === 'percentage' ? '%' : 'IDR'}
                </span>
              </div>

              {isChecked && hasTiers && (
                <div className="mt-2 ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)] w-20">Tier</label>
                    <select
                      value={assignment?.fee_tier_id ?? ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          selectTier(fee.id, e.target.value, fee)
                        } else {
                          clearTier(fee.id)
                        }
                      }}
                      className="flex-1 border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">Select a tier...</option>
                      {tiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.tier_name}{' '}
                          ({fee.fee_type === 'percentage'
                            ? `${tier.value}%`
                            : `Rp ${Number(tier.value).toLocaleString('id-ID')}`})
                          {tier.max_value ? ` (max Rp ${Number(tier.max_value).toLocaleString('id-ID')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {assignment?.fee_tier_id && (
                    <p className="text-xs text-[var(--muted)] ml-20">
                      {fee.fee_type === 'percentage'
                        ? `${assignment.value}%${assignment.has_max ? ` (max Rp ${Number(assignment.max_value).toLocaleString('id-ID')})` : ''}`
                        : `Rp ${Number(assignment.value).toLocaleString('id-ID')}`}
                    </p>
                  )}
                </div>
              )}

              {isChecked && !hasTiers && (
                <div className="mt-2 ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)] w-20">
                      {fee.fee_type === 'percentage' ? 'Percentage' : 'Amount'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={assignment?.value ?? ''}
                      onChange={(e) => updateField(fee.id, 'value', e.target.value)}
                      placeholder={fee.fee_type === 'percentage' ? 'e.g. 4' : 'e.g. 5000'}
                      className="w-36 border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      required
                    />
                    <span className="text-xs text-[var(--muted)]">
                      {fee.fee_type === 'percentage' ? '%' : 'IDR'}
                    </span>
                  </div>

                  {fee.fee_type === 'percentage' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)] w-20">Max fee</label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignment?.has_max ?? false}
                          onChange={(e) => {
                            updateField(fee.id, 'has_max', e.target.checked)
                            if (!e.target.checked) updateField(fee.id, 'max_value', '')
                          }}
                          className="rounded border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span className="text-xs text-[var(--muted)]">Cap</span>
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
                            className="w-36 border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            required
                          />
                          <span className="text-xs text-[var(--muted)]">IDR</span>
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
