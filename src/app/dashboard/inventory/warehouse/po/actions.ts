'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Create PO ──────────────────────────────────────────────────────

export async function createPurchaseOrder(formData: {
  po_number: string
  supplier: string
  note?: string
  items: { warehouse_item_id: string; quantity: number; unit_price: number }[]
}) {
  const supabase = await createClient()

  if (!formData.po_number.trim()) return { error: 'PO number is required' }
  if (!formData.supplier.trim()) return { error: 'Supplier is required' }
  if (!formData.items || formData.items.length === 0) return { error: 'Add at least one item' }

  // Create PO
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: formData.po_number.trim(),
      supplier: formData.supplier.trim(),
      note: formData.note?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (poError) return { error: poError.message }
  if (!po) return { error: 'Failed to create PO' }

  // Create PO items
  const poItems = formData.items.map((item) => ({
    purchase_order_id: po.id,
    warehouse_item_id: item.warehouse_item_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('purchase_order_items').insert(poItems)
  if (itemsError) return { error: itemsError.message }

  revalidatePath('/dashboard/inventory/warehouse/po')
  return { success: true }
}

// ─── Receive PO (stock in) ─────────────────────────────────────────

export async function receivePurchaseOrder(poId: string) {
  const supabase = await createClient()

  // Get PO with items
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status, purchase_order_items(id, warehouse_item_id, quantity, unit_price)')
    .eq('id', poId)
    .single()

  if (poError) return { error: poError.message }
  if (!po) return { error: 'PO not found' }
  if (po.status !== 'pending') return { error: 'Only pending POs can be received' }

  // Process each item: increase stock + record transaction
  for (const item of po.purchase_order_items) {
    // Get current stock
    const { data: whItem } = await supabase
      .from('warehouse_items')
      .select('stock')
      .eq('id', item.warehouse_item_id)
      .single()

    if (!whItem) return { error: `Warehouse item ${item.warehouse_item_id} not found` }

    const newStock = whItem.stock + item.quantity

    // Update stock
    const { error: updateError } = await supabase
      .from('warehouse_items')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', item.warehouse_item_id)

    if (updateError) return { error: updateError.message }

    // Record transaction
    const { error: txError } = await supabase.from('warehouse_transactions').insert({
      warehouse_item_id: item.warehouse_item_id,
      type: 'in',
      quantity: item.quantity,
      note: `PO: ${po.po_number}`,
    })

    if (txError) return { error: txError.message }
  }

  // Update PO status
  const { error: statusError } = await supabase
    .from('purchase_orders')
    .update({ status: 'received', updated_at: new Date().toISOString() })
    .eq('id', poId)

  if (statusError) return { error: statusError.message }

  revalidatePath('/dashboard/inventory/warehouse/po')
  revalidatePath('/dashboard/inventory/warehouse')
  return { success: true }
}

// ─── Cancel PO ─────────────────────────────────────────────────────

export async function cancelPurchaseOrder(poId: string) {
  const supabase = await createClient()

  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', poId)
    .single()

  if (poError) return { error: poError.message }
  if (!po) return { error: 'PO not found' }
  if (po.status !== 'pending') return { error: 'Only pending POs can be cancelled' }

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', poId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/warehouse/po')
  return { success: true }
}

// ─── Delete PO ──────────────────────────────────────────────────────

export async function deletePurchaseOrder(poId: string) {
  const supabase = await createClient()

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', poId)
    .single()

  if (!po) return { error: 'PO not found' }

  const { error } = await supabase.from('purchase_orders').delete().eq('id', poId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/warehouse/po')
  return { success: true }
}
