import { resolveAdminAuthEmail } from '@/domain/admin/adminIdentity';
import { getAdminAuth } from '@/lib/supabaseAdmin';

export async function adminSignIn(
  login: string,
  password: string,
): Promise<{ token?: string; error?: string }> {
  const email = resolveAdminAuthEmail(login);
  const { data, error } = await getAdminAuth().auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const token = data.session?.access_token;
  if (!token) return { error: 'Error obteniendo sesión.' };
  return { token };
}

export async function adminSignOut(): Promise<void> {
  await getAdminAuth().auth.signOut();
}

function adminHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'x-admin-authorization': `Bearer ${token}`,
  };
}

export async function startSeason(
  name: string,
  token: string,
): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
    body: JSON.stringify({ action: 'start', name }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error ?? 'No autorizado.' };
}

export async function endSeason(token: string): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
    body: JSON.stringify({ action: 'end' }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error ?? 'No autorizado.' };
}

export async function fetchTopPlayers(
  token: string,
  limit = 10,
): Promise<{ players: { username: string; totalScore: number }[]; error?: string }> {
  const res = await fetch(`/api/admin/stats?limit=${limit}`, {
    headers: adminHeaders(token),
  });
  const json = await res.json() as {
    players?: { username: string; totalScore: number }[];
    error?: string;
  };
  if (!res.ok) return { players: [], error: json.error ?? 'No autorizado.' };
  return { players: json.players ?? [] };
}
