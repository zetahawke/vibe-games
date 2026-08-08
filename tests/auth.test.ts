import { beforeEach, describe, expect, it } from 'vitest';
import { register, login, listUsers, getSession, logout, ensureLocalAccount, getLocalPasswordHash } from '@/domain/auth/auth';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  logout();
});

describe('auth', () => {
  it('registers and lists user', async () => {
    const r = await register('miguel', 'clave123');
    expect(r.ok).toBe(true);
    expect(listUsers()).toContain('miguel');
  });

  it('rejects duplicate username', async () => {
    await register('miguel', 'clave123');
    const r = await register('miguel', 'otra');
    expect(r.ok).toBe(false);
  });

  it('logs in with correct password', async () => {
    await register('miguel', 'clave123');
    const r = await login('miguel', 'clave123');
    expect(r.ok).toBe(true);
    expect(getSession()).toBe('miguel');
  });

  it('exposes the local password hash for online recover', async () => {
    await register('hija', 'clave123');
    expect(getLocalPasswordHash('hija')).toHaveLength(64);
  });

  it('recreates a wiped local account with the same password', async () => {
    await register('papa', 'clave123');
    localStorage.clear();
    const ensured = await ensureLocalAccount('papa', 'clave123');
    expect(ensured.ok).toBe(true);
    const r = await login('papa', 'clave123');
    expect(r.ok).toBe(true);
  });

  it('rejects wrong password', async () => {
    await register('miguel', 'clave123');
    const r = await login('miguel', 'nope');
    expect(r.ok).toBe(false);
    expect(getSession()).toBeNull();
  });
});
