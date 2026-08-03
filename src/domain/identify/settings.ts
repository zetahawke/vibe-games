import { STORAGE_PREFIX } from '@/config/gameConfig';
import type { DropMode } from '@/domain/animals/dropRules';
import type { IdentifyTheme } from './catalog';

export interface IdentifySettings {
  dropMode: DropMode;
  theme: IdentifyTheme;
}

const DEFAULTS: IdentifySettings = {
  dropMode: 'guiado',
  theme: 'vocales',
};

function key(username: string): string {
  return `${STORAGE_PREFIX}identify:settings:${username}`;
}

export function getIdentifySettings(username: string): IdentifySettings {
  const raw = localStorage.getItem(key(username));
  if (!raw) return { ...DEFAULTS };
  try {
    const data = JSON.parse(raw) as Partial<IdentifySettings>;
    const dropMode: DropMode =
      data.dropMode === 'libre' || data.dropMode === 'suave' || data.dropMode === 'guiado'
        ? data.dropMode
        : DEFAULTS.dropMode;
    const theme: IdentifyTheme =
      data.theme === 'vocales' || data.theme === 'numeros' || data.theme === 'abecedario'
        ? data.theme
        : DEFAULTS.theme;
    return { dropMode, theme };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setIdentifySettings(username: string, settings: IdentifySettings): void {
  localStorage.setItem(key(username), JSON.stringify(settings));
}
