'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface VariationInput {
  variation_name: string
  base_price_override: number | null
  warehouse_item_id: string | null
  warehouse_item_qty: number
}

interface FeeInput {
  fee_id: string
  value: number
  max_value: number | null
  fee_tier_id: string | null
}

export async function createSKU(formData: {
  name: string
  sku_code: string
  base_price: number
  warehouse_item_id: string | null
  warehouse_item_qty: number
  variations: VariationInput[]
  fees: FeeInput[]
}) {
  const supabase = await createClient()

  if (!formData.name || !formData.sku_code) {
    return { error: 'Name and SKU code are required' }
  }

  // Create SKU
  const { data: sku, error: skuError } = await supabase
    .from('skus')
    .insert({
      name: formData.name,
      sku_code: formData.sku_code,
      base_price: formData.base_price,
      warehouse_item_id: formData.warehouse_item_id,
      warehouse_item_qty: formData.warehouse_item_qty || 1,
    })
    .select('id')
    .single()

  if (skuError) return { error: skuError.message }
  if (!sku) return { error: 'Failed to create SKU' }

  // Create variations
  if (formData.variations.length > 0) {
    const variations = formData.variations.map((v) => ({
      sku_id: sku.id,
      variation_name: v.variation_name,
      base_price_override: v.base_price_override,
      warehouse_item_id: v.warehouse_item_id,
      warehouse_item_qty: v.warehouse_item_qty || 1,
    }))
    const { error: varError } = await supabase.from('sku_variations').insert(variations)
    if (varError) return { error: varError.message }
  }

  // Assign fees with values
  if (formData.fees.length > 0) {
    const fees = formData.fees.map((f) => ({
      sku_id: sku.id,
      fee_id: f.fee_id,
      value: f.value,
      max_value: f.max_value,
      fee_tier_id: f.fee_tier_id,
    }))
    const { error: feeError } = await supabase.from('sku_fees').insert(fees)
    if (feeError) return { error: feeError.message }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function updateSKU(
  id: string,
  formData: {
    name: string
    sku_code: string
    base_price: number
    is_active: boolean
    warehouse_item_id: string | null
    warehouse_item_qty: number
    variations: VariationInput[]
    fees: FeeInput[]
  }
) {
  const supabase = await createClient()

  if (!formData.name || !formData.sku_code) {
    return { error: 'Name and SKU code are required' }
  }

  const { error: skuError } = await supabase
    .from('skus')
    .update({
      name: formData.name,
      sku_code: formData.sku_code,
      base_price: formData.base_price,
      is_active: formData.is_active,
      warehouse_item_id: formData.warehouse_item_id,
      warehouse_item_qty: formData.warehouse_item_qty || 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (skuError) return { error: skuError.message }

  // Replace variations
  await supabase.from('sku_variations').delete().eq('sku_id', id)
  if (formData.variations.length > 0) {
    const variations = formData.variations.map((v) => ({
      sku_id: id,
      variation_name: v.variation_name,
      base_price_override: v.base_price_override,
      warehouse_item_id: v.warehouse_item_id,
      warehouse_item_qty: v.warehouse_item_qty || 1,
    }))
    const { error: varError } = await supabase.from('sku_variations').insert(variations)
    if (varError) return { error: varError.message }
  }

  // Replace fee assignments with values
  await supabase.from('sku_fees').delete().eq('sku_id', id)
  if (formData.fees.length > 0) {
    const fees = formData.fees.map((f) => ({
      sku_id: id,
      fee_id: f.fee_id,
      value: f.value,
      max_value: f.max_value,
      fee_tier_id: f.fee_tier_id,
    }))
    const { error: feeError } = await supabase.from('sku_fees').insert(fees)
    if (feeError) return { error: feeError.message }
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath(`/dashboard/inventory/${id}`)
  return { success: true }
}

export async function deleteSKU(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('skus').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function deleteSKUs(ids: string[]) {
  const supabase = await createClient()

  const { error } = await supabase.from('skus').delete().in('id', ids)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function toggleSKU(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('skus')
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}
