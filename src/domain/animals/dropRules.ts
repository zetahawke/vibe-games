import type { AnimalId } from './catalog';

export type DropMode = 'libre' | 'suave' | 'guiado';
export type DropFeedback = 'none' | 'success' | 'softFail';

export function resolveDrop(
  mode: DropMode,
  itemId: string,
  targetId: string | null,
): { accept: boolean; feedback: DropFeedback } {
  if (targetId === itemId) {
    return { accept: true, feedback: 'success' };
  }
  if (mode === 'suave') {
    return { accept: false, feedback: 'softFail' };
  }
  return { accept: false, feedback: 'none' };
}

/** @deprecated prefer string ids; kept for typed animal call sites */
export type { AnimalId };
