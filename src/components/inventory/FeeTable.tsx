'use client'

import { useState } from 'react'
import { deleteFees, toggleFee, deleteFee } from '@/app/dashboard/inventory/fees/actions'
import { Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import FeeForm from './FeeForm'

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
  created_at: string
  fee_tiers: FeeTier[]
}

interface FeeTableProps {
  fees: Fee[]
}

export default function FeeTable({ fees }: FeeTableProps) {
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleSelectAll() {
    if (selectedIds.size === fees.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(fees.map((f) => f.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function handleMassDelete() {
    if (confirm(`Delete ${selectedIds.size} selected fee(s)? They will be removed from all SKU assignments.`)) {
      const result = await deleteFees(Array.from(selectedIds))
      if (result.error) {
        alert(result.error)
      } else {
        exitSelectMode()
      }
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await toggleFee(id, isActive)
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this fee? It will be removed from all SKU assignments.')) {
      await deleteFee(id)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted)]">{fees.length} fee(s) registered</p>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={exitSelectMode}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              onClick={handleMassDelete}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectMode(true)}
              className="p-2 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
              title="Mass delete"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)]"
            >
              Add Fee
            </button>
          </div>
        )}
      </div>

      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-hover)]">
            <tr>
              {selectMode && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={fees.length > 0 && selectedIds.size === fees.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--border-strong)]"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Type</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Tiers</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Status</th>
              {!selectMode && <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={selectMode ? 5 : 6} className="text-center py-8 text-[var(--muted)]">
                  No fees yet. Add your first fee to get started.
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className={`hover:bg-[var(--surface-hover)] ${selectedIds.has(fee.id) ? 'bg-[var(--danger-light)]' : ''}`}>
                  {selectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(fee.id)}
                        onChange={() => toggleSelect(fee.id)}
                        className="rounded border-[var(--border-strong)]"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{fee.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      fee.fee_type === 'percentage'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-amber-50 text-[var(--warning)]'
                    }`}>
                      {fee.fee_type === 'percentage' ? '% Percentage' : 'IDR Fixed'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {fee.fee_tiers?.length > 0 ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                        {fee.fee_tiers.length} tier{fee.fee_tiers.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">Manual input</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        fee.is_active
                          ? 'bg-green-50 text-[var(--accent)]'
                          : 'bg-[var(--surface-hover)] text-[var(--muted)]'
                      }`}
                    >
                      {fee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {!selectMode && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(fee.id, fee.is_active)}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground-secondary)]"
                          title={fee.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {fee.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                        <button
                          onClick={() => setEditingFee(fee)}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--primary)]"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--danger)]"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(showAdd || editingFee) && (
        <FeeForm
          fee={editingFee ?? undefined}
          onClose={() => {
            setShowAdd(false)
            setEditingFee(null)
          }}
        />
      )}
    </>
  )
}
