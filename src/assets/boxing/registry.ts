import type { BoxPart } from './schema';

const catalog = new Map<string, BoxPart[]>();

export function registerBoxParts(id: string, parts: BoxPart[]): void {
  catalog.set(id, parts);
}

export function getBoxParts(id: string): BoxPart[] | null {
  return catalog.get(id) ?? null;
}

export function listBoxIds(): string[] {
  return [...catalog.keys()].sort();
}
