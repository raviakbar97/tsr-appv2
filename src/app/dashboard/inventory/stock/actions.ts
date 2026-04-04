'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStockTransaction(formData: {
  sku_id: string
  variation_id: string | null
  quantity: number
  type: 'in' | 'out'
  transaction_date: string
  notes: string
}) {
  const supabase = await createClient()

  if (!formData.sku_id || !formData.quantity || formData.quantity <= 0) {
    return { error: 'SKU and valid quantity are required' }
  }

  const { error } = await supabase.from('inventory_transactions').insert({
    sku_id: formData.sku_id,
    variation_id: formData.variation_id || null,
    quantity: formData.quantity,
    type: formData.type,
    transaction_date: formData.transaction_date,
    notes: formData.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/stock')
  revalidatePath(`/dashboard/inventory/${formData.sku_id}`)
  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function deleteStockTransaction(id: string, skuId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('inventory_transactions').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/stock')
  revalidatePath(`/dashboard/inventory/${skuId}`)
  revalidatePath('/dashboard/inventory')
  return { success: true }
}
