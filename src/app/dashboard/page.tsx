// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveInventory } from "@/lib/inventory";
import InvLink from "@/components/InvLink";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Dashboard({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  // Perfil (para log / posibles usos)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", auth.user.id)
    .single();

  const sp = await searchParams;

  // Inventario activo
  const invSlugRaw = Array.isArray(sp?.inv) ? sp.inv[0] : sp?.inv;
  const invSlug = invSlugRaw || "general";
  const { slug, id: inventoryId } = await getActiveInventory(invSlug);

  if (!inventoryId && invSlug !== "general") {
    redirect("/dashboard?inv=general");
  }

  // Búsqueda (q) y paginación (page)
  const qRaw = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const q = (qRaw ?? "").trim();
  const qSafe = q.replace(/[,]/g, " "); // evita romper la cláusula .or con comas

  const pageRaw = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const page = Math.max(1, Number.parseInt(String(pageRaw ?? "1"), 10) || 1);
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Consulta con filtros + conteo total para paginar
  let reagents: any[] = [];
  let totalCount = 0;

  if (inventoryId) {
    let query = supabase
      .from("reagents")
      .select(
        `
        id, name, synonyms, cas, code, location, sublocation,
        quantity, unit, min_stock, type, vendor, keywords, observations,
        in_use, updated_at
      `,
        { count: "exact" }
      )
      .eq("inventory_id", inventoryId);

    if (qSafe) {
      // Busca en campos de texto (ILIKE)
      query = query.or(
        [
          `name.ilike.%${qSafe}%`,
          `synonyms.ilike.%${qSafe}%`,
          `cas.ilike.%${qSafe}%`,
          `code.ilike.%${qSafe}%`,
          `smiles.ilike.%${qSafe}%`,
        ].join(",")
      );
    }

    const { data, count, error } = await query
      .order("name", { ascending: true })
      .range(from, to);

    if (!error) {
      reagents = data ?? [];
      totalCount = count ?? 0;
    } else {
      console.error("[Dashboard] reagents error:", error);
    }
  }

  const totalEnPagina = reagents.length;
  const sinStock = reagents.filter((r) => Number(r.quantity) === 0).length;
  const bajos = reagents.filter(
    (r) => Number(r.quantity) > 0 && Number(r.quantity) <= Number(r.min_stock ?? 0)
  ).length;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showingFrom = totalCount === 0 ? 0 : from + 1;
  const showingTo = Math.min(to + 1, totalCount);

  return (
    <div className="mx-auto max-w-7xl space-y-4 py-8">
      {/* Título + badge inventario */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-100">Inventario</h1>
          <span className="rounded-md border border-blue-700 bg-neutral-900/80 px-2 py-0.5 text-xs text-blue-300">
            {slug}
          </span>
        </div>

        {/* Buscador (GET) preserva el inventario activo */}
        {inventoryId && (
          <form method="get" action="/dashboard" className="flex w-full max-w-md items-center gap-2">
            <input type="hidden" name="inv" value={slug} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, CAS, SMILES o sinónimos"
              className="flex-1 rounded-lg border border-gray-700 bg-neutral-900 p-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <button
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-neutral-800"
              type="submit"
            >
              Buscar
            </button>
            {q ? (
              <InvLink
                href="/dashboard"
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-neutral-800"
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
              >
                Limpiar
              </InvLink>
            ) : null}
          </form>
        )}
      </div>

      {/* Aviso sin acceso */}
      {!inventoryId ? (
        <div className="rounded-2xl border border-gray-800 bg-neutral-900/80 p-6 text-sm text-gray-300">
          No tenés acceso al inventario <b>{slug}</b>. Probá con{" "}
          <a href="/dashboard?inv=general" className="underline">general</a> o
          pedí que te agreguen como miembro.
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <Card>
              <div className="text-sm text-gray-400">Total encontrados</div>
              <div className="text-3xl font-bold text-gray-100">{totalCount}</div>
              {q && <div className="mt-1 text-xs text-gray-400">Filtro: “{q}”</div>}
            </Card>

            <Card>
              <div className="text-sm text-gray-400">En esta página</div>
              <div className="text-3xl font-bold text-gray-100">{totalEnPagina}</div>
              <div className="mt-1 text-xs text-gray-400">
                Mostrando {showingFrom}–{showingTo}
              </div>
            </Card>

            <Card tint="yellow">
              <div className="text-sm text-yellow-300">Bajo stock (página)</div>
              <div className="text-3xl font-bold text-yellow-300">{bajos}</div>
            </Card>

            <Card tint="red">
              <div className="text-sm text-red-300">Sin stock (página)</div>
              <div className="text-3xl font-bold text-red-300">{sinStock}</div>
            </Card>
          </div>

          <Legend />

          {/* Paginación arriba */}
          <Pagination
            page={page}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalCount={totalCount}
            q={q}
          />

          <ReagentsTable reagents={reagents} />

          {/* Paginación abajo */}
          <Pagination
            page={page}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalCount={totalCount}
            q={q}
          />
        </>
      )}
    </div>
  );
}

function Card({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint?: "red" | "yellow";
}) {
  const base = "rounded-2xl border p-4";
  const map: Record<string, string> = {
    red: "border-red-800 bg-red-950/40",
    yellow: "border-yellow-800 bg-yellow-950/40",
  };
  const cls = tint ? `${base} ${map[tint]}` : `${base} border-gray-800 bg-neutral-900/80`;
  return <div className={cls}>{children}</div>;
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <span className="rounded-lg border border-green-800 bg-green-950/60 px-2 py-1 font-bold text-green-300">
        Hay Stock
      </span>
      <span className="rounded-lg border border-yellow-800 bg-yellow-950/60 px-2 py-1 font-bold text-yellow-300">
        Bajo Stock
      </span>
      <span className="rounded-lg border border-red-800 bg-red-950/60 px-2 py-1 font-bold text-red-300">
        No Hay Stock
      </span>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  showingFrom,
  showingTo,
  totalCount,
  q,
}: {
  page: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalCount: number;
  q: string;
}) {
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
  const prevHref = `/dashboard?page=${page - 1}${qParam}`;
  const nextHref = `/dashboard?page=${page + 1}${qParam}`;

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

function ReagentsTable({ reagents }: { reagents: any[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-900 text-left">
          <tr className="border-b border-gray-800">
            <Th>Nombre</Th>
            {/* <Th>Sinónimos</Th>  <-- oculto */}
            <Th>CAS</Th>
            <Th>Localización</Th>
            <Th>Sublocización</Th>
            <Th>Nick/ID</Th>
            <Th>Recipiente</Th>
            <Th>Vendedor</Th>
            <Th>Cant.</Th>
            <Th>Unit</Th>
            {/* <Th>Umbral</Th> <-- oculto */}
            <Th>En uso</Th>
            <Th>Últ. mod.</Th>
          </tr>
        </thead>
        <tbody>
          {reagents.map((r) => {
            const qty = Number(r.quantity) || 0;
            const min = Number(r.min_stock ?? 0);

            let rowClass = "border-b border-gray-800 transition-colors duration-150";
            if (qty === 0) {
              rowClass += " bg-red-950/60 text-red-200 hover:bg-red-900/50";
            } else if (qty <= min) {
              rowClass += " bg-yellow-950/40 text-yellow-200 hover:bg-yellow-900/40";
            } else {
              rowClass += " bg-green-950/40 text-green-200 hover:bg-green-900/40";
            }

            return (
              <tr key={r.id} className={rowClass}>
                <Td>
                  <InvLink href={`/reagents/${r.id}`} className="underline">
                    {r.name}
                  </InvLink>
                </Td>
                {/* <Td>{r.synonyms ?? "—"}</Td>  <-- oculto */}
                <Td>{r.cas ?? "—"}</Td>
                <Td>{r.location ?? "—"}</Td>
                <Td>{r.sublocation ?? "—"}</Td>
                <Td>{r.code ?? "—"}</Td>
                <Td>{r.type ?? "—"}</Td>
                <Td>{r.vendor ?? "—"}</Td>
                <Td>{String(r.quantity)}</Td>
                <Td>{r.unit}</Td>
                {/* <Td>{String(r.min_stock ?? 0)}</Td> <-- oculto */}
                <Td>{r.in_use ? "SÍ" : "NO"}</Td>
                <Td>{new Date(r.updated_at).toLocaleString("es-AR")}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}
