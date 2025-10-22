// src/app/inventories/export/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return new Response('No autenticado', { status: 401 })

  const form = await req.formData()
  const slug = String(form.get('slug') ?? '').trim()
  if (!slug) return new Response('Slug inválido', { status: 400 })

  // Rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  // Inventario a exportar
  const { data: inv, error: invErr } = await supabase
    .from('inventories')
    .select('id, slug, name, owner_user_id')
    .eq('slug', slug)
    .single()

  if (invErr || !inv) return new Response('Inventario inexistente', { status: 404 })

  const isOwner = inv.owner_user_id === auth.user.id

  // Permisos:
  // - 'general' => sólo admin
  // - cualquier otro => sólo dueño
  if (slug === 'general') {
    if (!isAdmin) return new Response('No autorizado', { status: 403 })
  } else {
    if (!isOwner) return new Response('No autorizado', { status: 403 })
  }

  // Traer reactivos del inventario
  const { data: reagents, error: rErr } = await supabase
    .from('reagents')
    .select(`
      id, name, cas, code, quantity, unit,
      location, sublocation, category, smiles,
      min_stock, type, vendor, keywords, observations,
      in_use, updated_at
    `)
    .eq('inventory_id', inv.id)
    .order('name', { ascending: true })

  if (rErr) return new Response('Error consultando reactivos', { status: 500 })

  const rows = reagents ?? []
  const header = [
    'id','name','cas','code','quantity','unit',
    'location','sublocation','category','smiles',
    'min_stock','type','vendor','keywords','observations',
    'in_use','updated_at'
  ]

  const esc = (v: any) => {
    if (v == null) return ''
    let s = Array.isArray(v) ? v.join('; ') : String(v)
    const mustQuote = /[",\n]/.test(s)
    s = s.replace(/"/g, '""')
    return mustQuote ? `"${s}"` : s
  }

  const lines = [
    header.join(','),
    ...rows.map((r) => header.map((k) => esc((r as any)[k])).join(',')),
  ]

  const csv = '\uFEFF' + lines.join('\n') // BOM para Excel

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${inv.slug}-reagents.csv"`,
    },
  })
}
