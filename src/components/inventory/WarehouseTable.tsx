'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, Factory, ShoppingCart, ToggleLeft, ToggleRight } from 'lucide-react'
import WarehouseForm from './WarehouseForm'
import WarehouseStockForm from './WarehouseStockForm'
import WarehouseTransactionHistory from './WarehouseTransactionHistory'
import { deleteWarehouseItem, toggleWarehouseItem } from '@/app/dashboard/inventory/warehouse/actions'

interface BOMItem {
  ingredient_item_id: string
  quantity_per_unit: number
  ingredient?: { id: string; name: string; unit: string; buying_price: number }
}

interface WarehouseItem {
  id: string
  name: string
  description: string | null
  source_type: 'purchased' | 'produced'
  unit: string
  buying_price: number
  stock: number
  is_active: boolean
  warehouse_bom?: BOMItem[]
  unit_conversions?: { unit_name: string; factor: number }[]
}

interface WarehouseTableProps {
  items: WarehouseItem[]
  allItems: WarehouseItem[]
}

export default function WarehouseTable({ items, allItems }: WarehouseTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null)
  const [stockItem, setStockItem] = useState<WarehouseItem | null>(null)
  const [historyItem, setHistoryItem] = useState<WarehouseItem | null>(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Delete this warehouse item?')) return
    setDeleting(id)
    await deleteWarehouseItem(id)
    setDeleting(null)
  }

  async function handleToggle(item: WarehouseItem) {
    await toggleWarehouseItem(item.id, item.is_active)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search warehouse items..."
          className="border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--surface)] w-64 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button
          onClick={() => {
            setEditItem(null)
            setShowForm(true)
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-2"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[var(--muted)] text-xs border-b border-[var(--border)]">
            <th className="text-left pb-3 font-medium">Name</th>
            <th className="text-left pb-3 font-medium">Type</th>
            <th className="text-right pb-3 font-medium">Cost</th>
            <th className="text-center pb-3 font-medium">Stock</th>
            <th className="text-center pb-3 font-medium">Status</th>
            <th className="text-right pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                No warehouse items found
              </td>
            </tr>
          ) : (
            filtered.map((item) => (
              <tr key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                <td className="py-3">
                  <button
                    onClick={() => setHistoryItem(item)}
                    className="text-[var(--foreground)] font-medium hover:text-[var(--primary)] hover:underline text-left"
                  >
                    {item.name}
                  </button>
                  {item.description && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">{item.description}</p>
                  )}
                  {item.source_type === 'produced' && item.warehouse_bom && item.warehouse_bom.length > 0 && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      BOM: {item.warehouse_bom.map(b => `${b.ingredient?.name ?? '?'} x${b.quantity_per_unit}`).join(', ')}
                    </p>
                  )}
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.source_type === 'purchased'
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'bg-[var(--primary-light)] text-[var(--primary)]'
                  }`}>
                    {item.source_type === 'purchased' ? (
                      <><ShoppingCart size={12} /> Purchased</>
                    ) : (
                      <><Factory size={12} /> Produced</>
                    )}
                  </span>
                </td>
                <td className="py-3 text-right text-[var(--foreground-secondary)]">
                  {item.source_type === 'purchased' ? (
                    `Rp ${Number(item.buying_price).toLocaleString('id-ID')}`
                  ) : item.warehouse_bom && item.warehouse_bom.length > 0 ? (
                    <span title="BOM cost">
                      Rp {Number(item.warehouse_bom.reduce((sum, b) => sum + (b.ingredient ? b.ingredient.buying_price * b.quantity_per_unit : 0), 0)).toLocaleString('id-ID')}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">-</span>
                  )}
                </td>
                <td className="py-3 text-center">
                  <span className={`font-medium ${
                    item.stock === 0 ? 'text-[var(--danger)]' : item.stock <= 10 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]'
                  }`}>
                    {item.stock} {item.unit}
                  </span>
                  {item.unit_conversions && item.unit_conversions.length > 0 && item.stock > 0 && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      ({item.unit_conversions.map((c) => {
                        const val = Math.floor(item.stock / c.factor)
                        const remainder = item.stock % c.factor
                        return `${val} ${c.unit_name}${remainder > 0 ? ` + ${remainder} ${item.unit}` : ''}`
                      }).join(', ')})
                    </p>
                  )}
                </td>
                <td className="py-3 text-center">
                  <button onClick={() => handleToggle(item)} title={item.is_active ? 'Deactivate' : 'Activate'}>
                    {item.is_active ? (
                      <ToggleRight size={20} className="text-[var(--accent)] inline" />
                    ) : (
                      <ToggleLeft size={20} className="text-[var(--muted)] inline" />
                    )}
                  </button>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setStockItem(item)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg"
                      title="Adjust Stock"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditItem(item)
                        setShowForm(true)
                      }}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm && (
        <WarehouseForm
          item={editItem}
          allItems={allItems.filter((i) => i.id !== editItem?.id)}
          onClose={() => {
            setShowForm(false)
            setEditItem(null)
          }}
        />
      )}

      {stockItem && (
        <WarehouseStockForm
          item={stockItem}
          unitConversions={stockItem.unit_conversions ?? []}
          onClose={() => setStockItem(null)}
        />
      )}

      {historyItem && (
        <WarehouseTransactionHistory
          item={historyItem}
          onClose={() => setHistoryItem(null)}
        />
      )}
    </>
  )
}
