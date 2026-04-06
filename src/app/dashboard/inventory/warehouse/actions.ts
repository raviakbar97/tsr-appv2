'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Warehouse Item CRUD ───────────────────────────────────────────

export async function createWarehouseItem(formData: {
  name: string
  description?: string
  source_type: 'purchased' | 'produced'
  unit: string
  buying_price: number
  initial_stock?: number
  bom?: { ingredient_item_id: string; quantity_per_unit: number }[]
  unit_conversions?: { unit_name: string; factor: number }[]
}) {
  const supabase = await createClient()

  if (!formData.name.trim()) return { error: 'Name is required' }

  const initialStock = formData.initial_stock ?? 0

  const { data: item, error } = await supabase
    .from('warehouse_items')
    .insert({
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      source_type: formData.source_type,
      unit: formData.unit.trim() || 'pcs',
      buying_price: formData.buying_price || 0,
      stock: initialStock,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  if (!item) return { error: 'Failed to create item' }

  // Record initial stock transaction if > 0
  if (initialStock > 0) {
    await supabase.from('warehouse_transactions').insert({
      warehouse_item_id: item.id,
      type: 'in',
      quantity: initialStock,
      note: 'Initial stock',
    })
  }

  // Insert BOM if produced
  if (formData.source_type === 'produced' && formData.bom && formData.bom.length > 0) {
    const bomRows = formData.bom.map((b) => ({
      produced_item_id: item.id,
      ingredient_item_id: b.ingredient_item_id,
      quantity_per_unit: b.quantity_per_unit,
    }))
    const { error: bomError } = await supabase.from('warehouse_bom').insert(bomRows)
    if (bomError) return { error: bomError.message }
  }

  // Insert unit conversions
  if (formData.unit_conversions && formData.unit_conversions.length > 0) {
    const convRows = formData.unit_conversions.map((c) => ({
      warehouse_item_id: item.id,
      unit_name: c.unit_name.trim(),
      factor: c.factor,
    }))
    const { error: convError } = await supabase.from('warehouse_unit_conversions').insert(convRows)
    if (convError) return { error: convError.message }
  }

  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true, id: item.id }
}

export async function updateWarehouseItem(
  id: string,
  formData: {
    name: string
    description?: string
    source_type: 'purchased' | 'produced'
    unit: string
    buying_price: number
    is_active?: boolean
    bom?: { ingredient_item_id: string; quantity_per_unit: number }[]
    unit_conversions?: { unit_name: string; factor: number }[]
  }
) {
  const supabase = await createClient()

  if (!formData.name.trim()) return { error: 'Name is required' }

  const { error } = await supabase
    .from('warehouse_items')
    .update({
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      source_type: formData.source_type,
      unit: formData.unit.trim() || 'pcs',
      buying_price: formData.buying_price || 0,
      is_active: formData.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace BOM
  await supabase.from('warehouse_bom').delete().eq('produced_item_id', id)
  if (formData.source_type === 'produced' && formData.bom && formData.bom.length > 0) {
    const bomRows = formData.bom.map((b) => ({
      produced_item_id: id,
      ingredient_item_id: b.ingredient_item_id,
      quantity_per_unit: b.quantity_per_unit,
    }))
    const { error: bomError } = await supabase.from('warehouse_bom').insert(bomRows)
    if (bomError) return { error: bomError.message }
  }

  // Replace unit conversions
  await supabase.from('warehouse_unit_conversions').delete().eq('warehouse_item_id', id)
  if (formData.unit_conversions && formData.unit_conversions.length > 0) {
    const convRows = formData.unit_conversions.map((c) => ({
      warehouse_item_id: id,
      unit_name: c.unit_name.trim(),
      factor: c.factor,
    }))
    const { error: convError } = await supabase.from('warehouse_unit_conversions').insert(convRows)
    if (convError) return { error: convError.message }
  }

  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true }
}

export async function deleteWarehouseItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('warehouse_items').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true }
}

// ─── Toggle Active ─────────────────────────────────────────────────

export async function toggleWarehouseItem(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('warehouse_items')
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true }
}

// ─── Stock Adjustment ──────────────────────────────────────────────

export async function adjustWarehouseStock(formData: {
  warehouse_item_id: string
  type: 'in' | 'out'
  quantity: number
  note?: string
}) {
  const supabase = await createClient()

  if (!formData.warehouse_item_id) return { error: 'Item is required' }
  if (!formData.quantity || formData.quantity <= 0) return { error: 'Quantity must be positive' }

  // Get current stock
  const { data: item } = await supabase
    .from('warehouse_items')
    .select('stock, name')
    .eq('id', formData.warehouse_item_id)
    .single()

  if (!item) return { error: 'Item not found' }

  if (formData.type === 'out' && item.stock < formData.quantity) {
    return { error: `Insufficient stock. Available: ${item.stock}` }
  }

  const newStock = formData.type === 'in' ? item.stock + formData.quantity : item.stock - formData.quantity

  // Update stock
  const { error: updateError } = await supabase
    .from('warehouse_items')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', formData.warehouse_item_id)

  if (updateError) return { error: updateError.message }

  // Record transaction
  const { error: txError } = await supabase.from('warehouse_transactions').insert({
    warehouse_item_id: formData.warehouse_item_id,
    type: formData.type,
    quantity: formData.quantity,
    note: formData.note?.trim() || null,
  })

  if (txError) return { error: txError.message }

  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true }
}

// ─── Production (Produce from BOM) ─────────────────────────────────

export async function produceItem(formData: {
  produced_item_id: string
  quantity: number
  note?: string
}) {
  const supabase = await createClient()

  if (!formData.produced_item_id) return { error: 'Item is required' }
  if (!formData.quantity || formData.quantity <= 0) return { error: 'Quantity must be positive' }

  // Get BOM
  const { data: bom } = await supabase
    .from('warehouse_bom')
    .select('ingredient_item_id, quantity_per_unit, warehouse_items!warehouse_bom_ingredient_item_id_fkey(id, name, stock)')
    .eq('produced_item_id', formData.produced_item_id)

  if (!bom || bom.length === 0) {
    return { error: 'No BOM found for this produced item' }
  }

  // Check ingredient stock
  const shortages: string[] = []
  for (const ingredient of bom) {
    const item = ingredient.warehouse_items as unknown as { id: string; name: string; stock: number }
    const needed = ingredient.quantity_per_unit * formData.quantity
    if (item.stock < needed) {
      shortages.push(`${item.name}: need ${needed}, have ${item.stock}`)
    }
  }

  if (shortages.length > 0) {
    return { error: `Insufficient ingredients: ${shortages.join('; ')}` }
  }

  // Deduct ingredients
  for (const ingredient of bom) {
    const item = ingredient.warehouse_items as unknown as { id: string; name: string; stock: number }
    const needed = ingredient.quantity_per_unit * formData.quantity
    const newStock = item.stock - needed

    const { error } = await supabase
      .from('warehouse_items')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', item.id)

    if (error) return { error: `Failed to deduct ${item.name}: ${error.message}` }

    // Record ingredient out transaction
    await supabase.from('warehouse_transactions').insert({
      warehouse_item_id: item.id,
      type: 'out',
      quantity: Math.round(needed),
      note: `Production: ${formData.quantity}x produced item`,
    })
  }

  // Add to produced item stock
  const { data: producedItem } = await supabase
    .from('warehouse_items')
    .select('stock')
    .eq('id', formData.produced_item_id)
    .single()

  if (!producedItem) return { error: 'Produced item not found' }

  const { error: addError } = await supabase
    .from('warehouse_items')
    .update({
      stock: producedItem.stock + formData.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', formData.produced_item_id)

  if (addError) return { error: addError.message }

  // Record production transaction
  await supabase.from('warehouse_transactions').insert({
    warehouse_item_id: formData.produced_item_id,
    type: 'production',
    quantity: formData.quantity,
    note: formData.note?.trim() || null,
  })

  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true }
}

// ─── Order Deduction (called from import) ──────────────────────────

export async function deductWarehouseForOrder(
  orderId: string,
  items: { sku_id: string | null; quantity: number }[]
) {
  const supabase = await createClient()

  // Get warehouse_item_ids for the SKUs
  const skuIds = items.map((i) => i.sku_id).filter(Boolean) as string[]
  if (skuIds.length === 0) return

  const { data: skuLinks } = await supabase
    .from('skus')
    .select('id, warehouse_item_id, warehouse_item_qty')
    .in('id', skuIds)

  if (!skuLinks || skuLinks.length === 0) return

  const skuToWarehouse = new Map(skuLinks.map((s) => [s.id, { warehouseItemId: s.warehouse_item_id, qty: s.warehouse_item_qty ?? 1 }]))

  // Aggregate quantities per warehouse item (order qty × SKU warehouse_item_qty)
  const deductions = new Map<string, number>()
  for (const item of items) {
    if (!item.sku_id) continue
    const link = skuToWarehouse.get(item.sku_id)
    if (!link?.warehouseItemId) continue
    const totalQty = item.quantity * link.qty
    deductions.set(link.warehouseItemId, (deductions.get(link.warehouseItemId) ?? 0) + totalQty)
  }

  if (deductions.size === 0) return

  // For each warehouse item to deduct
  for (const [warehouseItemId, qty] of deductions) {
    // Get the item with BOM
    const { data: whItem } = await supabase
      .from('warehouse_items')
      .select('id, name, stock, source_type')
      .eq('id', warehouseItemId)
      .single()

    if (!whItem) continue

    if (whItem.source_type === 'purchased') {
      // Direct deduction
      if (whItem.stock < qty) continue // Skip if not enough stock

      await supabase
        .from('warehouse_items')
        .update({ stock: whItem.stock - qty, updated_at: new Date().toISOString() })
        .eq('id', warehouseItemId)

      await supabase.from('warehouse_transactions').insert({
        warehouse_item_id: warehouseItemId,
        type: 'order_deduction',
        quantity: qty,
        reference_id: orderId,
        note: `Order deduction`,
      })
    } else {
      // Produced item — deduct produced item stock
      if (whItem.stock < qty) continue

      await supabase
        .from('warehouse_items')
        .update({ stock: whItem.stock - qty, updated_at: new Date().toISOString() })
        .eq('id', warehouseItemId)

      await supabase.from('warehouse_transactions').insert({
        warehouse_item_id: warehouseItemId,
        type: 'order_deduction',
        quantity: qty,
        reference_id: orderId,
        note: `Order deduction (produced item)`,
      })
    }
  }
}
