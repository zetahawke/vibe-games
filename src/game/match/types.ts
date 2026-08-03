import type { DropMode } from '@/domain/animals/dropRules';

export interface MatchItem {
  id: string;
  label: string;
}

export interface MatchArt {
  className: string;
  html: string;
}

export interface MatchSessionOptions {
  root: HTMLElement;
  title: string;
  screenClassName: string;
  dropMode: DropMode;
  celebrateMessage: string;
  pickRound: () => MatchItem[];
  renderArt: (item: MatchItem, variant: 'color' | 'shadow') => MatchArt;
  onSuccess?: (item: MatchItem) => void;
  onExit: () => void;
}
