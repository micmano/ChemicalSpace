// lib/inventory.ts
import { createClient } from "@/utils/supabase/server";

/**
 * Intenta resolver el ID del inventario por:
 * 1) RPC my_inventories()  (SECURITY DEFINER, ideal)
 * 2) SELECT directo a inventories (funciona con GRANT + policy admin)
 */
export async function getInventoryIdFromSlug(slug?: string | null) {
  const supabase = await createClient();
  const s = (slug && String(slug).trim()) || "general";

  // 1) RPC (la forma recomendada)
  const { data: list, error: rpcErr } = await supabase.rpc("my_inventories");
  if (!rpcErr && Array.isArray(list)) {
    const hit = (list as any[]).find((i) => i.slug === s);
    if (hit?.id) return hit.id as string;
  }

  // 2) Fallback: SELECT directo (requiere GRANT + policy admin)
  const { data: direct, error: selErr } = await supabase
    .from("inventories")
    .select("id, slug, is_private, owner_user_id")
    .eq("slug", s)
    .single();

  if (direct?.id) return direct.id as string;

  // Como último recurso, devolvemos null (dejará la página en estado "sin acceso")
  return null;
}

export async function requireInventoryId(slug?: string | null) {
  const id = await getInventoryIdFromSlug(slug);
  if (!id) {
    throw new Error(
      `Inventario no accesible o inexistente para slug "${slug || "general"}"`
    );
  }
  return id;
}

export async function getActiveInventory(slug?: string | null) {
  const s = (slug && String(slug).trim()) || "general";
  const id = await getInventoryIdFromSlug(s);
  return { slug: s, id };
}
