import type { Grip } from '@/assets/boxing/schema';

export type WeaponKind =
  | 'knife'
  | 'kunai'
  | 'pistol'
  | 'shotgun'
  | 'rifle'
  | 'bow'
  | 'sword_shield'
  | 'longsword'
  | 'shuriken';

export type WeaponId =
  | 'knife'
  | 'kunai'
  | 'kunai_upgraded'
  | 'pistol'
  | 'pistol_upgraded'
  | 'shotgun'
  | 'shotgun_upgraded'
  | 'rifle'
  | 'rifle_upgraded'
  | 'sword_shield'
  | 'sword_shield_upgraded'
  | 'longsword'
  | 'longsword_upgraded'
  | 'bow'
  | 'bow_upgraded'
  | 'shuriken'
  | 'shuriken_upgraded';

export interface WeaponDef {
  id: WeaponId;
  kind: WeaponKind;
  grip: Grip;
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
  'kunai',
  'kunai_upgraded',
  'sword_shield',
  'sword_shield_upgraded',
  'longsword',
  'longsword_upgraded',
  'pistol',
  'pistol_upgraded',
  'shuriken',
  'shuriken_upgraded',
  'bow',
  'bow_upgraded',
  'shotgun',
  'shotgun_upgraded',
  'rifle',
  'rifle_upgraded',
];

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  knife: {
    id: 'knife',
    kind: 'knife',
    grip: 'right',
    name: 'Cuchillo',
    price: 0,
    damage: 10,
    cooldownMs: 500,
    range: 2.5,
    isMelee: true,
  },
  kunai: {
    id: 'kunai',
    kind: 'kunai',
    grip: 'right',
    name: 'Kunai',
    price: 25,
    damage: 20,
    cooldownMs: 500,
    range: 2.5,
    isMelee: true,
  },
  kunai_upgraded: {
    id: 'kunai_upgraded',
    kind: 'kunai',
    grip: 'right',
    name: 'Kunai +',
    price: 50,
    damage: 60,
    cooldownMs: 450,
    range: 2.7,
    isMelee: true,
  },
  sword_shield: {
    id: 'sword_shield',
    kind: 'sword_shield',
    grip: 'paired',
    name: 'Espada y escudo',
    price: 20,
    damage: 22,
    cooldownMs: 450,
    range: 2.8,
    isMelee: true,
  },
  sword_shield_upgraded: {
    id: 'sword_shield_upgraded',
    kind: 'sword_shield',
    grip: 'paired',
    name: 'Espada y escudo +',
    price: 60,
    damage: 40,
    cooldownMs: 400,
    range: 3.0,
    isMelee: true,
  },
  longsword: {
    id: 'longsword',
    kind: 'longsword',
    grip: 'twoHand',
    name: 'Espada larga',
    price: 35,
    damage: 35,
    cooldownMs: 700,
    range: 3.2,
    isMelee: true,
  },
  longsword_upgraded: {
    id: 'longsword_upgraded',
    kind: 'longsword',
    grip: 'twoHand',
    name: 'Espada larga +',
    price: 95,
    damage: 60,
    cooldownMs: 650,
    range: 3.4,
    isMelee: true,
  },
  pistol: {
    id: 'pistol',
    kind: 'pistol',
    grip: 'right',
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
    grip: 'right',
    name: 'Pistola mejorada',
    price: 45,
    damage: 55,
    cooldownMs: 320,
    range: 42,
    isMelee: false,
  },
  shuriken: {
    id: 'shuriken',
    kind: 'shuriken',
    grip: 'right',
    name: 'Shuriken',
    price: 15,
    damage: 30,
    cooldownMs: 350,
    range: 40,
    isMelee: false,
  },
  shuriken_upgraded: {
    id: 'shuriken_upgraded',
    kind: 'shuriken',
    grip: 'right',
    name: 'Shuriken +',
    price: 45,
    damage: 55,
    cooldownMs: 320,
    range: 42,
    isMelee: false,
  },
  bow: {
    id: 'bow',
    kind: 'bow',
    grip: 'twoHand',
    name: 'Arco',
    price: 50,
    damage: 50,
    cooldownMs: 400,
    range: 45,
    isMelee: false,
  },
  bow_upgraded: {
    id: 'bow_upgraded',
    kind: 'bow',
    grip: 'twoHand',
    name: 'Arco +',
    price: 140,
    damage: 90,
    cooldownMs: 360,
    range: 48,
    isMelee: false,
  },
  shotgun: {
    id: 'shotgun',
    kind: 'shotgun',
    grip: 'right',
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
    grip: 'right',
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
    grip: 'right',
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
    grip: 'right',
    name: 'Rifle mejorado',
    price: 180,
    damage: 110,
    cooldownMs: 160,
    range: 55,
    isMelee: false,
  },
};

export function resolveWeaponId(id: string): WeaponId {
  return (WEAPON_IDS as string[]).includes(id) ? (id as WeaponId) : 'knife';
}

export function getWeapon(id: string): WeaponDef {
  return WEAPONS[resolveWeaponId(id)];
}

const UPGRADE_SFX_ORDER: WeaponId[] = [
  'pistol',
  'pistol_upgraded',
  'shotgun',
  'shotgun_upgraded',
  'rifle',
  'rifle_upgraded',
  'sword_shield',
  'sword_shield_upgraded',
  'longsword',
  'longsword_upgraded',
  'bow',
  'bow_upgraded',
  'kunai',
  'kunai_upgraded',
  'shuriken',
  'shuriken_upgraded',
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
    cuchillo: 'knife',
    pistola: 'pistol',
    pistola_mejorada: 'pistol_upgraded',
    escopeta: 'shotgun',
    escopeta_mejorada: 'shotgun_upgraded',
    rifle_mejorada: 'rifle_upgraded',
  };
  return resolveWeaponId(map[id] ?? id);
}
