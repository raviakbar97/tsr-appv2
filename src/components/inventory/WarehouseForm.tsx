'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { createWarehouseItem, updateWarehouseItem } from '@/app/dashboard/inventory/warehouse/actions'

interface AllItem {
  id: string
  name: string
  unit: string
  buying_price: number
}

interface BOMRow {
  ingredient_item_id: string
  quantity_per_unit: number
}

interface ConvRow {
  unit_name: string
  factor: number
}

interface WarehouseFormProps {
  item?: {
    id: string
    name: string
    description: string | null
    source_type: 'purchased' | 'produced'
    unit: string
    buying_price: number
    warehouse_bom?: { ingredient_item_id: string; quantity_per_unit: number; ingredient?: { id: string; name: string } }[]
    unit_conversions?: { unit_name: string; factor: number }[]
  } | null
  allItems: AllItem[]
  onClose: () => void
}

export default function WarehouseForm({ item, allItems, onClose }: WarehouseFormProps) {
  const isEdit = !!item?.id
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [sourceType, setSourceType] = useState<'purchased' | 'produced'>(item?.source_type ?? 'purchased')
  const [unit, setUnit] = useState(item?.unit ?? 'pcs')
  const [buyingPrice, setBuyingPrice] = useState(item?.buying_price?.toString() ?? '0')
  const [initialStock, setInitialStock] = useState(isEdit ? '' : '0')
  const [bom, setBom] = useState<BOMRow[]>(
    item?.warehouse_bom?.map((b) => ({
      ingredient_item_id: b.ingredient_item_id,
      quantity_per_unit: b.quantity_per_unit,
    })) ?? []
  )
  const [conversions, setConversions] = useState<ConvRow[]>(
    item?.unit_conversions?.map((c) => ({
      unit_name: c.unit_name,
      factor: c.factor,
    })) ?? []
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function addBomRow() {
    setBom([...bom, { ingredient_item_id: '', quantity_per_unit: 0 }])
  }

  function removeBomRow(index: number) {
    setBom(bom.filter((_, i) => i !== index))
  }

  function updateBomRow(index: number, field: 'ingredient_item_id' | 'quantity_per_unit', value: string | number) {
    const updated = [...bom]
    if (field === 'ingredient_item_id') {
      updated[index].ingredient_item_id = value as string
    } else {
      updated[index].quantity_per_unit = Number(value) || 1
    }
    setBom(updated)
  }

  function addConvRow() {
    setConversions([...conversions, { unit_name: '', factor: 1 }])
  }

  function removeConvRow(index: number) {
    setConversions(conversions.filter((_, i) => i !== index))
  }

  function updateConvRow(index: number, field: 'unit_name' | 'factor', value: string | number) {
    const updated = [...conversions]
    if (field === 'unit_name') {
      updated[index].unit_name = value as string
    } else {
      updated[index].factor = Number(value) || 1
    }
    setConversions(updated)
  }

  function sanitizePrice(raw: string): string {
    return raw.replace(/[Rr]p\.?\s?/g, '').replace(/[^\d.,]/g, '').replace(/[.,]/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      source_type: sourceType,
      unit: unit.trim() || 'pcs',
      buying_price: parseFloat(sanitizePrice(buyingPrice)) || 0,
      initial_stock: !isEdit ? (parseInt(initialStock) || 0) : undefined,
      ...(isEdit ? { is_active: true } : {}),
      bom: sourceType === 'produced' ? bom.filter((b) => b.ingredient_item_id) : undefined,
      unit_conversions: conversions.filter((c) => c.unit_name.trim()).length > 0
        ? conversions.filter((c) => c.unit_name.trim())
        : undefined,
    }

    const result = isEdit
      ? await updateWarehouseItem(item!.id, data)
      : await createWarehouseItem(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isEdit ? 'Edit Warehouse Item' : 'Add Warehouse Item'}
          </h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="e.g. Sintren Tea"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as 'purchased' | 'produced')}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="purchased">Purchased</option>
                <option value="produced">Produced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="pcs, kg, liter"
              />
            </div>
          </div>

          {sourceType === 'purchased' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Buying Price</label>
              <input
                type="text"
                inputMode="decimal"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(sanitizePrice(e.target.value))}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="0"
              />
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">Initial Stock</label>
              <input
                type="number"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                min="0"
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="0"
              />
            </div>
          )}

          {/* BOM Editor for Produced Items */}
          {sourceType === 'produced' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                  Bill of Materials (BOM)
                </label>
                <button
                  type="button"
                  onClick={addBomRow}
                  className="text-xs text-[var(--primary)] hover:text-[var(--primary)] flex items-center gap-1"
                >
                  <Plus size={14} /> Add Ingredient
                </button>
              </div>

              {bom.length === 0 ? (
                <p className="text-sm text-[var(--muted)] py-2">No ingredients added</p>
              ) : (
                <div className="space-y-2">
                  {bom.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={row.ingredient_item_id}
                        onChange={(e) => updateBomRow(i, 'ingredient_item_id', e.target.value)}
                        className="flex-1 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select ingredient...</option>
                        {allItems.map((ai) => (
                          <option key={ai.id} value={ai.id}>
                            {ai.name} ({ai.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.quantity_per_unit || ''}
                        onChange={(e) => updateBomRow(i, 'quantity_per_unit', e.target.value.replace(/[^\d.]/g, ''))}
                        className="w-20 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={() => removeBomRow(i)}
                        className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unit Conversions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                Unit Conversions
              </label>
              <button
                type="button"
                onClick={addConvRow}
                className="text-xs text-[var(--primary)] hover:text-[var(--primary)] flex items-center gap-1"
              >
                <Plus size={14} /> Add Unit
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-2">
              Define larger units. Stock is always stored in the base unit ({unit || 'pcs'}).
              Factor = how many base units per 1 larger unit.
            </p>
            {conversions.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-2">No conversions defined</p>
            ) : (
              <div className="space-y-2">
                {conversions.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.unit_name}
                      onChange={(e) => updateConvRow(i, 'unit_name', e.target.value)}
                      className="w-24 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="e.g. pack"
                    />
                    <span className="text-xs text-[var(--muted)]">=</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.factor || ''}
                      onChange={(e) => updateConvRow(i, 'factor', e.target.value.replace(/[^\d.]/g, ''))}
                      className="w-20 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="10"
                    />
                    <span className="text-xs text-[var(--muted)]">{unit || 'pcs'}</span>
                    <button
                      type="button"
                      onClick={() => removeConvRow(i)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface-hover)] rounded-lg hover:bg-[var(--border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
