export const MAX_SESSIONS = 6;

export async function createSession(
  playerId: string,
  sessionToken: string,
): Promise<{ sessionId: string; code: string } | { error: string }> {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, sessionToken }),
  });
  const json = await res.json() as { sessionId?: string; code?: string; error?: string };
  if (!res.ok) return { error: json.error ?? 'Error creando sala.' };
  return { sessionId: json.sessionId!, code: json.code! };
}

export async function joinSession(
  code: string,
  playerId: string,
  sessionToken: string,
): Promise<{ sessionId: string; playerCount: number; code: string } | { error: string }> {
  const normalized = String(code).replace(/\D/g, '').padStart(4, '0').slice(-4);
  const res = await fetch('/api/session/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: normalized, playerId, sessionToken }),
  });
  const json = await res.json() as { sessionId?: string; playerCount?: number; code?: string; error?: string };
  if (!res.ok) return { error: json.error ?? 'Sala no encontrada.' };
  return {
    sessionId: json.sessionId!,
    playerCount: json.playerCount!,
    code: (json.code ?? normalized).replace(/\D/g, '').padStart(4, '0').slice(-4),
  };
}

export async function closeSession(
  sessionId: string,
  playerId: string,
  sessionToken: string,
): Promise<void> {
  await fetch('/api/session/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, playerId, sessionToken }),
    keepalive: true,
  });
}

export async function leaveSession(
  sessionId: string,
  playerId: string,
  sessionToken: string,
): Promise<void> {
  await fetch('/api/session/leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, playerId, sessionToken }),
    keepalive: true,
  });
}
