import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY function secrets"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
