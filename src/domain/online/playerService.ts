const STORAGE_KEY_ID    = 'game_player_id';
const STORAGE_KEY_TOKEN = 'game_session_token';
const STORAGE_KEY_NAME  = 'game_username';

export interface PlayerIdentity {
  playerId: string;
  sessionToken: string;
  username: string;
}

// Resolves identity from localStorage or registers a new player.
// Called before any create/join session action.
export async function resolveIdentity(
  username: string,
): Promise<PlayerIdentity | { error: string }> {
  const storedId    = localStorage.getItem(STORAGE_KEY_ID);
  const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const storedName  = localStorage.getItem(STORAGE_KEY_NAME);

  // If we have a cached identity for this exact username, verify it is still valid.
  if (storedId && storedToken && storedName === username) {
    const verifyRes = await fetch('/api/players/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, sessionToken: storedToken }),
    });
    if (verifyRes.ok) {
      return { playerId: storedId, sessionToken: storedToken, username };
    }
    // Token revoked or username changed — clear cache and re-register.
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_NAME);
  }

  // Register as a new player.
  const registerRes = await fetch('/api/players/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const json = await registerRes.json() as { playerId?: string; sessionToken?: string; error?: string };
  if (!registerRes.ok) return { error: json.error ?? 'Error de registro.' };

  localStorage.setItem(STORAGE_KEY_ID,    json.playerId!);
  localStorage.setItem(STORAGE_KEY_TOKEN, json.sessionToken!);
  localStorage.setItem(STORAGE_KEY_NAME,  username);
  return { playerId: json.playerId!, sessionToken: json.sessionToken!, username };
}
