'use server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'


export async function createMovement(formData: FormData) {
const supabase = await createClient()
const { data: auth } = await supabase.auth.getUser()
if (!auth.user) return { error: 'No autenticado' }


const reagent_id = String(formData.get('reagent_id') ?? '')
const type = String(formData.get('type') ?? 'out')
const amount = Number(formData.get('amount') ?? 0)
const unit = String(formData.get('unit') ?? 'g')
const reason = String(formData.get('reason') ?? '')


const { error } = await supabase
.from('stock_movements')
.insert({ reagent_id, type, amount, unit, reason, by_user: auth.user.id })


if (error) return { error: error.message }
redirect('/dashboard')
}