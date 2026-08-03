import { STORAGE_PREFIX } from '@/config/gameConfig';
import type { DropMode } from './dropRules';

export type { DropMode };

export type GraphicsStyle = 'dibujado' | 'realista';

export interface AnimalsSettings {
  dropMode: DropMode;
  graphicsStyle: GraphicsStyle;
}

const DEFAULTS: AnimalsSettings = {
  dropMode: 'guiado',
  graphicsStyle: 'dibujado',
};

function key(username: string): string {
  return `${STORAGE_PREFIX}animals:settings:${username}`;
}

function parseSettings(raw: string | null): AnimalsSettings {
  if (!raw) return { ...DEFAULTS };
  try {
    const data = JSON.parse(raw) as Partial<AnimalsSettings>;
    const dropMode: DropMode =
      data.dropMode === 'libre' || data.dropMode === 'suave' || data.dropMode === 'guiado'
        ? data.dropMode
        : DEFAULTS.dropMode;
    const graphicsStyle: GraphicsStyle =
      data.graphicsStyle === 'realista' || data.graphicsStyle === 'dibujado'
        ? data.graphicsStyle
        : DEFAULTS.graphicsStyle;
    return { dropMode, graphicsStyle };
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
