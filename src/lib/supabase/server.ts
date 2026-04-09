import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

export function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function createAdminSupabaseClient() {
  const { supabaseUrl } = getPublicEnv();
  const { supabaseServiceRoleKey } = getServerEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
