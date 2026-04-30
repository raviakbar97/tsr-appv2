'use client'

import { useEffect, useState, useActionState } from 'react'
import { X, AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react'
import {
  closeAccountingPeriod,
  getAvailablePeriods,
  type ClosablePeriod,
  type IncompleteOrder,
} from '@/app/dashboard/finance/actions'
import formatCurrency from '@/lib/format/currency'

interface ClosePeriodModalProps {
  onClose: () => void
}

export default function ClosePeriodModal({ onClose }: ClosePeriodModalProps) {
  const [step, setStep] = useState<'loading' | 'select' | 'confirm' | 'closing' | 'success' | 'error'>('loading')
  const [availablePeriods, setAvailablePeriods] = useState<ClosablePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<ClosablePeriod | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPeriods() {
      const periods = await getAvailablePeriods()
      setAvailablePeriods(periods)

      // Auto-select if only one closable period exists
      const closablePeriods = periods.filter((p) => p.canClose)
      if (closablePeriods.length === 1) {
        setSelectedPeriod(closablePeriods[0])
        setStep('confirm')
      } else {
        setStep('select')
      }
    }
    loadPeriods()
  }, [])

  const handleSelectPeriod = (period: ClosablePeriod) => {
    if (!period.canClose) return
    setSelectedPeriod(period)
    setIsDropdownOpen(false)
    setStep('confirm')
  }

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return

    setStep('closing')
    const result = await closeAccountingPeriod(selectedPeriod.startDate, selectedPeriod.endDate)

    if (result.success) {
      setStep('success')
    } else {
      setError(result.error ?? 'Failed to close period')
      setStep('error')
    }
  }

  const closablePeriods = availablePeriods.filter((p) => p.canClose)
  const hasIncompletePeriods = availablePeriods.some((p) => !p.canClose && p.orderCount > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {step === 'success' ? 'Period Closed' : step === 'select' ? 'Select Period to Close' : 'Close Billing Period'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--accent)] rounded-lg transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
            </div>
          )}

          {step === 'select' && (
            <div>
              {availablePeriods.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle size={48} className="mx-auto text-[var(--muted)] mb-4" />
                  <p className="text-[var(--foreground)] font-medium">No periods available</p>
                  <p className="text-sm text-[var(--muted)] mt-2">
                    Import orders first to create closable periods
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[var(--muted)] mb-4">
                    Select a billing period to close. Only periods with all orders complete can be closed.
                  </p>

                  {/* Period Dropdown */}
                  <div className="relative mb-4">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--accent)]/30 rounded-lg text-left hover:bg-[var(--accent)]/50 transition-colors"
                    >
                      <span className="text-[var(--foreground)]">
                        {selectedPeriod
                          ? selectedPeriod.periodName
                          : 'Select a period...'}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-[var(--muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {availablePeriods.map((period) => (
                          <button
                            key={`${period.startDate}-${period.endDate}`}
                            onClick={() => handleSelectPeriod(period)}
                            disabled={!period.canClose}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-[var(--border)] last:border-b-0 transition-colors ${
                              !period.canClose
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-[var(--accent)]/50'
                            }`}
                          >
                            <div>
                              <div className="font-medium text-[var(--foreground)]">
                                {period.periodName}
                              </div>
                              <div className="text-xs text-[var(--muted)]">
                                {period.orderCount} order{period.orderCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                            {!period.canClose && period.orderCount > 0 && (
                              <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded">
                                Incomplete
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Show incomplete orders info */}
                  {hasIncompletePeriods && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
                      <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-amber-800 dark:text-amber-300 font-medium">
                          Some periods cannot be closed
                        </p>
                        <p className="text-amber-700 dark:text-amber-400 mt-1">
                          Orders with missing SKU links must be fixed before closing.
                        </p>
                      </div>
                    </div>
                  )}

                  {closablePeriods.length === 0 && (
                    <div className="text-center py-4 text-sm text-[var(--muted)]">
                      No periods are ready to close. Make sure all orders have SKUs linked.
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedPeriod && (
            <div>
              <p className="text-[var(--muted)] mb-4">
                You are about to close the following billing period. Once closed, the
                period cannot be modified.
              </p>

              <div className="bg-[var(--accent)]/30 rounded-lg p-4 mb-4">
                <div className="text-sm text-[var(--muted)] mb-1">Period</div>
                <div className="text-lg font-semibold text-[var(--foreground)]">
                  {selectedPeriod.periodName}
                </div>
                <div className="text-sm text-[var(--muted)] mt-2">
                  {selectedPeriod.orderCount} order{selectedPeriod.orderCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setStep('select')}
                  className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleClosePeriod}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Close Period
                </button>
              </div>
            </div>
          )}

          {step === 'closing' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 size={32} className="animate-spin text-[var(--primary)] mb-4" />
              <p className="text-[var(--foreground)]">Closing period...</p>
            </div>
          )}

          {step === 'success' && selectedPeriod && (
            <div className="flex flex-col items-center py-4">
              <CheckCircle2
                size={48}
                className="text-green-500 dark:text-green-400 mb-4"
              />
              <p className="text-[var(--foreground)] font-medium mb-4">
                Period closed successfully!
              </p>

              <div className="w-full bg-[var(--accent)]/30 rounded-lg p-4 mb-4">
                <div className="text-sm text-[var(--muted)] mb-1">
                  {selectedPeriod.periodName}
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-[var(--muted)]">Orders</div>
                    <div className="text-lg font-semibold text-[var(--foreground)]">
                      {selectedPeriod.orderCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[var(--foreground)] font-medium">
                    Error closing period
                  </p>
                  <p className="text-sm text-[var(--muted)] mt-1">{error}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--accent)] rounded-lg hover:opacity-80 transition-opacity"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
