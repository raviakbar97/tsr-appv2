'use client'

import { useState } from 'react'
import { Pencil, Trash2, Power, PowerOff, Eye, Search } from 'lucide-react'
import { deleteSKU, deleteSKUs, toggleSKU } from '@/app/dashboard/inventory/actions'
import SKUForm from './SKUForm'
import Link from 'next/link'

interface Fee {
  id: string
  name: string
  fee_type: 'fixed' | 'percentage'
  is_active: boolean
}

interface Variation {
  id: string
  variation_name: string
  base_price_override: number | null
}

interface SKUWithRelations {
  id: string
  name: string
  sku_code: string
  base_price: number
  is_active: boolean
  sku_variations: Variation[]
  sku_fees: { fee_id: string; value: number; max_value: number | null; fees: Fee }[]
}

interface SKUTableProps {
  skus: SKUWithRelations[]
  fees: Fee[]
}

export default function SKUTable({ skus, fees }: SKUTableProps) {
  const [search, setSearch] = useState('')
  const [editingSKU, setEditingSKU] = useState<SKUWithRelations | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = skus.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sku_code.toLowerCase().includes(search.toLowerCase())
  )

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)))
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
    if (confirm(`Delete ${selectedIds.size} selected SKU(s)? This will also remove all variations, fee assignments, and stock history.`)) {
      const result = await deleteSKUs(Array.from(selectedIds))
      if (result.error) {
        alert(result.error)
      } else {
        exitSelectMode()
      }
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await toggleSKU(id, isActive)
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this SKU? This will also remove all variations, fee assignments, and stock history.')) {
      await deleteSKU(id)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU name or code..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              Add SKU
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
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Base Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Variations</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fees</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {!selectMode && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={selectMode ? 7 : 8} className="text-center py-8 text-gray-400">
                  {skus.length === 0
                    ? 'No SKUs yet. Add your first SKU to get started.'
                    : 'No SKUs match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((sku) => (
                <tr key={sku.id} className={`hover:bg-gray-50 ${selectedIds.has(sku.id) ? 'bg-red-50' : ''}`}>
                  {selectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sku.id)}
                        onChange={() => toggleSelect(sku.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{sku.sku_code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{sku.name}</td>
                  <td className="px-4 py-3 text-gray-600">Rp {Number(sku.base_price).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    {sku.sku_variations.length > 0 ? (
                      <span className="text-gray-600">
                        {sku.sku_variations.map((v) => v.variation_name).join(', ')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sku.sku_fees.length > 0 ? (
                      <div className="space-y-0.5">
                        {sku.sku_fees.map((f) => (
                          <span key={f.fee_id} className="block text-gray-600">
                            {f.fees.name}{' '}
                            <span className="text-xs">
                              {f.fees.fee_type === 'percentage'
                                ? `${f.value}%${f.max_value ? ` max Rp ${Number(f.max_value).toLocaleString('id-ID')}` : ''}`
                                : `Rp ${Number(f.value).toLocaleString('id-ID')}`}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        sku.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {sku.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {!selectMode && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/inventory/${sku.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="View details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleToggle(sku.id, sku.is_active)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          title={sku.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {sku.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                        <button
                          onClick={() => setEditingSKU(sku)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sku.id)}
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

      {(showAdd || editingSKU) && (
        <SKUForm
          sku={editingSKU ?? undefined}
          fees={fees}
          onClose={() => {
            setShowAdd(false)
            setEditingSKU(null)
          }}
        />
      )}
    </>
  )
}
