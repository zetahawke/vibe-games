import { createBoxingModel } from '@/assets/boxing';
import { WeaponId, getWeapon } from '@/domain/weapons/weapons';

/** Distinct blocky models for each weapon (Roblox-like). */
export function createWeaponModel(id: WeaponId) {
  return createBoxingModel({ type: 'boxes', id });
}

/** Simple SVG icon for shop/inventory. */
export function weaponIconSvg(id: WeaponId): string {
  const kind = getWeapon(id).kind;
  const accent = id.includes('_upgraded') ? '#c9a227' : null;
  if (kind === 'knife') {
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="34" width="8" height="22" rx="2" fill="#6b3a1f"/><polygon points="32,6 38,34 26,34" fill="#cfd6e0"/></svg>`;
  }
  if (kind === 'kunai') {
    const blade = accent ?? '#cfd6e0';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="36" width="8" height="20" rx="2" fill="#3a3a3a"/><polygon points="32,4 40,36 24,36" fill="${blade}"/><rect x="22" y="32" width="20" height="5" fill="#222"/></svg>`;
  }
  if (kind === 'sword_shield') {
    const blade = accent ?? '#cfd6e0';
    const shield = accent ?? '#4a5a8a';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="28" width="6" height="28" rx="1" fill="#6b3a1f"/><rect x="10" y="26" width="14" height="5" fill="#888"/><rect x="12" y="6" width="10" height="22" fill="${blade}"/><rect x="34" y="18" width="22" height="28" rx="4" fill="${shield}"/><circle cx="45" cy="32" r="4" fill="#c9a227"/></svg>`;
  }
  if (kind === 'longsword') {
    const blade = accent ?? '#b8c0cc';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="36" width="8" height="22" rx="1" fill="#6b3a1f"/><rect x="18" y="32" width="28" height="6" fill="#666"/><rect x="26" y="4" width="12" height="30" fill="${blade}"/></svg>`;
  }
  if (kind === 'pistol') {
    const fill = accent ?? '#2b2b2b';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="24" width="36" height="14" rx="3" fill="${fill}"/><rect x="40" y="28" width="16" height="6" fill="#555"/><rect x="14" y="38" width="12" height="18" rx="2" fill="#1a1a1a"/></svg>`;
  }
  if (kind === 'bow') {
    const fill = accent ?? '#6b3e1f';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M20 8 Q8 32 20 56" fill="none" stroke="${fill}" stroke-width="6"/><line x1="20" y1="10" x2="20" y2="54" stroke="#ddd8c8" stroke-width="2"/><line x1="20" y1="32" x2="48" y2="32" stroke="#c8a050" stroke-width="3"/></svg>`;
  }
  if (kind === 'shuriken') {
    const fill = accent ?? '#1a1a1a';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="28" width="48" height="8" fill="${fill}"/><rect x="28" y="8" width="8" height="48" fill="${fill}"/><circle cx="32" cy="32" r="5" fill="#444"/></svg>`;
  }
  if (kind === 'shotgun') {
    const fill = accent ?? '#3a3a3a';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="28" width="50" height="10" rx="3" fill="${fill}"/><rect x="6" y="36" width="18" height="12" rx="2" fill="#6b3e1f"/><rect x="28" y="34" width="14" height="8" fill="#4a4a4a"/></svg>`;
  }
  const fill = accent ?? '#2f3d2f';
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="26" width="42" height="10" rx="2" fill="${fill}"/><rect x="40" y="28" width="18" height="6" fill="#555"/><rect x="8" y="36" width="14" height="16" rx="2" fill="#4a3020"/><rect x="24" y="36" width="10" height="14" fill="#222"/></svg>`;
}
