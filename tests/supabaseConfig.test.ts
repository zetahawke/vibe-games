import { describe, expect, it } from 'vitest';
import { realtimeClientOptions, realtimeEndpoint } from '@/lib/supabaseConfig';

describe('realtime socket config', () => {
  it('builds the v1 websocket URL without an auth accessToken callback', () => {
    expect(realtimeEndpoint('https://abc.supabase.co')).toBe('wss://abc.supabase.co/realtime/v1');
    const opts = realtimeClientOptions('anon-key-test');
    expect(opts.params.apikey).toBe('anon-key-test');
    expect(opts).not.toHaveProperty('accessToken');
  });
});
