'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { createPurchaseOrder } from '@/app/dashboard/inventory/warehouse/po/actions'

interface WarehouseItem {
  id: string
  name: string
  unit: string
  buying_price: number
  source_type: 'purchased' | 'produced'
  unit_conversions?: { unit_name: string; factor: number }[]
}

interface PORow {
  warehouse_item_id: string
  quantity: number
  unit_price: number
  selected_unit: string
}

interface PurchaseOrderFormProps {
  warehouseItems: WarehouseItem[]
  onClose: () => void
}

export default function PurchaseOrderForm({ warehouseItems, onClose }: PurchaseOrderFormProps) {
  const purchasedItems = warehouseItems.filter((i) => i.source_type === 'purchased')

  const [poNumber, setPoNumber] = useState('')
  const [supplier, setSupplier] = useState('')
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<PORow[]>([{ warehouse_item_id: '', quantity: 1, unit_price: 0, selected_unit: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function addRow() {
    setRows([...rows, { warehouse_item_id: '', quantity: 1, unit_price: 0, selected_unit: '' }])
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof PORow, value: string | number) {
    const updated = [...rows]
    if (field === 'warehouse_item_id') {
      updated[index].warehouse_item_id = value as string
      // Auto-fill unit_price from buying_price
      const item = purchasedItems.find((i) => i.id === value)
      if (item && updated[index].unit_price === 0) {
        updated[index].unit_price = Number(item.buying_price)
      }
      // Reset selected unit to base
      updated[index].selected_unit = item?.unit ?? ''
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value as string) || 1
    } else if (field === 'unit_price') {
      updated[index].unit_price = parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
    } else if (field === 'selected_unit') {
      updated[index].selected_unit = value as string
    }
    setRows(updated)
  }

  function sanitizePrice(raw: string): string {
    return raw.replace(/[Rr]p\.?\s?/g, '').replace(/[^\d.,]/g, '').replace(/[.,]/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validItems = rows.filter((r) => r.warehouse_item_id && r.quantity > 0)

    if (!poNumber.trim()) { setError('PO number is required'); setLoading(false); return }
    if (!supplier.trim()) { setError('Supplier is required'); setLoading(false); return }
    if (validItems.length === 0) { setError('Add at least one item'); setLoading(false); return }

    const result = await createPurchaseOrder({
      po_number: poNumber.trim(),
      supplier: supplier.trim(),
      note: note.trim() || undefined,
      items: validItems.map((r) => {
        // Convert quantity to base units
        const item = purchasedItems.find((i) => i.id === r.warehouse_item_id)
        const conv = item?.unit_conversions?.find((c) => c.unit_name === r.selected_unit)
        const factor = conv?.factor ?? 1
        return {
          warehouse_item_id: r.warehouse_item_id,
          quantity: r.quantity * factor,
          unit_price: factor > 1 ? r.unit_price / factor : r.unit_price,
        }
      }),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  const totalValue = rows.reduce(
    (sum, r) => sum + (r.warehouse_item_id ? r.quantity * r.unit_price : 0),
    0
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Purchase Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. PO-2026-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vendor name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional note"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={addRow}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {rows.map((row, i) => {
                const selectedItem = purchasedItems.find((it) => it.id === row.warehouse_item_id)
                const itemUnits = selectedItem
                  ? [{ name: selectedItem.unit, factor: 1 }, ...(selectedItem.unit_conversions ?? []).map((c) => ({ name: c.unit_name, factor: c.factor }))]
                  : []
                const selectedConv = itemUnits.find((u) => u.name === (row.selected_unit || selectedItem?.unit))
                const factor = selectedConv?.factor ?? 1

                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={row.warehouse_item_id}
                      onChange={(e) => updateRow(i, 'warehouse_item_id', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select item...</option>
                      {purchasedItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={row.quantity || ''}
                      onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                      className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Qty"
                      min="1"
                    />
                    {itemUnits.length > 1 ? (
                      <select
                        value={row.selected_unit || selectedItem?.unit || ''}
                        onChange={(e) => updateRow(i, 'selected_unit', e.target.value)}
                        className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {itemUnits.map((u) => (
                          <option key={u.name} value={u.name}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="w-20 text-xs text-gray-500 text-center">{selectedItem?.unit || ''}</span>
                    )}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.unit_price || ''}
                      onChange={(e) => updateRow(i, 'unit_price', sanitizePrice(e.target.value))}
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Unit price"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="p-1.5 text-gray-500 hover:text-red-600"
                      disabled={rows.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-1">
            <p className="text-sm text-gray-700">
              Total: <span className="font-medium">Rp {totalValue.toLocaleString('id-ID')}</span>
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
