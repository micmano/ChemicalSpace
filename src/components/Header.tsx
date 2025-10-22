// components/Header.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { signout } from "@/app/login/actions"
import HoverSelect from "@/components/HoverSelect"
import InvLink from "@/components/InvLink"

export default async function Header() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  // nombre a mostrar
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null as any }

  const displayName =
    profile?.full_name ||
    (user?.user_metadata as any)?.full_name ||
    user?.email || null

  // inventarios accesibles (de-duplicar y excluir 'general' de la lista dinámica)
  const { data: invsRaw } = await supabase.rpc("my_inventories")
  const uniqueBySlug = (arr: any[] = []) =>
    Array.from(new Map(arr.map((i) => [i.slug, i])).values())
  const invs = uniqueBySlug(invsRaw || []).filter((i: any) => i.slug !== "general")

  const opcionesInventario = [
    { label: "General", value: "general", color: "#E5E7EB", href: "/dashboard?inv=general" },
    ...invs.map((i: any) => ({
      label: i.name,
      value: i.slug,
      color: i.is_private ? "#A78BFA" : "#E5E7EB",
      href: `/dashboard?inv=${i.slug}`,
    })),
    { label: "➕ Crear inventario…", value: "create", color: "#60A5FA", href: "/inventories/new" },
    { label: "🔑 Unirse por código…", value: "join",   color: "#34D399", href: "/inventories/join" },
  ]

  return (
    <>
      <header className="w-full sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          {/* izquierda: usa InvLink para mantener ?inv= */}
          <nav className="flex items-center gap-2">
            <InvLink href="/dashboard"     className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800">Inicio</InvLink>
            <InvLink href="/inventories"   className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800">Mis Inventarios</InvLink>
            <InvLink href="/reagents/new"  className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800">Nuevo Reactivo</InvLink>
            <InvLink href="/movements"     className="px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-800">Movimientos</InvLink>
          </nav>

          {/* derecha */}
          <div className="ml-auto flex items-center gap-2">
            {/* Renombrado del selector */}
            <HoverSelect label="Inventarios" options={opcionesInventario} align="right" theme="dark" />

            {!user ? (
              <>
                <Link href="/login"  className="px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800">Login</Link>
                <Link href="/signup" className="px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800">Sign Up</Link>
              </>
            ) : (
              <>
                <form action={signout}>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800"
                  >
                    Salir
                  </button>
                </form>

                {/* Pill del usuario: tenue pero con leve realce al hover */}
                <span
                  className="select-none rounded-full border border-gray-700/60 bg-gradient-to-r from-white/5 to-transparent px-4 py-2 text-xs text-gray-400
                             shadow-sm hover:text-gray-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition"
                  title={String(displayName ?? '')}
                >
                  Hola! {displayName}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Botón flotante de Contact: fijo en la esquina inferior derecha */}
      <Link
        href="/contact"
        className="fixed bottom-6 right-6 z-50 group rounded-full border border-gray-800 bg-neutral-900/90 backdrop-blur px-4 py-2
                   text-sm text-gray-200 shadow-lg hover:bg-neutral-800 hover:shadow-xl transition"
        aria-label="Contactar"
      >
        <span className="opacity-90 group-hover:opacity-100 transition">Contact</span>
      </Link>
    </>
  )
}
