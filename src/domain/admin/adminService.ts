import { getSupabase } from '@/lib/supabase';

// Supabase Auth sign-in is designed to run on the client — it returns a short-lived JWT.
// That JWT is forwarded to Vercel Functions for server-side identity verification.
export async function adminSignIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : {};
}

export async function getAdminToken(): Promise<string | null> {
  const { data: { session } } = await getSupabase().auth.getSession();
  return session?.access_token ?? null;
}

export async function adminSignOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function startSeason(
  name: string,
  token: string,
): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ action: 'start', name }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error };
}

export async function endSeason(token: string): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ action: 'end' }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error };
}

export async function fetchTopPlayers(
  token: string,
  limit = 10,
): Promise<{ username: string; totalScore: number }[]> {
  const res = await fetch(`/api/admin/stats?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = await res.json() as { players: { username: string; totalScore: number }[] };
  return json.players ?? [];
}
