import { STORAGE_PREFIX } from '@/config/gameConfig';
import { migrateDropMode, type DropMode } from './dropRules';

export type { DropMode };

export type GraphicsStyle = 'drawn' | 'realistic';

export interface AnimalsSettings {
  dropMode: DropMode;
  graphicsStyle: GraphicsStyle;
}

const DEFAULTS: AnimalsSettings = {
  dropMode: 'guided',
  graphicsStyle: 'drawn',
};

function key(username: string): string {
  return `${STORAGE_PREFIX}animals:settings:${username}`;
}

/** Migrate old Spanish graphics style to English. */
function migrateStyle(s: string): GraphicsStyle {
  if (s === 'realista') return 'realistic';
  if (s === 'dibujado') return 'drawn';
  return s as GraphicsStyle;
}

function parseSettings(raw: string | null): AnimalsSettings {
  if (!raw) return { ...DEFAULTS };
  try {
    const data = JSON.parse(raw) as Partial<Record<string, string>>;
    const dropMode: DropMode =
      data.dropMode === 'free' || data.dropMode === 'smooth' || data.dropMode === 'guided'
        ? data.dropMode
        : migrateDropMode(data.dropMode ?? '');
    const graphicsStyle: GraphicsStyle =
      data.graphicsStyle === 'realistic' || data.graphicsStyle === 'drawn'
        ? data.graphicsStyle
        : migrateStyle(data.graphicsStyle ?? '');
    return {
      dropMode: ['free', 'smooth', 'guided'].includes(dropMode) ? dropMode : DEFAULTS.dropMode,
      graphicsStyle: ['realistic', 'drawn'].includes(graphicsStyle) ? graphicsStyle : DEFAULTS.graphicsStyle,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function getAnimalsSettings(username: string): AnimalsSettings {
  return parseSettings(localStorage.getItem(key(username)));
}

export function setAnimalsSettings(username: string, settings: AnimalsSettings): void {
  localStorage.setItem(key(username), JSON.stringify(settings));
}

export function getDropMode(username: string): DropMode {
  return getAnimalsSettings(username).dropMode;
}

export function setDropMode(username: string, mode: DropMode): void {
  const cur = getAnimalsSettings(username);
  setAnimalsSettings(username, { ...cur, dropMode: mode });
}

export function getGraphicsStyle(username: string): GraphicsStyle {
  return getAnimalsSettings(username).graphicsStyle;
}

export function setGraphicsStyle(username: string, style: GraphicsStyle): void {
  const cur = getAnimalsSettings(username);
  setAnimalsSettings(username, { ...cur, graphicsStyle: style });
}
