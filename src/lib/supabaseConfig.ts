export function realtimeEndpoint(supabaseUrl: string): string {
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base.replace(/^http/i, 'ws')}/realtime/v1`;
}

/** Anon Realtime only — no accessToken callback (that opens a second `?token=` socket). */
export function realtimeClientOptions(anonKey: string) {
  return {
    params: { apikey: anonKey },
    disconnectOnEmptyChannelsAfterMs: 300_000,
  };
}
