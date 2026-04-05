'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFee(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const fee_type = formData.get('fee_type') as string

  if (!name || !fee_type || !['fixed', 'percentage'].includes(fee_type)) {
    return { error: 'Invalid name or fee type' }
  }

  const { error } = await supabase.from('fees').insert({ name, fee_type })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}

export async function updateFee(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const fee_type = formData.get('fee_type') as string

  if (!name || !fee_type || !['fixed', 'percentage'].includes(fee_type)) {
    return { error: 'Invalid name or fee type' }
  }

  const { error } = await supabase
    .from('fees')
    .update({ name, fee_type, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

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
