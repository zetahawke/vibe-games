export type WeaponId = 'cuchillo' | 'pistola' | 'escopeta' | 'rifle';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  price: number;
  damage: number;
  cooldownMs: number;
  range: number;
  isMelee: boolean;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  cuchillo: {
    id: 'cuchillo',
    name: 'Cuchillo',
    price: 0,
    damage: 10,
    cooldownMs: 500,
    range: 2.5,
    isMelee: true,
  },
  pistola: {
    id: 'pistola',
    name: 'Pistola',
    price: 15,
    damage: 30,
    cooldownMs: 350,
    range: 40,
    isMelee: false,
  },
  escopeta: {
    id: 'escopeta',
    name: 'Escopeta',
    price: 40,
    damage: 150,
    cooldownMs: 900,
    range: 20,
    isMelee: false,
  },
  rifle: {
    id: 'rifle',
    name: 'Rifle',
    price: 70,
    damage: 60,
    cooldownMs: 180,
    range: 50,
    isMelee: false,
  },
};

export function getWeapon(id: WeaponId): WeaponDef {
  return WEAPONS[id];
}

/** HP curve: wave 1 = 2 knife hits; wave 5 = 5 pistol / 1 shotgun. */
export function zombieHpForWave(wave: number): number {
  const w = Math.max(1, Math.floor(wave));
  if (w <= 5) {
    const t = (w - 1) / 4;
    return Math.round(WEAPONS.cuchillo.damage * 2 + t * (WEAPONS.escopeta.damage - WEAPONS.cuchillo.damage * 2));
  }
  const pistolHits = 5 + (w - 5);
  return Math.round(WEAPONS.pistola.damage * pistolHits);
}
