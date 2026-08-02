import { getWeapon, WeaponId } from '../weapons/weapons';

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
