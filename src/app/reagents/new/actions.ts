// app/reagents/new/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveInventory } from '@/lib/inventory'

export async function createReagent(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const invSlug = String(formData.get('inv_slug') ?? 'general')
  const { id: inventoryId, slug } = await getActiveInventory(invSlug)
  if (!inventoryId) {
    return { error: 'Inventario no válido o sin acceso.' }
  }

  // Rol admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  // Igual que en /inventories: my_inventories() y comparar owner_user_id
  const { data: invs } = await supabase.rpc('my_inventories')
  const current = (invs || []).find((i: any) => i.id === inventoryId || i.slug === slug)
  const isOwner = current?.owner_user_id === auth.user.id

  const canCreate = Boolean(isOwner || (isAdmin && slug === 'general'))
  if (!canCreate) {
    return { error: 'No tenés permisos para agregar en este inventario.' }
  }

  const keywordsRaw = String(formData.get('keywords') ?? '')
  const keywords = keywordsRaw.split(',').map(s => s.trim()).filter(Boolean)

  const payload: any = {
    inventory_id: inventoryId,
    name: String(formData.get('name') ?? ''),
    synonyms: formData.get('synonyms') ? String(formData.get('synonyms')) : null,
    category: String(formData.get('category') ?? 'organico'),
    smiles: formData.get('smiles') ? String(formData.get('smiles')) : null,
    cas: formData.get('cas') ? String(formData.get('cas')) : null,
    appearance: formData.get('appearance') ? String(formData.get('appearance')) : null,
    density: formData.get('density') ? Number(formData.get('density')) || null : null,
    boiling_point_c: formData.get('boiling_point_c') ? Number(formData.get('boiling_point_c')) || null : null,
    melting_point_c: formData.get('melting_point_c') ? Number(formData.get('melting_point_c')) || null : null,
    location: formData.get('location') ? String(formData.get('location')) : null,
    sublocation: formData.get('sublocation') ? String(formData.get('sublocation')) : null,
    code: formData.get('code') ? String(formData.get('code')) : null,
    type: formData.get('type') ? String(formData.get('type')) : null,
    purity: formData.get('purity') ? String(formData.get('purity')) : null,
    vendor: formData.get('vendor') ? String(formData.get('vendor')) : null,
    quantity: Number(formData.get('quantity') ?? 0) || 0,
    unit: String(formData.get('unit') ?? 'g'),
    min_stock: Number(formData.get('min_stock') ?? 0) || 0,
    keywords,
    observations: formData.get('observations') ? String(formData.get('observations')) : null,
    in_use: !!formData.get('in_use'),
    hazard_codes: formData.get('hazard_codes') ? String(formData.get('hazard_codes')) : null,
    state: formData.get('state') ? String(formData.get('state')) : null,
    opened_at: formData.get('opened_at') ? String(formData.get('opened_at')) : null,

  }

  const { error } = await supabase.from('reagents').insert(payload)
  if (error) {
    return { error: error.message }
  }

  redirect(`/dashboard?inv=${slug}`)
}
