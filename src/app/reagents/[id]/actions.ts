'use server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function checkoutReagent(formData: FormData) {
  const supabase = await createClient()
  const reagent_id = String(formData.get('reagent_id') ?? '')
  const planned_amount = Number(formData.get('planned_amount') ?? 0)
  const planned_unit = String(formData.get('planned_unit') ?? '')
  const note = String(formData.get('note') ?? '')
  const { error } = await supabase.rpc('reagent_checkout', {
    p_reagent: reagent_id,
    p_planned_amount: planned_amount,
    p_planned_unit: planned_unit || null,
    p_note: note,
  })
  if (error) return { error: error.message }
  redirect(`/reagents/${reagent_id}`)
}

export async function returnReagent(formData: FormData) {
  const supabase = await createClient()
  const reagent_id = String(formData.get('reagent_id') ?? '')
  const actual_amount = Number(formData.get('actual_amount') ?? 0)
  const actual_unit = String(formData.get('actual_unit') ?? '')
  const note = String(formData.get('note') ?? '')
  const { error } = await supabase.rpc('reagent_return', {
    p_reagent: reagent_id,
    p_actual_amount: actual_amount,
    p_actual_unit: actual_unit || null,
    p_note: note,
  })
  if (error) return { error: error.message }
  redirect(`/reagents/${reagent_id}`)
}