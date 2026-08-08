import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

export function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        `Missing env: SUPABASE_URL=${url ? 'ok' : 'MISSING'}, ` +
        `SUPABASE_SERVICE_ROLE_KEY=${key ? 'ok' : 'MISSING'}`,
      );
    }
    _admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
