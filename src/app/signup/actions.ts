// app/signup/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signupWithProfile(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nick = String(formData.get("nick") ?? "");

  // 1) crear usuario y guardar el nick en metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: nick } }, // metadata en auth.users
  });

  if (error) return { error: error.message };

  // 2) intentar upsert en 'profiles' (si existe)
  const userId = data.user?.id;
  if (userId) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: nick }); // requiere RLS que permita insert para auth.uid()=id

    // si falla por políticas RLS o no existe la tabla, lo ignoramos:
    if (profileErr) {
      // opcional: loguear en consola del server
      // console.error(profileErr.message);
    }
  }

  redirect("/dashboard");
}
