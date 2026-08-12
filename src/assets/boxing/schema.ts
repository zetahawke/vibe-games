export type Grip = 'right' | 'paired' | 'twoHand';
export type OverlaySlot = 'hat' | 'shirt' | 'pants';

export type BoxingRef =
  | { type: 'boxes'; id: string }
  | { type: 'glb'; url: string; boxesFallbackId?: string };

export interface BoxPart {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: number;
  metal?: number;
  rough?: number;
  emissive?: number;
  emissiveIntensity?: number;
}
