// app/inventories/new/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

function slugify(s: string) {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')        // separadores
    .replace(/(^-|-$)+/g, '')                         // bordes
}

export async function createInventory(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const slugRaw = String(formData.get('slug') ?? '').trim()
  const isPrivate = !!formData.get('is_private')

  if (!name) {
    redirect('/inventories/new?error=' + encodeURIComponent('El nombre es obligatorio.'))
  }

  const p_slug = slugRaw || slugify(name)

  const { data, error } = await supabase.rpc('request_inventory', {
    p_name: name,
    p_slug: p_slug || null,
    p_is_private: isPrivate,
  })

  if (error) {
    // Opciones de mensajes más claros
    let friendly = error.message || 'No se pudo crear el inventario.'
    if (error.code === '23505') {
      // Errores de unicidad (nombre o slug)
      if (/slug/i.test(error.message) || /inventories_slug_unique/i.test(error.message)) {
        friendly = 'El slug ya está en uso. Probá con otro o dejalo vacío para generarlo.'
      } else if (/nombre/i.test(error.message) || /name/i.test(error.message) || /inventories_name_norm_unique/i.test(error.message)) {
        friendly = 'Ya existe un inventario con ese nombre. Usá otro nombre.'
      } else {
        friendly = 'Nombre o slug ya en uso. Probá cambiarlos.'
      }
    } else if (/dueñ[oa]|owner/i.test(error.message) || /máximo/i.test(error.message)) {
      // Por si tu RPC valida "un solo inventario como dueño"
      friendly = error.message
    }
    // Log interno por si necesitás depurar
    console.error('createInventory error', error)
    redirect('/inventories/new?error=' + encodeURIComponent(friendly))
  }

  const created = (data as any[])?.[0]
  if (!created) {
    redirect('/inventories/new?error=' + encodeURIComponent('No se recibió respuesta del servidor.'))
  }

  // La RPC Opción 1 devuelve: inventory_id, inventory_slug
  const invSlug = created.inventory_slug ?? p_slug
  redirect(`/dashboard?inv=${invSlug}`)
}
