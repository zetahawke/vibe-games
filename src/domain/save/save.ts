import { MAX_LIVES, MathTopic, STORAGE_PREFIX, WAVE_DURATION_MS } from '@/config/gameConfig';
import type { EnglishGrade } from '@/domain/english';
import { migrateWeaponId, WeaponId } from '@/domain/weapons/weapons';
import { rollPathHalfWidth } from '@/game/world/layout';

export type Phase = 'wave' | 'rest';
export type GameSubject = 'math' | 'english';
export type GradeLevel = '5th' | '6th' | '7th' | '8th';

export interface GameSave {
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  lives: number;
  coins: number;
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  mathTopic: MathTopic;
  quizDifficulty: number;
  subject: GameSubject;
  grade: GradeLevel;
  englishGrade: EnglishGrade;
  /** Path entrance half-width, rolled ±20% on each new game. */
  pathHalfW: number;
  score: number;
  /** Skip coins available to instantly clear the current wave. Max 2. */
  skipCoins: number;
  /** Total waves fully cleared in this game — drives skip-coin awards and reward milestones. */
  wavesCleared: number;
  /** Consecutive correct quiz answers (resets on explicit quiz exit). */
  quizStreak: number;
}

function saveKey(username: string): string {
  return `${STORAGE_PREFIX}save:${username}`;
}

function highScoreKey(username: string): string {
  return `${STORAGE_PREFIX}hiscore:${username}`;
}

export interface NewGameOptions {
  subject: GameSubject;
  grade: GradeLevel;
  englishGrade: EnglishGrade;
  mathTopic: MathTopic;
}

export function defaultSave(opts: NewGameOptions): GameSave {
  return {
    wave: 1,
    phase: 'wave',
    phaseTimeLeftMs: WAVE_DURATION_MS,
    lives: MAX_LIVES,
    coins: 0,
    ownedWeapons: ['knife'],
    equippedWeapon: 'knife',
    mathTopic: opts.mathTopic,
    quizDifficulty: 1,
    subject: opts.subject,
    grade: opts.grade,
    englishGrade: opts.englishGrade,
    pathHalfW: rollPathHalfWidth(),
    score: 0,
    skipCoins: 0,
    wavesCleared: 0,
    quizStreak: 0,
  };
}

/** Migrate a grade level value from old Spanish format to English. */
function migrateGrade(g: string): GradeLevel {
  const map: Record<string, GradeLevel> = {
    '5to': '5th', '6to': '6th', '7mo': '7th', '8vo': '8th',
  };
  return (map[g] ?? g) as GradeLevel;
}

/** Migrate a math topic value from old Spanish format to English. */
function migrateTopic(t: string): MathTopic {
  const map: Record<string, MathTopic> = {
    sumas: 'additions',
    restas: 'subtractions',
    multiplicaciones: 'multiplications',
    divisiones: 'divisions',
    mixto: 'mixed',
  };
  return (map[t] ?? t) as MathTopic;
}

export function loadSave(username: string): GameSave | null {
  const raw = localStorage.getItem(saveKey(username));
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as GameSave;
    if (!Number.isFinite(save.pathHalfW)) save.pathHalfW = rollPathHalfWidth();
    if (!Number.isFinite(save.score)) save.score = 0;
    if (!save.subject) save.subject = 'math';
    save.grade = migrateGrade(save.grade as string);
    if (!save.englishGrade) save.englishGrade = '7th';
    save.equippedWeapon = migrateWeaponId(save.equippedWeapon as string);
    save.ownedWeapons = save.ownedWeapons.map((w) => migrateWeaponId(w as string));
    save.mathTopic = migrateTopic(save.mathTopic as string);
    if (!Number.isFinite(save.skipCoins))    save.skipCoins = 0;
    if (!Number.isFinite(save.wavesCleared)) save.wavesCleared = 0;
    if (!Number.isFinite(save.quizStreak))   save.quizStreak = 0;
    return save;
  } catch {
    return null;
  }
}

export function writeSave(username: string, save: GameSave): void {
  localStorage.setItem(saveKey(username), JSON.stringify(save));
}

export function clearSave(username: string): void {
  localStorage.removeItem(saveKey(username));
}

export function getHighScore(username: string): number {
  const raw = localStorage.getItem(highScoreKey(username));
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function updateHighScore(username: string, wave: number): number {
  const best = Math.max(getHighScore(username), wave);
  localStorage.setItem(highScoreKey(username), String(best));
  return best;
}
