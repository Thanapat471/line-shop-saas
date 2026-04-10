"use server";

import { redirect } from "next/navigation";
import { createAuthSupabaseClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createAuthSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect("/dashboard/orders");
}

export async function logout() {
  const supabase = await createAuthSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
