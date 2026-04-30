'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Calendar, Filter, X } from 'lucide-react'

type FilterType = 'all' | 'period' | 'custom'

interface BillingPeriod {
  startDate: string
  endDate: string
  periodName: string
}

interface DashboardFilterProps {
  billingPeriods: BillingPeriod[]
}

export default function DashboardFilter({ billingPeriods }: DashboardFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const [filterType, setFilterType] = useState<FilterType>(
    (searchParams.get('filterType') as FilterType) || 'all'
  )
  const [selectedPeriod, setSelectedPeriod] = useState(
    searchParams.get('period') || ''
  )
  const [customStart, setCustomStart] = useState(
    searchParams.get('start') || ''
  )
  const [customEnd, setCustomEnd] = useState(
    searchParams.get('end') || ''
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Sync state with URL params on mount and when params change
  useEffect(() => {
    const paramsFilterType = (searchParams.get('filterType') as FilterType) || 'all'
    setFilterType(paramsFilterType)
    setSelectedPeriod(searchParams.get('period') || '')
    setCustomStart(searchParams.get('start') || '')
    setCustomEnd(searchParams.get('end') || '')
  }, [searchParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      })
    } else {
      setDropdownPosition(null)
    }
  }, [isDropdownOpen])

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reset other filters when switching filter types
    if (updates.filterType === 'all') {
      params.delete('period')
      params.delete('start')
      params.delete('end')
    } else if (updates.filterType === 'period') {
      params.delete('start')
      params.delete('end')
    } else if (updates.filterType === 'custom') {
      params.delete('period')
    }

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type)

    if (type === 'period') {
      // Auto-open dropdown when switching to period mode
      setIsDropdownOpen(true)
      // Auto-select first period if not already selected
      if (billingPeriods.length > 0 && !selectedPeriod) {
        const firstPeriodValue = billingPeriods[0].startDate + '|' + billingPeriods[0].endDate
        setSelectedPeriod(firstPeriodValue)
        updateUrl({
          filterType: 'period',
          period: firstPeriodValue
        })
      } else {
        updateUrl({ filterType: type })
      }
    } else {
      setIsDropdownOpen(false)
      updateUrl({ filterType: type })
    }
  }

  const handlePeriodChange = (periodValue: string) => {
    setSelectedPeriod(periodValue)
    updateUrl({ period: periodValue })
    setIsDropdownOpen(false)
  }

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      updateUrl({
        filterType: 'custom',
        start: customStart,
        end: customEnd
      })
    }
  }

  const clearFilters = () => {
    setFilterType('all')
    setSelectedPeriod('')
    setCustomStart('')
    setCustomEnd('')
    router.push('/dashboard', { scroll: false })
  }

  const hasActiveFilters = filterType !== 'all'

  // Find selected period name for display
  const selectedPeriodData = billingPeriods.find(p =>
    selectedPeriod === `${p.startDate}|${p.endDate}`
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter Type Selector */}
      <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-1">
        <button
          onClick={() => handleFilterTypeChange('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filterType === 'all'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => handleFilterTypeChange('period')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filterType === 'period'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          Period
        </button>
        <button
          onClick={() => handleFilterTypeChange('custom')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filterType === 'custom'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Period Dropdown */}
      {filterType === 'period' && (
        <div className="relative">
          {billingPeriods.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-lg border border-[var(--border)] text-[var(--muted)]">
              <Calendar size={16} />
              <span className="text-sm">No complete periods yet</span>
            </div>
          ) : (
            <>
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors min-w-[200px] justify-between"
                disabled={isPending}
              >
                <Calendar size={16} className="text-[var(--muted)]" />
                <span className="text-sm truncate">
                  {selectedPeriodData?.periodName || 'Select period...'}
                </span>
                <svg
                  className={`w-4 h-4 text-[var(--muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && dropdownPosition && typeof document !== 'undefined' &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`
                    }}
                  >
                    {billingPeriods.map((period) => {
                      const value = `${period.startDate}|${period.endDate}`
                      const isSelected = selectedPeriod === value

                      return (
                        <button
                          key={value}
                          onClick={() => handlePeriodChange(value)}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-[var(--accent)] transition-colors border-b border-[var(--border)] last:border-b-0 ${
                            isSelected ? 'bg-[var(--accent)] font-medium' : ''
                          }`}
                        >
                          <div className="text-[var(--foreground)]">{period.periodName}</div>
                        </button>
                      )
                    })}
                  </div>,
                  document.body
                )
              }
            </>
          )}
        </div>
      )}

      {/* Custom Date Range */}
      {filterType === 'custom' && (
        <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--muted)]" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent border-none text-sm text-[var(--foreground)] focus:outline-none focus:ring-0"
            />
            <span className="text-[var(--muted)]">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent border-none text-sm text-[var(--foreground)] focus:outline-none focus:ring-0"
            />
          </div>
          <button
            onClick={handleCustomDateChange}
            disabled={!customStart || !customEnd || isPending}
            className="px-3 py-1 bg-[var(--primary)] text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Apply
          </button>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  )
}
