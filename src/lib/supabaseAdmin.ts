// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// IMPORTANT: this file is ONLY imported on the server.
// Do NOT import it in client components.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});
