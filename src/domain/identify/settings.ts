import { STORAGE_PREFIX } from '@/config/gameConfig';
import { migrateDropMode, type DropMode } from '@/domain/animals/dropRules';
import { migrateTheme, type IdentifyTheme } from './catalog';

export interface IdentifySettings {
  dropMode: DropMode;
  theme: IdentifyTheme;
}

const DEFAULTS: IdentifySettings = {
  dropMode: 'guided',
  theme: 'vowels',
};

const DROP_MODES: DropMode[] = ['free', 'smooth', 'guided'];
const THEMES: IdentifyTheme[]  = ['vowels', 'numbers', 'alphabet'];

function key(username: string): string {
  return `${STORAGE_PREFIX}identify:settings:${username}`;
}

export function getIdentifySettings(username: string): IdentifySettings {
  const raw = localStorage.getItem(key(username));
  if (!raw) return { ...DEFAULTS };
  try {
    const data = JSON.parse(raw) as Partial<Record<string, string>>;
    const rawMode = data.dropMode ?? '';
    const dropMode: DropMode = DROP_MODES.includes(rawMode as DropMode)
      ? (rawMode as DropMode)
      : migrateDropMode(rawMode);
    const rawTheme = data.theme ?? '';
    const theme: IdentifyTheme = THEMES.includes(rawTheme as IdentifyTheme)
      ? (rawTheme as IdentifyTheme)
      : migrateTheme(rawTheme);
    return {
      dropMode: DROP_MODES.includes(dropMode) ? dropMode : DEFAULTS.dropMode,
      theme: THEMES.includes(theme) ? theme : DEFAULTS.theme,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setIdentifySettings(username: string, settings: IdentifySettings): void {
  localStorage.setItem(key(username), JSON.stringify(settings));
}
