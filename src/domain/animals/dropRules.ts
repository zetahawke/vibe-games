import type { AnimalId } from './catalog';

export type DropMode = 'free' | 'smooth' | 'guided';
export type DropFeedback = 'none' | 'success' | 'softFail';

export function resolveDrop(
  mode: DropMode,
  itemId: string,
  targetId: string | null,
): { accept: boolean; feedback: DropFeedback } {
  if (targetId === itemId) {
    return { accept: true, feedback: 'success' };
  }
  if (mode === 'smooth') {
    return { accept: false, feedback: 'softFail' };
  }
  return { accept: false, feedback: 'none' };
}

/** Migrate old Spanish drop mode string to the English value. */
export function migrateDropMode(mode: string): DropMode {
  const map: Record<string, DropMode> = { libre: 'free', suave: 'smooth', guiado: 'guided' };
  return (map[mode] ?? mode) as DropMode;
}

/** @deprecated prefer string ids; kept for typed animal call sites */
export type { AnimalId };
