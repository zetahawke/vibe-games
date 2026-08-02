import { beforeEach, describe, expect, it } from 'vitest';
import { register, login, listUsers, getSession, logout } from '../src/auth/auth';

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

  it('rejects wrong password', async () => {
    await register('miguel', 'clave123');
    const r = await login('miguel', 'nope');
    expect(r.ok).toBe(false);
    expect(getSession()).toBeNull();
  });
});
