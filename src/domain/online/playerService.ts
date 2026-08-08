const KEY_ID    = 'game_player_id';
const KEY_TOKEN = 'game_session_token';
const KEY_NAME  = 'game_username';
const KEY_PIN   = 'game_player_pin'; // PIN stored locally for auto-recovery

export interface PlayerIdentity {
  playerId: string;
  sessionToken: string;
  username: string;
}

/**
 * Resolves identity from localStorage, or registers/recovers via the API.
 * Pass `pin` only on first registration. On subsequent calls the PIN is read
 * from localStorage so the caller doesn't need to prompt again.
 */
export async function resolveIdentity(
  username: string,
  pin?: string,
): Promise<PlayerIdentity | { error: string }> {
  const storedId    = localStorage.getItem(KEY_ID);
  const storedToken = localStorage.getItem(KEY_TOKEN);
  const storedName  = localStorage.getItem(KEY_NAME);
  const storedPin   = localStorage.getItem(KEY_PIN);

  // Cached identity for this username — verify it's still valid.
  if (storedId && storedToken && storedName === username) {
    const res = await fetch('/api/players/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, sessionToken: storedToken }),
    });
    if (res.ok) {
      return { playerId: storedId, sessionToken: storedToken, username };
    }
    // Token expired — try PIN recovery if we have one stored.
    const recoveryPin = pin ?? storedPin;
    if (recoveryPin) {
      const recovered = await recoverWithPin(username, recoveryPin);
      if (!('error' in recovered)) return recovered;
    }
    clearStored();
  }

  // Username taken — try recovering with PIN.
  if (!pin && storedPin) {
    const recovered = await recoverWithPin(username, storedPin);
    if (!('error' in recovered)) return recovered;
  }

  // No PIN available — can't register on this call.
  if (!pin) {
    return { error: 'Necesitás estar conectado al iniciar sesión para jugar en línea.' };
  }

  // Register new player.
  const res = await fetch('/api/players/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin }),
  });
  const json = await res.json() as { playerId?: string; sessionToken?: string; error?: string };

  if (res.status === 409) {
    // Username taken — try recovering with the PIN provided.
    const recovered = await recoverWithPin(username, pin);
    if (!('error' in recovered)) return recovered;
    return { error: 'Ese nombre ya existe. Verificá tu PIN.' };
  }

  if (!res.ok) return { error: json.error ?? 'Error de registro.' };

  saveStored(json.playerId!, json.sessionToken!, username, pin);
  return { playerId: json.playerId!, sessionToken: json.sessionToken!, username };
}

async function recoverWithPin(
  username: string,
  pin: string,
): Promise<PlayerIdentity | { error: string }> {
  const res = await fetch('/api/players/recover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin }),
  });
  const json = await res.json() as { playerId?: string; sessionToken?: string; error?: string };
  if (!res.ok) return { error: json.error ?? 'PIN incorrecto.' };
  saveStored(json.playerId!, json.sessionToken!, username, pin);
  return { playerId: json.playerId!, sessionToken: json.sessionToken!, username };
}

function saveStored(playerId: string, sessionToken: string, username: string, pin: string): void {
  localStorage.setItem(KEY_ID,    playerId);
  localStorage.setItem(KEY_TOKEN, sessionToken);
  localStorage.setItem(KEY_NAME,  username);
  localStorage.setItem(KEY_PIN,   pin);
}

function clearStored(): void {
  localStorage.removeItem(KEY_ID);
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_NAME);
}
