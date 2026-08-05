import { MAX_LIVES, MathTopic, STORAGE_PREFIX, WAVE_DURATION_MS } from '@/config/gameConfig';
import type { EnglishGrade } from '@/domain/english';
import { WeaponId } from '@/domain/weapons/weapons';
import { rollPathHalfWidth } from '@/game/world/layout';

export type Phase = 'wave' | 'rest';
export type GameSubject = 'math' | 'english';
export type GradeLevel = '5to' | '6to' | '7mo' | '8vo';

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
  /** Path/entrance half-width for this match (rolled ±20% at nueva partida). */
  pathHalfW: number;
  score: number;
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
    ownedWeapons: ['cuchillo'],
    equippedWeapon: 'cuchillo',
    mathTopic: opts.mathTopic,
    quizDifficulty: 1,
    subject: opts.subject,
    grade: opts.grade,
    englishGrade: opts.englishGrade,
    pathHalfW: rollPathHalfWidth(),
    score: 0,
  };
}

export function loadSave(username: string): GameSave | null {
  const raw = localStorage.getItem(saveKey(username));
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as GameSave;
    if (!Number.isFinite(save.pathHalfW)) save.pathHalfW = rollPathHalfWidth();
    if (!Number.isFinite(save.score)) save.score = 0;
    if (!save.subject) save.subject = 'math';
    if (!save.grade) save.grade = '7mo';
    if (!save.englishGrade) save.englishGrade = '7mo';
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
