import { STORAGE_PREFIX } from '@/config/gameConfig';
import type { DropMode } from './dropRules';

export type { DropMode };

function key(username: string): string {
  return `${STORAGE_PREFIX}animals:settings:${username}`;
}

export function getDropMode(username: string): DropMode {
  const raw = localStorage.getItem(key(username));
  if (!raw) return 'guiado';
  try {
    const data = JSON.parse(raw) as { dropMode?: string };
    if (data.dropMode === 'libre' || data.dropMode === 'suave' || data.dropMode === 'guiado') {
      return data.dropMode;
    }
  } catch {
    /* ignore */
  }
  return 'guiado';
}

export function setDropMode(username: string, mode: DropMode): void {
  localStorage.setItem(key(username), JSON.stringify({ dropMode: mode }));
}
