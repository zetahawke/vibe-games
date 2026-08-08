import { resolveAdminAuthEmail } from '@/domain/admin/adminIdentity';
import { getAdminAuth } from '@/lib/supabaseAdmin';
import type { ChileGrade } from '@/domain/profile/profile';

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

export interface AdminStatPlayer {
  username: string;
  totalScore: number;
  matches: number;
  bestScore: number;
}

export interface AdminSeasonInfo {
  id: string;
  name: string;
  isActive: boolean;
  startedAt: string;
}

export async function fetchAdminStats(
  token: string,
  limit = 10,
): Promise<{
  players: AdminStatPlayer[];
  season: AdminSeasonInfo | null;
  error?: string;
}> {
  const res = await fetch(`/api/admin/stats?limit=${limit}`, {
    headers: adminHeaders(token),
  });
  const json = await res.json() as {
    players?: AdminStatPlayer[];
    season?: AdminSeasonInfo | null;
    error?: string;
  };
  if (!res.ok) return { players: [], season: null, error: json.error ?? 'No autorizado.' };
  return { players: json.players ?? [], season: json.season ?? null };
}

/** @deprecated use fetchAdminStats */
export async function fetchTopPlayers(
  token: string,
  limit = 10,
): Promise<{ players: { username: string; totalScore: number }[]; error?: string }> {
  const r = await fetchAdminStats(token, limit);
  return { players: r.players, error: r.error };
}

export interface AdminPlayerRow {
  id: string;
  username: string;
  grade: ChileGrade;
  sex: string;
  color: string;
  displayName: string;
  createdAt: string;
  lastSeen: string;
}

export async function fetchAdminPlayers(
  token: string,
): Promise<{ players: AdminPlayerRow[]; error?: string }> {
  const res = await fetch('/api/admin/players', { headers: adminHeaders(token) });
  const json = await res.json() as { players?: AdminPlayerRow[]; error?: string };
  if (!res.ok) return { players: [], error: json.error ?? 'No autorizado.' };
  return { players: json.players ?? [] };
}

export async function patchAdminPlayer(
  token: string,
  id: string,
  patch: { grade?: ChileGrade; pin?: string },
): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/players', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
    body: JSON.stringify({ id, ...patch }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error ?? 'No autorizado.' };
}

export async function deleteAdminPlayer(
  token: string,
  id: string,
): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/players', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
    body: JSON.stringify({ id }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error ?? 'No autorizado.' };
}

export interface AdminSessionRow {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  host: string;
  players: string[];
}

export async function fetchAdminSessions(
  token: string,
): Promise<{ sessions: AdminSessionRow[]; error?: string }> {
  const res = await fetch('/api/admin/sessions', { headers: adminHeaders(token) });
  const json = await res.json() as { sessions?: AdminSessionRow[]; error?: string };
  if (!res.ok) return { sessions: [], error: json.error ?? 'No autorizado.' };
  return { sessions: json.sessions ?? [] };
}

export async function closeAdminSession(
  token: string,
  sessionId: string,
): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
    body: JSON.stringify({ sessionId }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error ?? 'No autorizado.' };
}
