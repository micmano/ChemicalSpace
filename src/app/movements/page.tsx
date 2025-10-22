// app/movements/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveInventory } from "@/lib/inventory";
import InvLink from "@/components/InvLink";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MovementsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const sp = await searchParams;
  const invSlugRaw = Array.isArray(sp?.inv) ? sp.inv[0] : sp?.inv;
  const invSlug = invSlugRaw || "general";

  // página (>=1)
  const pageRaw = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const page = Math.max(1, Number.parseInt(String(pageRaw ?? "1"), 10) || 1);
  const pageSize = 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { slug, id: inventoryId } = await getActiveInventory(invSlug);
  if (!inventoryId && invSlug !== "general") redirect("/movements?inv=general");

  let events: any[] = [];
  let totalCount = 0;

  if (inventoryId) {
    const { data, count, error } = await supabase
      .from("usage_events")
      .select(
        `
        id, action, planned_amount, planned_unit, actual_amount, actual_unit,
        note, created_at, user_name,
        reagent:reagent_id ( id, name )
      `,
        { count: "exact" } // ← trae el total para paginación
      )
      .eq("inventory_id", inventoryId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      events = data ?? [];
      totalCount = count ?? 0;
    } else {
      console.error("usage_events error:", error);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const showingFrom = totalCount === 0 ? 0 : from + 1;
  const showingTo = Math.min(to + 1, totalCount);

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-100">Movimientos</h1>
          <span className="rounded-md border border-blue-700 bg-neutral-900/80 px-2 py-0.5 text-xs text-blue-300">
            {slug}
          </span>
        </div>

        {/* Ir a Reactivos → usa InvLink para mantener ?inv= */}
        <InvLink
          href="/dashboard"
          className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-neutral-800"
        >
          Ir a Reactivos
        </InvLink>
      </div>

      <Legend />

      {/* Barra de paginación arriba */}
      <Pagination
        page={page}
        totalPages={totalPages}
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalCount={totalCount}
      />

      <div className="space-y-2">
        {events.length ? (
          events.map((e) => <EventCard key={e.id} e={e} />)
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-4 text-sm text-gray-300">
            No hay movimientos registrados.
          </div>
        )}
      </div>

      {/* Barra de paginación abajo */}
      <Pagination
        page={page}
        totalPages={totalPages}
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalCount={totalCount}
      />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <span className="rounded-lg border border-red-800 bg-red-950/60 px-2 py-1 text-red-300">Retiro</span>
      <span className="rounded-lg border border-green-800 bg-green-950/60 px-2 py-1 text-green-300">Devolución</span>
      <span className="rounded-lg border border-yellow-800 bg-yellow-950/60 px-2 py-1 text-yellow-300">Cantidad consumida</span>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  showingFrom,
  showingTo,
  totalCount,
}: {
  page: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalCount: number;
}) {
  const prevHref = `/movements?page=${page - 1}`;
  const nextHref = `/movements?page=${page + 1}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-neutral-900/80 px-3 py-2 text-sm">
      <div className="text-gray-300">
        Mostrando <b className="text-gray-100">{showingFrom}</b>–<b className="text-gray-100">{showingTo}</b> de{" "}
        <b className="text-gray-100">{totalCount}</b>
      </div>
      <div className="flex items-center gap-2">
        <InvLink
          href={prevHref}
          className={`rounded-lg border px-2 py-1 ${
            page > 1
              ? "border-gray-700 text-gray-200 hover:bg-neutral-800"
              : "border-gray-800 text-gray-500 cursor-not-allowed"
          }`}
          aria-disabled={page <= 1}
        >
          ← Anterior
        </InvLink>
        <span className="rounded border border-gray-800 bg-neutral-900/50 px-2 py-1 text-gray-300">
          Página {page} / {totalPages}
        </span>
        <InvLink
          href={nextHref}
          className={`rounded-lg border px-2 py-1 ${
            page < totalPages
              ? "border-gray-700 text-gray-200 hover:bg-neutral-800"
              : "border-gray-800 text-gray-500 cursor-not-allowed"
          }`}
          aria-disabled={page >= totalPages}
        >
          Siguiente →
        </InvLink>
      </div>
    </div>
  );
}

function EventCard({ e }: { e: any }) {
  const isCheckout = e.action === "checkout";
  const base = "rounded-2xl border p-3 text-sm";
  const cls = isCheckout
    ? `${base} border-red-800 bg-red-950/40`
    : `${base} border-green-800 bg-green-950/40`;
  const when = new Date(e.created_at).toLocaleString("es-AR");
  const reagentName = e.reagent?.name ?? "Reactivo";
  const who = e.user_name ?? "Usuario";

  return (
    <div className={cls}>
      {isCheckout ? (
        <div>
          <div>
            <b className="text-red-300">Retiro</b> — <b className="text-red-300">{reagentName}</b>
          </div>
          <div className="text-gray-300">
            Por: <span className="font-bold">{who}</span> · Fecha:{" "}
            <span className="font-bold">{when}</span>
          </div>
        </div>
      ) : (
        <div>
          <div>
            <b className="text-green-300">Devolución</b> — <b className="text-green-300">{reagentName}</b>
          </div>
          <div className="text-gray-300">
            Por: <span className="font-bold">{who}</span> · Fecha:{" "}
            <span className="font-bold">{when}</span>
          </div>
          <div>
            <b className="text-yellow-300">Consumido:</b>{" "}
            <span className="rounded bg-yellow-950/60 px-1 font-semibold text-yellow-300">
              {formatAmount(e.actual_amount, e.actual_unit)}
            </span>
          </div>
        </div>
      )}
      {e.note && <div className="mt-2 text-gray-400">Nota: {e.note}</div>}
    </div>
  );
}

function formatAmount(n?: number | null, unit?: string | null) {
  if (!n || Number.isNaN(Number(n))) return "0";
  return `${String(n)}${unit ? ` ${unit}` : ""}`;
}
