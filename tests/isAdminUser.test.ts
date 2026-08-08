import { describe, expect, it } from 'vitest';
import {
  bearerFromHeaders,
  canonicalAdminId,
  isAdminUser,
  normalizeAdminEmail,
  resolveAdminAuthEmail,
} from '@/domain/admin/adminIdentity';

describe('isAdminUser', () => {
  it('accepts matching ADMIN_EMAIL ignoring case and quotes', () => {
    expect(isAdminUser({ email: 'Admin@Juegos.local' }, '"admin@juegos.local"')).toBe(true);
  });

  it('treats login admin as the same identity as the auth email', () => {
    expect(isAdminUser({ email: 'admin@juegos.local' }, 'admin')).toBe(true);
  });

  it('rejects a different email without admin role', () => {
    expect(isAdminUser({ email: 'nina@example.com' }, 'admin')).toBe(false);
  });

  it('accepts app_metadata.role admin even if email differs', () => {
    expect(
      isAdminUser({ email: 'nina@example.com', app_metadata: { role: 'admin' } }, 'admin'),
    ).toBe(true);
  });

  it('rejects null user', () => {
    expect(isAdminUser(null, 'admin')).toBe(false);
  });
});

describe('resolveAdminAuthEmail', () => {
  it('maps admin to the Auth email', () => {
    expect(resolveAdminAuthEmail('admin')).toBe('admin@juegos.local');
  });
});

describe('canonicalAdminId', () => {
  it('collapses admin aliases', () => {
    expect(canonicalAdminId('admin@juegos.local')).toBe('admin');
  });
});

describe('normalizeAdminEmail', () => {
  it('trims quotes and lowercases', () => {
    expect(normalizeAdminEmail(' "Foo@Bar.com" ')).toBe('foo@bar.com');
  });
});

describe('bearerFromHeaders', () => {
  it('reads lowercase authorization', () => {
    expect(bearerFromHeaders({ authorization: 'Bearer abc' })).toBe('Bearer abc');
  });

  it('falls back to x-admin-authorization', () => {
    expect(bearerFromHeaders({ 'x-admin-authorization': 'Bearer xyz' })).toBe('Bearer xyz');
  });
});
