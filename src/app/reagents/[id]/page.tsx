// app/reagents/[id]/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { checkoutReagent, returnReagent } from "./actions";
import MoleculeViewer from "@/components/MoleculeViewer";
import MoleculeComputed from "@/components/MoleculeComputed";
import InvLink from "@/components/InvLink";
import type { ReactNode } from "react";

const MASS = ["kg", "g", "mg"] as const;
const VOL = ["L", "mL", "uL"] as const;

function unitFamily(u?: string | null) {
  if (!u) return VOL;
  return (MASS as readonly string[]).includes(u!) ? MASS : VOL;
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReagentDetail({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const invSlug = Array.isArray(sp.inv) ? sp.inv[0] : sp.inv || "general";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) notFound();

  const { data: r, error } = await supabase
    .from("reagents")
    .select(`
      id, name, smiles, category, synonyms, cas, code, location, sublocation,
      quantity, unit, min_stock, type, vendor, purity, state, opened_at, keywords, hazard_codes, observations,
      in_use, in_use_by, in_use_by_name, in_use_at,
      planned_use_amount, planned_use_unit, planned_use_note, updated_at,
      inventory_id, appearance, density, boiling_point_c, melting_point_c
    `)
    .eq("id", id)
    .single();

  if (error || !r) notFound();

  // ¿Puede editar? admin o dueño del inventario
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", auth.user.id).single();
  const isAdmin = profile?.role === "admin";

  const { data: invRow } = await supabase
    .from("inventories").select("owner_user_id").eq("id", r.inventory_id).single();
  const isOwner = invRow?.owner_user_id === auth.user.id;
  const canEdit = isAdmin || isOwner;

  const planned = r.planned_use_amount ?? 0;
  const plannedUnit = r.planned_use_unit ?? r.unit;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">{r.name}</h1>
        <div className="space-x-2 text-sm">
          {canEdit && (
            <InvLink
              href={`/reagents/${r.id}/edit`}
              className="rounded-lg border border-blue-800 bg-blue-950/50 px-3 py-2 text-blue-300 hover:bg-blue-900/50"
            >
              Editar
            </InvLink>
          )}
          <InvLink
            href="/dashboard"
            className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800"
          >
            ← Volver
          </InvLink>
        </div>
      </div>

      {/* GRID principal: tabla (2/3) + estructura (1/3) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Columna izquierda: ficha */}
        <div className="md:col-span-2">
          <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-neutral-900/80">
            <table className="min-w-full text-sm">
              <tbody>
                <Row label="Nombre" value={r.name} />
                <Row label="Categoría" value={r.category} />
                <Row label="SMILES" value={r.smiles ?? "—"} />
                <Row
                  label="Fórmula química"
                  value={
                    r.category === "organico" && r.smiles ? (
                      <MoleculeComputed smiles={r.smiles} field="formula" />
                    ) : ("—")
                  }
                />
                <Row
                  label="Peso molecular"
                  value={
                    r.category === "organico" && r.smiles ? (
                      <MoleculeComputed smiles={r.smiles} field="mw" />
                    ) : ("—")
                  }
                />
                <Row label="Sinónimos" value={r.synonyms ?? "—"} />
                <Row label="CAS" value={r.cas ?? "—"} />
                <Row label="Apariencia" value={r.appearance ?? "—"} />
                <Row label="Densidad (g/mL)" value={r.density ?? "—"} />
                <Row label="P. ebullición (°C)" value={r.boiling_point_c ?? "—"} />
                <Row label="P. fusión (°C)" value={r.melting_point_c ?? "—"} />
                <Row label="Localización" value={r.location ?? "—"} />
                <Row label="Sublocalización" value={r.sublocation ?? "—"} />
                <Row label="ID interno" value={r.code ?? "—"} />
                <Row label="Recipiente" value={r.type ?? "—"} />
                <Row label="Vendedor" value={r.vendor ?? "—"} />
                <Row label="Pureza" value={r.purity ?? "—"} />
                <Row label="Estado" value={r.state ?? "—"} />
                <Row label="Abierto el" value={r.opened_at ?? "—"} />
                <Row label="Cantidad (stock actual)" value={`${String(r.quantity)} ${r.unit}`} />
                <Row label="Umbral (stock mínimo)" value={String(r.min_stock ?? 0)} />
                <Row label="Keywords" value={r.keywords?.join(", ") || "—"} />
                <Row label="Riesgos" value={r.hazard_codes ?? "—"} />
                <Row label="Observaciones" value={r.observations ?? "—"} />
                <Row
                  label="En uso"
                  value={
                    r.in_use ? (
                      <span className="rounded bg-yellow-950/50 px-2 py-0.5 text-yellow-200">
                        Sí — {r.in_use_by_name ?? "Usuario"}
                      </span>
                    ) : (
                      <span className="rounded bg-green-950/50 px-2 py-0.5 text-green-200">No</span>
                    )
                  }
                />
                {r.in_use ? (
                  <>
                    <Row
                      label="Desde"
                      value={r.in_use_at ? new Date(r.in_use_at).toLocaleString("es-AR") : "—"}
                    />
                    <Row label="Aprox. planificado" value={`${String(planned)} ${plannedUnit}`} />
                    <Row label="Nota" value={r.planned_use_note ?? "—"} />
                  </>
                ) : null}
                <Row label="Última modificación" value={new Date(r.updated_at).toLocaleString("es-AR")} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha: estructura */}
        <aside className="md:col-span-1">
          <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-3 md:sticky md:top-4">
            <div className="mb-2 text-sm font-bold text-gray-300">Estructura</div>
            {r.category === "organico" && r.smiles ? (
              <div className="flex items-center justify-center">
                <MoleculeViewer smiles={r.smiles} width={360} height={360} />
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {r.smiles
                  ? "La estructura sólo se renderiza para compuestos orgánicos."
                  : "Sin SMILES cargado."}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Acciones de uso */}
      {!r.in_use ? (
        <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-4">
          <h2 className="mb-2 font-bold text-gray-100">Registro de uso</h2>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="reagent_id" value={r.id} />
            <div>
              <label className="block text-sm font-medium text-gray-300">Cantidad aproximada</label>
              <input
                name="planned_amount"
                type="number"
                step="0.001"
                min={0}
                required
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Unidad</label>
              <select
                name="planned_unit"
                defaultValue={r.planned_use_unit ?? r.unit}
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                {unitFamily(r.unit).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300">Nota (opcional)</label>
              <input
                name="note"
                placeholder="propósito o breve comentario"
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="md:col-span-3">
              <button
                formAction={checkoutReagent}
                className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-500 active:scale-95 transition"
              >
                Registrar Retiro
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-4">
          <h2 className="mb-2 font-bold text-gray-100">Devolver y registrar consumo</h2>
          <p className="mb-3 text-sm text-gray-300">
            Aproximado planificado:{" "}
            <b className="text-gray-100">{String(planned)} {plannedUnit}</b>
          </p>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="reagent_id" value={r.id} />
            <div>
              <label className="block text-sm font-medium text-gray-300">Cantidad consumida</label>
              <input
                name="actual_amount"
                type="number"
                step="0.001"
                min={0}
                required
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Unidad</label>
              <select
                name="actual_unit"
                defaultValue={r.unit}
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                {unitFamily(r.unit).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300">Nota (opcional)</label>
              <input
                name="note"
                placeholder="observaciones"
                className="w-full rounded-lg border border-gray-700 bg-neutral-900 p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="md:col-span-3">
              <button
                formAction={returnReagent}
                className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-500 active:scale-95 transition"
              >
                Devolver
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr className="border-t border-gray-800">
      <th className="w-56 bg-neutral-900 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-300 align-top">
        {label}
      </th>
      <td className="px-3 py-2 text-gray-200">{value}</td>
    </tr>
  );
}
