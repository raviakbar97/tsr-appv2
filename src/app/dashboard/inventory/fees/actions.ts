'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFee(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const percentage = parseFloat(formData.get('percentage') as string)

  if (!name || isNaN(percentage) || percentage < 0 || percentage > 100) {
    return { error: 'Invalid name or percentage' }
  }

  const { error } = await supabase.from('fees').insert({ name, percentage })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/fees')
  return { success: true }
}

export async function updateFee(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const percentage = parseFloat(formData.get('percentage') as string)

  if (!name || isNaN(percentage) || percentage < 0 || percentage > 100) {
    return { error: 'Invalid name or percentage' }
  }

  const { error } = await supabase
    .from('fees')
    .update({ name, percentage, updated_at: new Date().toISOString() })
    .eq('id', id)
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
