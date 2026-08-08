/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/** Isolated Auth client for the ops page — not shared with game Realtime. */
export function getAdminAuth(): SupabaseClient {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: 'jdc-admin-auth',
      },
    });
  }
  return _client;
}
