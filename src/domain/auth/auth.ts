import { STORAGE_PREFIX } from '@/config/gameConfig';
import { clearOnlineIdentity } from '@/domain/online/playerService';

const ACCOUNTS_KEY = `${STORAGE_PREFIX}accounts`;
const SESSION_KEY = `${STORAGE_PREFIX}session`;

interface AccountsFile {
  users: Record<string, { passwordHash: string }>;
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function readAccounts(): AccountsFile {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return { users: {} };
  try {
    return JSON.parse(raw) as AccountsFile;
  } catch {
    return { users: {} };
  }
}

function writeAccounts(data: AccountsFile): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data));
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function listUsers(): string[] {
  return Object.keys(readAccounts().users);
}

export function getSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
  clearOnlineIdentity();
}

export function getLocalPasswordHash(username: string): string | null {
  const name = normalizeUsername(username);
  return readAccounts().users[name]?.passwordHash ?? null;
}

/** Recreate a wiped local account after online recover. */
export async function ensureLocalAccount(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = normalizeUsername(username);
  if (!name) return { ok: false, error: 'Escribe un nombre' };
  if (!password) return { ok: false, error: 'Escribe una contraseña' };
  const accounts = readAccounts();
  const passwordHash = await hashPassword(password);
  const existing = accounts.users[name];
  if (existing && existing.passwordHash !== passwordHash) {
    return { ok: false, error: 'Ese nombre ya existe' };
  }
  accounts.users[name] = { passwordHash };
  writeAccounts(accounts);
  return { ok: true };
}

export async function register(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = normalizeUsername(username);
  if (!name) return { ok: false, error: 'Escribe un nombre' };
  if (!password) return { ok: false, error: 'Escribe una contraseña' };

  const accounts = readAccounts();
  if (accounts.users[name]) {
    return { ok: false, error: 'Ese nombre ya existe' };
  }

  accounts.users[name] = { passwordHash: await hashPassword(password) };
  writeAccounts(accounts);
  return { ok: true };
}

export async function login(
  username: string,
  password: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const name = normalizeUsername(username);
  if (!name) return { ok: false, error: 'Escribe un nombre' };
  if (!password) return { ok: false, error: 'Escribe una contraseña' };

  const accounts = readAccounts();
  const user = accounts.users[name];
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    return { ok: false, error: 'Usuario o contraseña incorrectos' };
  }

  sessionStorage.setItem(SESSION_KEY, name);
  return { ok: true, username: name };
}
