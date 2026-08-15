import { loadProfile, profileFromApi, saveProfile } from '@/domain/profile/profile';

const KEY_ID    = 'game_player_id';
const KEY_TOKEN = 'game_session_token';
const KEY_NAME  = 'game_username';
const KEY_PIN   = 'game_player_pin';

/** Per-tab so papa and hija can play from two windows on the same browser. */
const store = () => sessionStorage;

export interface PlayerIdentity {
  playerId: string;
  sessionToken: string;
  username: string;
}

export function getStoredPin(): string | null {
  return store().getItem(KEY_PIN);
}

export function getStoredSessionToken(): string | null {
  return store().getItem(KEY_TOKEN);
}

export function rememberPin(pin: string): void {
  store().setItem(KEY_PIN, pin);
}

export function clearOnlineIdentity(): void {
  clearStored();
}

/**
 * Resolves identity from localStorage, or registers/recovers via the API.
 * Pass `pin` (password hash) after login so a wiped browser can reclaim the DB row.
 */
export async function resolveIdentity(
  username: string,
  pin?: string,
): Promise<PlayerIdentity | { error: string }> {
  if (store().getItem(KEY_NAME) && store().getItem(KEY_NAME) !== username) {
    clearStored();
  }

  const storedId    = store().getItem(KEY_ID);
  const storedToken = store().getItem(KEY_TOKEN);
  const storedPin   = pin ?? store().getItem(KEY_PIN);

  if (storedId && storedToken && store().getItem(KEY_NAME) === username) {
    const res = await fetch('/api/players/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, sessionToken: storedToken }),
    });
    if (res.ok) {
      return { playerId: storedId, sessionToken: storedToken, username };
    }
    if (storedPin) {
      const recovered = await recoverWithPin(username, storedPin);
      if (!('error' in recovered)) return recovered;
    }
    clearStored();
    if (storedPin) store().setItem(KEY_PIN, storedPin);
  }

  if (!storedPin) {
    return { error: 'Iniciá sesión de nuevo para jugar en línea.' };
  }

  // Wipe / new device: reclaim existing row before inserting.
  try {
    const recovered = await recoverWithPin(username, storedPin);
    if (!('error' in recovered)) return recovered;

    const res = await fetch('/api/players/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin: storedPin }),
    });
    const json = await res.json() as ProfileApi & { playerId?: string; sessionToken?: string; error?: string };

    if (res.status === 409) {
      return { error: 'Ese nombre ya existe. Usá la misma contraseña que antes.' };
    }
    if (!res.ok) return { error: json.error ?? 'Error de registro.' };

    saveStored(json.playerId!, json.sessionToken!, username, storedPin);
    maybeSaveRemoteProfile(username, json);
    return { playerId: json.playerId!, sessionToken: json.sessionToken!, username };
  } catch {
    return { error: 'No se pudo conectar. Reintentá en un momento.' };
  }

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
  const json = await res.json() as ProfileApi & { playerId?: string; sessionToken?: string; error?: string };
  if (!res.ok) return { error: json.error ?? 'PIN incorrecto.' };
  saveStored(json.playerId!, json.sessionToken!, username, pin);
  maybeSaveRemoteProfile(username, json);
  return { playerId: json.playerId!, sessionToken: json.sessionToken!, username };
}

type ProfileApi = {
  grade?: string;
  avatar_sex?: string;
  avatar_color?: string;
  display_name?: string;
  avatar_hat?: string;
  avatar_shirt?: string;
  avatar_pants?: string;
  avatar_hair?: string;
  gems?: number;
  cosmetic_inventory?: {
    hats?: unknown;
    shirts?: unknown;
    pants?: unknown;
    hairs?: unknown;
  };
  ownedHats?: unknown;
  ownedShirts?: unknown;
  ownedPants?: unknown;
  ownedHairs?: unknown;
};

function maybeSaveRemoteProfile(username: string, json: ProfileApi): void {
  if (loadProfile(username) || !json.grade) return;
  saveProfile(username, profileFromApi(json, username));
}

function saveStored(playerId: string, sessionToken: string, username: string, pin: string): void {
  store().setItem(KEY_ID,    playerId);
  store().setItem(KEY_TOKEN, sessionToken);
  store().setItem(KEY_NAME,  username);
  store().setItem(KEY_PIN,   pin);
}

function clearStored(): void {
  store().removeItem(KEY_ID);
  store().removeItem(KEY_TOKEN);
  store().removeItem(KEY_NAME);
  store().removeItem(KEY_PIN);
}
