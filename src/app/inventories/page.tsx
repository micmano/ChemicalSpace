// src/app/inventories/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CopyField from "@/components/CopyField";
import { rotateInvite, deleteInventory } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

export default async function InventoriesIndex() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const { data, error } = await supabase.rpc("my_inventories");
  if (error) {
    console.error("my_inventories error:", error);
  }
  const invs = (data as any[]) || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <h1 className="text-xl font-semibold text-gray-100">Mis inventarios</h1>

      <div className="rounded-2xl border border-gray-800 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900">
            <tr className="border-b border-gray-800">
              <Th>Nombre</Th>
              <Th>Etiqueta</Th>
              <Th>Visibilidad</Th>
              <Th>Acceso</Th>
              <Th>Invitación</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {invs.map((i) => {
              const isOwner = i.owner_user_id === auth.user!.id;
              const canManage = isAdmin || isOwner;
              const allowDelete = isOwner && i.slug !== "general"; // sólo dueño y nunca 'general'

              return (
                <tr key={i.id} className="border-b border-gray-800">
                  <Td className="text-gray-100">{i.name}</Td>
                  <Td className="text-gray-300">{i.slug}</Td>
                  <Td>
                    {i.is_private ? (
                      <span className="inline-block rounded border border-purple-800 bg-purple-950/50 px-2 py-0.5 text-purple-300">
                        Privado
                      </span>
                    ) : (
                      <span className="inline-block rounded border border-gray-700 bg-neutral-900/60 px-2 py-0.5 text-gray-300">
                        Público
                      </span>
                    )}
                  </Td>
                  <Td>
                    {isOwner ? (
                      <span className="inline-block rounded border border-blue-800 bg-blue-950/50 px-2 py-0.5 text-blue-300">
                        Dueño
                      </span>
                    ) : (
                      <span className="inline-block rounded border border-green-800 bg-green-950/50 px-2 py-0.5 text-green-300">
                        Miembro
                      </span>
                    )}
                  </Td>
                  <Td>
                    {canManage ? (
                      i.invite_code ? (
                        <div className="flex justify-center">
                          <CopyField value={i.invite_code} />
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )
                    ) : (
                      <span className="text-gray-500">No disponible</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <a
                        href={`/dashboard?inv=${i.slug}`}
                        className="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-200 hover:bg-neutral-800"
                      >
                        Abrir
                      </a>

                      {canManage && (
                        <form action={rotateInvite}>
                          <input type="hidden" name="slug" value={i.slug} />
                          <button
                            className="rounded-lg border border-yellow-800 bg-yellow-950/50 px-3 py-1.5 text-yellow-300 hover:bg-yellow-900/50"
                            title="Generar un nuevo código de invitación"
                          >
                            Generar código
                          </button>
                        </form>
                      )}
                        {( (i.slug === 'general' && isAdmin) || (i.slug !== 'general' && isOwner) ) && (
                        <form action="/inventories/export" method="post">
                            <input type="hidden" name="slug" value={i.slug} />
                            <button
                            className="rounded-lg border border-teal-800 bg-teal-950/50 px-3 py-1.5 text-teal-300 hover:bg-teal-900/50"
                            title="Exportar reactivos a CSV"
                            >
                            Exportar CSV
                            </button>
                        </form>
                        )}
                      {allowDelete && (
                        <form action={deleteInventory}>
                          <input type="hidden" name="slug" value={i.slug} />
                          <ConfirmButton
                            confirm="¿Seguro que querés eliminar este inventario? Esta acción no se puede deshacer."
                            className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1.5 text-red-300 hover:bg-red-900/50"
                          >
                            Eliminar
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-300 text-center">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top text-center ${className}`}>{children}</td>;
}
