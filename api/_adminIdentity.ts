export const ADMIN_LOGIN = 'admin';
export const ADMIN_AUTH_EMAIL = 'admin@juegos.local';

export type AdminIdentity = {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

export function normalizeAdminEmail(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '').toLowerCase();
}

export function canonicalAdminId(value: string | undefined): string {
  const n = normalizeAdminEmail(value);
  if (n === ADMIN_LOGIN || n === ADMIN_AUTH_EMAIL) return ADMIN_LOGIN;
  return n;
}

export function isAdminUser(user: AdminIdentity | null | undefined, adminEmail: string | undefined): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  const expected = canonicalAdminId(adminEmail);
  const actual = canonicalAdminId(user.email ?? undefined);
  return expected.length > 0 && actual === expected;
}

export function bearerFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const raw =
    headers['authorization'] ??
    headers['Authorization'] ??
    headers['x-admin-authorization'] ??
    headers['X-Admin-Authorization'];
  return Array.isArray(raw) ? raw[0] : raw;
}
