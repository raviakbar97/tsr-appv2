'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface TierInput {
  tier_name: string
  value: number
  max_value: number | null
  sort_order: number
}

export async function createFee(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const fee_type = formData.get('fee_type') as string
  const tiersJson = formData.get('tiers') as string | null

  if (!name || !fee_type || !['fixed', 'percentage'].includes(fee_type)) {
    return { error: 'Invalid name or fee type' }
  }

  const { data: fee, error } = await supabase
    .from('fees')
    .insert({ name, fee_type })
    .select('id')
    .single()
  if (error) return { error: error.message }

  if (tiersJson) {
    const tiers: TierInput[] = JSON.parse(tiersJson)
    if (tiers.length > 0) {
      const { error: tierError } = await supabase.from('fee_tiers').insert(
        tiers.map((t, i) => ({
          fee_id: fee.id,
          tier_name: t.tier_name,
          value: t.value,
          max_value: t.max_value,
          sort_order: t.sort_order ?? i,
        }))
      )
      if (tierError) return { error: tierError.message }
    }
  }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}

export async function updateFee(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const fee_type = formData.get('fee_type') as string
  const tiersJson = formData.get('tiers') as string | null

  if (!name || !fee_type || !['fixed', 'percentage'].includes(fee_type)) {
    return { error: 'Invalid name or fee type' }
  }

  const { error } = await supabase
    .from('fees')
    .update({ name, fee_type, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  // Replace all tiers: delete old, insert new
  await supabase.from('fee_tiers').delete().eq('fee_id', id)

  if (tiersJson) {
    const tiers: TierInput[] = JSON.parse(tiersJson)
    if (tiers.length > 0) {
      const { error: tierError } = await supabase.from('fee_tiers').insert(
        tiers.map((t, i) => ({
          fee_id: id,
          tier_name: t.tier_name,
          value: t.value,
          max_value: t.max_value,
          sort_order: t.sort_order ?? i,
        }))
      )
      if (tierError) return { error: tierError.message }
    }
  }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}

export async function deleteFees(ids: string[]) {
  const supabase = await createClient()

  const { error } = await supabase.from('fees').delete().in('id', ids)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}

export async function toggleFee(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('fees')
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}

export async function deleteFee(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('fees').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}
