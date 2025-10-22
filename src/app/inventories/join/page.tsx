// app/inventories/join/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { joinInventory } from "./actions";

export default async function JoinInventoryPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6">
        <h1 className="mb-4 text-xl font-semibold text-gray-100">Unirse a inventario</h1>
        <form className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300">Código de invitación</label>
            <input name="code" required placeholder="p.ej. a3f9bc12"
              className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <button formAction={joinInventory}
              className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-200">Unirme</button>
            <a href="/dashboard?inv=general"
              className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800">Cancelar</a>
          </div>
        </form>
      </div>
    </div>
  );
}
