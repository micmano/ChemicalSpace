'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function rotateInvite(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) redirect('/inventories?error=' + encodeURIComponent('Slug inválido'))

  // Intentos compatibles (nombre de función y nombre de parámetro)
  const attempts: Array<[string, Record<string, any>]> = [
    ['rotate_invite_code', { p_slug: slug }],
    ['rotate_invite_code', { slug }],
    ['rotate_inventory_invite', { p_slug: slug }],
    ['rotate_inventory_invite', { slug }],
  ]

  let lastError: any = null
  for (const [fn, args] of attempts) {
    const { error } = await supabase.rpc(fn, args)
    if (!error) {
      return redirect('/inventories?ok=' + encodeURIComponent('Código de invitación actualizado.'))
    }
    lastError = error
    // Si la función no existe, probamos la siguiente
    if (error?.code !== 'PGRST202') break
  }

  console.error('rotateInvite error', lastError)
  return redirect('/inventories?error=' + encodeURIComponent(lastError?.message || 'No se pudo rotar el código.'))
}

export async function deleteInventory(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) redirect('/inventories?error=' + encodeURIComponent('Slug inválido'))

  const { error } = await supabase.rpc('delete_inventory', { p_slug: slug })

  if (error) {
    console.error('deleteInventory error', error)
    return redirect('/inventories?error=' + encodeURIComponent(error.message || 'No se pudo eliminar el inventario.'))
  }

  return redirect('/inventories?ok=' + encodeURIComponent('Inventario eliminado.'))
}