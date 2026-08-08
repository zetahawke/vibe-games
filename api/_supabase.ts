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
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

// Proxy so existing `supabaseAdmin.from(...)` calls still work without changes.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const admin = getAdmin();
    const val = (admin as Record<string, unknown>)[prop as string];
    return typeof val === 'function' ? (val as Function).bind(admin) : val;
  },
});
