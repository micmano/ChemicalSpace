// app/inventories/join/actions.ts
'use server';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function joinInventory(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const code = String(formData.get('code') ?? '').trim();

  const { data, error } = await supabase.rpc('join_inventory', {
    p_code: code
  });

  if (error) {
    console.error("joinInventory error", error);
    return { error: error.message };
  }

  const inv = data as any;
  const finalSlug = inv?.slug ?? 'general';
  redirect(`/dashboard?inv=${finalSlug}`);
}
