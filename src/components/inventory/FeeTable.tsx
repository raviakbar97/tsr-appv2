'use client'

import { useState } from 'react'
import { toggleFee, deleteFee } from '@/app/dashboard/inventory/fees/actions'
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
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Add Fee
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No fees yet. Add your first fee to get started.
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
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
