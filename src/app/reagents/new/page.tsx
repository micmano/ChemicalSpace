// app/reagents/new/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveInventory } from "@/lib/inventory";
import InvLink from "@/components/InvLink";
import { createReagent } from "./actions";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewReagentPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const sp = await searchParams;
  const invSlugRaw = Array.isArray(sp?.inv) ? sp.inv[0] : sp?.inv;
  const invSlug = invSlugRaw || "general";

  // Inventario activo (usa tu helper actual)
  const { slug, id: inventoryId } = await getActiveInventory(invSlug);
  if (!inventoryId && invSlug !== "general") {
    redirect("/reagents/new?inv=general");
  }

  // Rol del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  // Igual que en /inventories: usamos my_inventories() y comparamos owner_user_id
  const { data: invs } = await supabase.rpc("my_inventories");
  const current = (invs || []).find(
    (i: any) => i.id === inventoryId || i.slug === slug
  );
  const isOwner = current?.owner_user_id === auth.user.id;

  const canCreate = Boolean(isOwner || (isAdmin && slug === "general"));

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-100">Nuevo reactivo</h1>
        <span className="rounded-md border border-blue-700 bg-neutral-900/80 px-2 py-0.5 text-xs text-blue-300">
          {slug}
        </span>
      </div>

      {!inventoryId ? (
        <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6 text-sm text-gray-300">
          No se pudo resolver el inventario actual. Probá con{" "}
          <InvLink href="/dashboard?inv=general" className="underline">general</InvLink>.
        </div>
      ) : !canCreate ? (
        <div className="rounded-2xl border border-amber-800 bg-amber-950/40 p-6 text-sm text-amber-200">
          No tenés permisos para agregar reactivos en este inventario.
          <div className="mt-3 flex gap-2">
            <InvLink
              href="/inventories"
              className="rounded-lg border border-amber-700 px-3 py-2 hover:bg-amber-900/30"
            >
              Mis Inventarios
            </InvLink>
            <InvLink
              href="/dashboard"
              className="rounded-lg border border-gray-700 px-3 py-2 hover:bg-neutral-800"
            >
              Volver al Inicio
            </InvLink>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6 shadow">
          <form className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Inventario actual para la action */}
            <input type="hidden" name="inv_slug" value={slug} />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">Nombre</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Sinónimos</label>
              <input name="synonyms" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Categoría</label>
              <select
                name="category"
                defaultValue="organico"
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100"
              >
                <option value="organico">Orgánico</option>
                <option value="inorganico">Inorgánico</option>
                <option value="solvente">Solvente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">SMILES</label>
              <input name="smiles" placeholder="CC(=O)Oc1ccccc1C(=O)O" className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100" autoComplete="off" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">CAS</label>
              <input name="cas" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300">Apariencia</label>
                <input
                  name="appearance"
                  placeholder="Sólido blanco, líquido incoloro…"
                  className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Densidad (g/mL)
                </label>
                <input
                  name="density"
                  type="number"
                  step="0.0001"
                  min={0}
                  placeholder="ej. 0.789"
                  className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Punto de ebullición (°C)
                </label>
                <input
                  name="boiling_point_c"
                  type="number"
                  step="0.1"
                  placeholder="ej. 78.3"
                  className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Punto de fusión (°C)
                </label>
                <input
                  name="melting_point_c"
                  type="number"
                  step="0.1"
                  placeholder="ej. -95"
                  className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Localización</label>
              <input name="location" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Sublocalización</label>
              <input name="sublocation" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">ID (código interno)</label>
              <input name="code" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Recipiente</label>
              <input name="type" placeholder="Frasco, Botella, Ampolla, etc." className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Pureza</label>
              <input name="purity" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Vendedor</label>
              <input name="vendor" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Cantidad (stock actual)</label>
              <input name="quantity" type="number" step="0.001" defaultValue={0} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Unidad</label>
              <select name="unit" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" defaultValue="g">
                <option>g</option><option>mg</option><option>kg</option><option>mL</option><option>L</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Umbral (stock mínimo)</label>
              <input name="min_stock" type="number" step="0.001" defaultValue={0} className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">Keywords (separadas por coma)</label>
              <input name="keywords" placeholder="ej: Aldehído, Cetona, Bromuro, etc." className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">Observaciones</label>
              <textarea name="observations" rows={3} placeholder="ej: Dañado, Dudoso, Bueno, Aspecto o Aparienciea actual, etc." className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Riesgos</label>
              <input name="hazard_codes" placeholder="ej: Corrosivo, Lacrimógeno, Carcinógeno, etc." className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Estado</label>
              <input name="state" placeholder="ej: Abierto ó Cerrado" className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Abierto el</label>
              <input name="opened_at" type="date" className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100" />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input id="in_use" name="in_use" type="checkbox" className="h-4 w-4 accent-gray-300" />
              <label htmlFor="in_use" className="text-sm text-gray-300">En uso</label>
            </div>

            <div className="md:col-span-2 flex gap-2 pt-2">
              <button formAction={createReagent} className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-200">
                Guardar
              </button>
              <InvLink href="/dashboard" className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800">
                Cancelar
              </InvLink>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
