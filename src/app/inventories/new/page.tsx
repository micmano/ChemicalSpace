// app/inventories/new/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createInventory } from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewInventoryPage({ searchParams }: PageProps) {
  const sp = (await searchParams) || {};
  const errorMsg = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: invs } = await supabase.rpc("my_inventories");
  const alreadyOwner = (invs || []).some(
    (i: any) => i.owner_user_id === auth.user!.id && i.slug !== "general"
  );

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6">
        <h1 className="mb-4 text-xl font-semibold text-gray-100">Crear inventario</h1>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {alreadyOwner ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-amber-800 bg-amber-950/40 p-4 text-amber-200">
              Ya sos <b>dueño</b> de un inventario. Para crear otro, primero transferí
              la propiedad o pedí que te agreguen como miembro al nuevo.
            </div>
            <div className="flex gap-2">
              <a href="/inventories" className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800">
                Mis Inventarios
              </a>
              <a href="/inventories/join" className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800">
                Unirme por código
              </a>
            </div>
          </div>
        ) : (
          <form className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300">Nombre</label>
              <input
                name="name"
                required
                placeholder="Mi laboratorio"
                className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">El nombre debe ser único.</p>
            </div>

            <div>
              <label className="block text-sm text-gray-300">Etiqueta a mostrar (opcional)</label>
              <input
                name="slug"
                placeholder="mi-lab-quimica"
                className="w-full rounded-lg border placeholder-gray-500 border-gray-700 bg-neutral-900 p-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">Si lo dejás vacío se genera desde el nombre.</p>
            </div>

            <div className="flex items-center gap-2">
              <input id="is_private" name="is_private" type="checkbox" defaultChecked className="h-4 w-4 accent-gray-300" />
              <label htmlFor="is_private" className="text-sm text-gray-300">Privado (sólo miembros)</label>
            </div>

            <div className="flex gap-2 pt-2">
              <button formAction={createInventory} className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-200">
                Crear
              </button>
              <a href="/dashboard?inv=general" className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800">
                Cancelar
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
