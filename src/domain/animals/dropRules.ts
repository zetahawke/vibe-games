import type { AnimalId } from './catalog';

export type DropMode = 'libre' | 'suave' | 'guiado';
export type DropFeedback = 'none' | 'success' | 'softFail';

export function resolveDrop(
  mode: DropMode,
  animalId: AnimalId,
  targetId: AnimalId | null,
): { accept: boolean; feedback: DropFeedback } {
  if (targetId === animalId) {
    return { accept: true, feedback: 'success' };
  }
  if (mode === 'suave') {
    return { accept: false, feedback: 'softFail' };
  }
  return { accept: false, feedback: 'none' };
}
