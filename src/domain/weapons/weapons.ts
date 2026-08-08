export type WeaponKind = 'knife' | 'pistol' | 'shotgun' | 'rifle';

export type WeaponId =
  | 'knife'
  | 'pistol'
  | 'pistol_upgraded'
  | 'shotgun'
  | 'shotgun_upgraded'
  | 'rifle'
  | 'rifle_upgraded';

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
  'knife',
  'pistol',
  'pistol_upgraded',
  'shotgun',
  'shotgun_upgraded',
  'rifle',
  'rifle_upgraded',
];

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  knife: {
    id: 'knife',
    kind: 'knife',
    name: 'Cuchillo',
    price: 0,
    damage: 10,
    cooldownMs: 500,
    range: 2.5,
    isMelee: true,
  },
  pistol: {
    id: 'pistol',
    kind: 'pistol',
    name: 'Pistola',
    price: 15,
    damage: 30,
    cooldownMs: 350,
    range: 40,
    isMelee: false,
  },
  pistol_upgraded: {
    id: 'pistol_upgraded',
    kind: 'pistol',
    name: 'Pistola mejorada',
    price: 45,
    damage: 55,
    cooldownMs: 320,
    range: 42,
    isMelee: false,
  },
  shotgun: {
    id: 'shotgun',
    kind: 'shotgun',
    name: 'Escopeta',
    price: 40,
    damage: 150,
    cooldownMs: 900,
    range: 20,
    isMelee: false,
  },
  shotgun_upgraded: {
    id: 'shotgun_upgraded',
    kind: 'shotgun',
    name: 'Escopeta mejorada',
    price: 110,
    damage: 260,
    cooldownMs: 850,
    range: 22,
    isMelee: false,
  },
  rifle: {
    id: 'rifle',
    kind: 'rifle',
    name: 'Rifle',
    price: 70,
    damage: 60,
    cooldownMs: 180,
    range: 50,
    isMelee: false,
  },
  rifle_upgraded: {
    id: 'rifle_upgraded',
    kind: 'rifle',
    name: 'Rifle mejorado',
    price: 180,
    damage: 110,
    cooldownMs: 160,
    range: 55,
    isMelee: false,
  },
};

export function getWeapon(id: WeaponId): WeaponDef {
  return WEAPONS[id];
}

const UPGRADE_SFX_ORDER: WeaponId[] = [
  'pistol',
  'pistol_upgraded',
  'shotgun',
  'shotgun_upgraded',
  'rifle',
  'rifle_upgraded',
];

/** Four short jingles recycled across shop weapons. */
export function weaponUpgradeSfxIndex(id: WeaponId): number {
  const i = UPGRADE_SFX_ORDER.indexOf(id);
  return i < 0 ? 0 : i % 4;
}

/** HP curve: wave 1 = 2 knife hits; wave 5 = 5 pistol / 1 shotgun. */
export function zombieHpForWave(wave: number): number {
  const w = Math.max(1, Math.floor(wave));
  if (w <= 5) {
    const t = (w - 1) / 4;
    return Math.round(
      WEAPONS.knife.damage * 2 + t * (WEAPONS.shotgun.damage - WEAPONS.knife.damage * 2),
    );
  }
  const pistolHits = 5 + (w - 5);
  return Math.round(WEAPONS.pistol.damage * pistolHits);
}

/**
 * Migrate old Spanish weapon IDs from localStorage saves to the new English ids.
 * Returns the migrated id, or the original if no migration needed.
 */
export function migrateWeaponId(id: string): WeaponId {
  const map: Record<string, WeaponId> = {
    cuchillo:          'knife',
    pistola:           'pistol',
    pistola_mejorada:  'pistol_upgraded',
    escopeta:          'shotgun',
    escopeta_mejorada: 'shotgun_upgraded',
    rifle_mejorada:    'rifle_upgraded',
  };
  return (map[id] ?? id) as WeaponId;
}
