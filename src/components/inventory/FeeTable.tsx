'use client'

import { useState } from 'react'
import { deleteFees, toggleFee, deleteFee } from '@/app/dashboard/inventory/fees/actions'
import { Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import FeeForm from './FeeForm'

interface Fee {
  id: string
  name: string
  fee_type: 'fixed' | 'percentage'
  is_active: boolean
  created_at: string
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
        <p className="text-sm text-gray-500">{fees.length} fee(s) registered</p>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={exitSelectMode}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
              title="Mass delete"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Fee
            </button>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {selectMode && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={fees.length > 0 && selectedIds.size === fees.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {!selectMode && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={selectMode ? 4 : 5} className="text-center py-8 text-gray-400">
                  No fees yet. Add your first fee to get started.
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className={`hover:bg-gray-50 ${selectedIds.has(fee.id) ? 'bg-red-50' : ''}`}>
                  {selectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(fee.id)}
                        onChange={() => toggleSelect(fee.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">{fee.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      fee.fee_type === 'percentage'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {fee.fee_type === 'percentage' ? '% Percentage' : 'IDR Fixed'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        fee.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
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
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          title={fee.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {fee.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                        <button
                          onClick={() => setEditingFee(fee)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
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
