export type WeaponKind = 'cuchillo' | 'pistola' | 'escopeta' | 'rifle';

export type WeaponId =
  | 'cuchillo'
  | 'pistola'
  | 'pistola_mejorada'
  | 'escopeta'
  | 'escopeta_mejorada'
  | 'rifle'
  | 'rifle_mejorada';

export interface WeaponDef {
  id: WeaponId;
  kind: WeaponKind;
  name: string;
  price: number;
  damage: number;
  cooldownMs: number;
  range: number;
  isMelee: boolean;
}

/** Shop / inventory display order. */
export const WEAPON_IDS: WeaponId[] = [
  'cuchillo',
  'pistola',
  'pistola_mejorada',
  'escopeta',
  'escopeta_mejorada',
  'rifle',
  'rifle_mejorada',
];

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  cuchillo: {
    id: 'cuchillo',
    kind: 'cuchillo',
    name: 'Cuchillo',
    price: 0,
    damage: 10,
    cooldownMs: 500,
    range: 2.5,
    isMelee: true,
  },
  pistola: {
    id: 'pistola',
    kind: 'pistola',
    name: 'Pistola',
    price: 15,
    damage: 30,
    cooldownMs: 350,
    range: 40,
    isMelee: false,
  },
  pistola_mejorada: {
    id: 'pistola_mejorada',
    kind: 'pistola',
    name: 'Pistola mejorada',
    price: 25,
    damage: 55,
    cooldownMs: 320,
    range: 42,
    isMelee: false,
  },
  escopeta: {
    id: 'escopeta',
    kind: 'escopeta',
    name: 'Escopeta',
    price: 40,
    damage: 150,
    cooldownMs: 900,
    range: 20,
    isMelee: false,
  },
  escopeta_mejorada: {
    id: 'escopeta_mejorada',
    kind: 'escopeta',
    name: 'Escopeta mejorada',
    price: 60,
    damage: 260,
    cooldownMs: 850,
    range: 22,
    isMelee: false,
  },
  rifle: {
    id: 'rifle',
    kind: 'rifle',
    name: 'Rifle',
    price: 55,
    damage: 60,
    cooldownMs: 180,
    range: 50,
    isMelee: false,
  },
  rifle_mejorada: {
    id: 'rifle_mejorada',
    kind: 'rifle',
    name: 'Rifle mejorado',
    price: 80,
    damage: 110,
    cooldownMs: 160,
    range: 55,
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
    return Math.round(
      WEAPONS.cuchillo.damage * 2 + t * (WEAPONS.escopeta.damage - WEAPONS.cuchillo.damage * 2),
    );
  }
  const pistolHits = 5 + (w - 5);
  return Math.round(WEAPONS.pistola.damage * pistolHits);
}
