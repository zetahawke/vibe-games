export type EnemyType = 'zombie' | 'big_zombie' | 'monster' | 'yeti';

export interface EnemyDef {
  type: EnemyType;
  baseHp: number;
  speedFactor: number;
  spawnWaveMin: number;
  baseChance: number;
  maxChance: number;
  chancePerWave: number;
  scale: number;
  bodyColor: number;
  darkColor: number;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  zombie:     { type: 'zombie',     baseHp: 20,  speedFactor: 1.0, spawnWaveMin: 1,  baseChance: 1.0,  maxChance: 0.5,  chancePerWave: -0.05, scale: 1.0, bodyColor: 0x4a7a4a, darkColor: 0x2f3d28 },
  big_zombie: { type: 'big_zombie', baseHp: 120, speedFactor: 0.8, spawnWaveMin: 3,  baseChance: 0.10, maxChance: 0.30, chancePerWave: 0.04,  scale: 1.6, bodyColor: 0x3a5a3a, darkColor: 0x223322 },
  monster:    { type: 'monster',    baseHp: 280, speedFactor: 0.6, spawnWaveMin: 7,  baseChance: 0.01, maxChance: 0.10, chancePerWave: 0.007, scale: 2.0, bodyColor: 0x6a2a2a, darkColor: 0x3a1010 },
  yeti:       { type: 'yeti',       baseHp: 520, speedFactor: 0.5, spawnWaveMin: 15, baseChance: 0.01, maxChance: 0.10, chancePerWave: 0.007, scale: 2.5, bodyColor: 0xd0e8f0, darkColor: 0x8ab0cc },
};

const ORDERED_TYPES: EnemyType[] = ['zombie', 'big_zombie', 'monster', 'yeti'];

function rawWeight(def: EnemyDef, wave: number): number {
  if (wave < def.spawnWaveMin) return 0;
  const wavesPast = wave - def.spawnWaveMin;
  const raw = def.baseChance + wavesPast * def.chancePerWave;
  return def.chancePerWave < 0
    ? Math.max(def.maxChance, raw)
    : Math.min(def.maxChance, raw);
}

export function spawnInterval(wave: number): number {
  return Math.max(0.4, 5 - (wave - 1) * 0.2);
}

export function enemyHp(type: EnemyType, wave: number): number {
  const def = ENEMY_DEFS[type];
  const factor = Math.min(2.2, 1 + Math.max(0, wave - def.spawnWaveMin) * 0.2);
  return Math.round(def.baseHp * factor);
}

export function pickEnemyType(wave: number, rng: () => number = Math.random): EnemyType {
  const weights = ORDERED_TYPES.map((t) => rawWeight(ENEMY_DEFS[t], wave));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < ORDERED_TYPES.length; i++) {
    r -= weights[i];
    if (r <= 0) return ORDERED_TYPES[i];
  }
  return ORDERED_TYPES[ORDERED_TYPES.length - 1];
}
