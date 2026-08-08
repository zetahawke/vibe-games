/// <reference types="vite/client" />
import { RealtimeClient } from '@supabase/supabase-js';
import { realtimeClientOptions, realtimeEndpoint } from '@/lib/supabaseConfig';

let _realtime: RealtimeClient | null = null;

/** Shared Phoenix socket for co-op. Not createClient — Auth would reconnect it. */
export function getRealtime(): RealtimeClient {
  if (!_realtime) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _realtime = new RealtimeClient(realtimeEndpoint(url), realtimeClientOptions(key));
  }
  return _realtime;
}
