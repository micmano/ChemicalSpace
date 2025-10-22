// app/reagents/[id]/edit/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

function toNum(x: FormDataEntryValue | null) {
  const s = String(x ?? '').trim()
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
function toDate(x: FormDataEntryValue | null) {
  const s = String(x ?? '').trim()
  return s || null
}
function toArrayCSV(x: FormDataEntryValue | null) {
  const s = String(x ?? '').trim()
  if (!s) return null
  return s.split(',').map(t => t.trim()).filter(Boolean)
}

export async function updateReagent(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  const inv = String(formData.get('inv') ?? '')

  const payload: any = {
    name: String(formData.get('name') ?? '').trim() || null,
    synonyms: String(formData.get('synonyms') ?? '').trim() || null,
    cas: String(formData.get('cas') ?? '').trim() || null,
    code: String(formData.get('code') ?? '').trim() || null,
    location: String(formData.get('location') ?? '').trim() || null,
    sublocation: String(formData.get('sublocation') ?? '').trim() || null,
    type: String(formData.get('type') ?? '').trim() || null,
    vendor: String(formData.get('vendor') ?? '').trim() || null,
    quantity: toNum(formData.get('quantity')),
    unit: String(formData.get('unit') ?? '').trim() || null,
    min_stock: toNum(formData.get('min_stock')),
    keywords: toArrayCSV(formData.get('keywords')),
    observations: String(formData.get('observations') ?? '').trim() || null,

    smiles: String(formData.get('smiles') ?? '').trim() || null,
    category: String(formData.get('category') ?? '').trim() || null,
    catalog_code: String(formData.get('catalog_code') ?? '').trim() || null,
    lot: String(formData.get('lot') ?? '').trim() || null,
    purity: String(formData.get('purity') ?? '').trim() || null,
    hazard_codes: String(formData.get('hazard_codes') ?? '').trim() || null,
    state: String(formData.get('state') ?? '').trim() || null,
    status: String(formData.get('status') ?? '').trim() || null,
    opened_at: toDate(formData.get('opened_at')),
    expires_at: toDate(formData.get('expires_at')),

    appearance: String(formData.get('appearance') ?? '').trim() || null,
    density: toNum(formData.get('density')),
    boiling_point_c: toNum(formData.get('boiling_point_c')),
    melting_point_c: toNum(formData.get('melting_point_c')),
  }

  // Normalizar strings vacíos
  for (const k of Object.keys(payload)) {
    if (typeof payload[k] === 'string' && payload[k].length === 0) payload[k] = null
  }

  const { error } = await supabase.from('reagents').update(payload).eq('id', id)
  if (error) {
    redirect(`/reagents/${id}/edit?inv=${encodeURIComponent(inv)}&error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/reagents/${id}${inv ? `?inv=${encodeURIComponent(inv)}` : ''}`)
}
