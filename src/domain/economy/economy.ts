import type { EnemyType } from '@/domain/waves/enemyConfig';
import { getWeapon, WeaponId } from '@/domain/weapons/weapons';

const ENEMY_COIN_TIER: Record<EnemyType, number> = {
  zombie: 1,
  big_zombie: 2,
  monster: 3,
  yeti: 4,
};

export function coinsForKill(wave: number, type: EnemyType): number {
  const w = Math.max(1, Math.floor(wave));
  return w + (ENEMY_COIN_TIER[type] ?? 1);
}

export function canAfford(coins: number, weaponId: WeaponId): boolean {
  return coins >= getWeapon(weaponId).price;
}

export function addCoins(coins: number, amount: number): number {
  return Math.max(0, coins + amount);
}

export function buyWeapon(
  coins: number,
  owned: WeaponId[],
  weaponId: WeaponId,
): { ok: true; coins: number; owned: WeaponId[] } | { ok: false; error: string } {
  if (owned.includes(weaponId)) {
    return { ok: false, error: 'Ya tienes esa arma' };
  }
  const price = getWeapon(weaponId).price;
  if (coins < price) {
    return { ok: false, error: 'No te alcanzan las monedas' };
  }
  return {
    ok: true,
    coins: coins - price,
    owned: [...owned, weaponId],
  };
}
