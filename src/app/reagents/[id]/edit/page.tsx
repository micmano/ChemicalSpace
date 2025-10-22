// app/reagents/[id]/edit/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { updateReagent } from './actions'
import InvLink from '@/components/InvLink'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditReagentPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = (await searchParams) || {}
  const inv = Array.isArray(sp.inv) ? sp.inv[0] : sp.inv || 'general'
  const errorMsg = Array.isArray(sp.error) ? sp.error[0] : sp.error

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data: r, error } = await supabase
    .from('reagents')
    .select(`
      id, name, synonyms, cas, code, location, sublocation, type, vendor,
      quantity, unit, min_stock, keywords, observations,
      smiles, category, catalog_code, lot, purity, hazard_codes, state, status,
      opened_at, expires_at, inventory_id, appearance, density, boiling_point_c, melting_point_c
    `)
    .eq('id', id)
    .single()

  if (error || !r) notFound()

  // Permisos: admin o dueño del inventario
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', auth.user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: invRow } = await supabase
    .from('inventories').select('owner_user_id, slug').eq('id', r.inventory_id).single()
  const isOwner = invRow?.owner_user_id === auth.user.id

  if (!isAdmin && !isOwner) {
    // Sin permiso: volvemos a la ficha
    redirect(`/reagents/${id}${inv ? `?inv=${encodeURIComponent(inv)}` : ''}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Editar reactivo</h1>
        <div className="space-x-2 text-sm">
          <InvLink
            href={`/reagents/${id}`}
            className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800"
          >
            ← Volver a la ficha
          </InvLink>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-red-300">
          {errorMsg}
        </div>
      )}

      <form className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="inv" value={inv} />

        <div className="md:col-span-3">
          <label className="block text-sm text-gray-300">Nombre</label>
          <input name="name" defaultValue={r.name || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Sinónimos</label>
          <input name="synonyms" defaultValue={r.synonyms || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">CAS</label>
          <input name="cas" defaultValue={r.cas || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300">Apariencia</label>
        <input name="appearance" defaultValue={r.appearance ?? ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-300">Densidad (g/mL)</label>
        <input name="density" type="number" step="0.0001" min={0} defaultValue={r.density ?? ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-300">P. ebullición (°C)</label>
        <input name="boiling_point_c" type="number" step="0.1" defaultValue={r.boiling_point_c ?? ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
        <label className="block text-sm font-medium text-gray-300">P. fusión (°C)</label>
        <input name="melting_point_c" type="number" step="0.1" defaultValue={r.melting_point_c ?? ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">Localización</label>
          <input name="location" defaultValue={r.location || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Sublocalización</label>
          <input name="sublocation" defaultValue={r.sublocation || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">ID interno</label>
          <input name="code" defaultValue={r.code || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Recipiente</label>
          <input name="type" defaultValue={r.type || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Vendedor</label>
          <input name="vendor" defaultValue={r.vendor || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Cantidad (Stock Actual) </label>
          <input name="quantity" type="number" step="0.001" defaultValue={r.quantity ?? 0} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Unidad</label>
          <input name="unit" defaultValue={r.unit || 'g'} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div>
          <label className="block text-sm text-gray-300">Umbral (Stock Mínimo) </label>
          <input name="min_stock" type="number" step="0.001" defaultValue={r.min_stock ?? 0} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm text-gray-300">Keywords (usar coma)</label>
          <input name="keywords" defaultValue={Array.isArray(r.keywords) ? r.keywords.join(', ') : ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm text-gray-300">Observaciones</label>
          <textarea name="observations" rows={3} defaultValue={r.observations || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        {/* Extras */}
        <div>
          <label className="block text-sm text-gray-300">SMILES</label>
          <input name="smiles" defaultValue={r.smiles || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">Categoría</label>
          <input name="category" defaultValue={r.category || 'organico'} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">Pureza</label>
          <input name="purity" defaultValue={r.purity || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">Riesgos</label>
          <input name="hazard_codes" defaultValue={r.hazard_codes || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">Estado</label>
          <input name="state" defaultValue={r.state || ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-300">Abierto el</label>
          <input name="opened_at" type="date" defaultValue={r.opened_at ?? ''} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
        </div>

        <div className="md:col-span-3">
          <button formAction={updateReagent} className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 active:scale-95 transition">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  )
}