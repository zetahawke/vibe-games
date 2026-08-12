import { registerBoxParts } from '../../registry';

registerBoxParts('bow', [
  { size: [0.06, 0.85, 0.08], position: [0, 0.1, 0], color: 0x6b3e1f, metal: 0.05, rough: 0.85 },
  { size: [0.05, 0.35, 0.06], position: [0, 0.55, -0.12], color: 0x8a5a2b, metal: 0.05, rough: 0.85, rotation: [0.4, 0, 0] },
  { size: [0.05, 0.35, 0.06], position: [0, -0.35, -0.12], color: 0x8a5a2b, metal: 0.05, rough: 0.85, rotation: [-0.4, 0, 0] },
  { size: [0.02, 0.9, 0.02], position: [0, 0.1, -0.22], color: 0xddd8c8, metal: 0.1, rough: 0.6 },
]);

registerBoxParts('bow_upgraded', [
  { size: [0.06, 0.85, 0.08], position: [0, 0.1, 0], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
  { size: [0.05, 0.35, 0.06], position: [0, 0.55, -0.12], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3, rotation: [0.4, 0, 0] },
  { size: [0.05, 0.35, 0.06], position: [0, -0.35, -0.12], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3, rotation: [-0.4, 0, 0] },
  { size: [0.02, 0.9, 0.02], position: [0, 0.1, -0.22], color: 0xffe8a0, metal: 0.2, rough: 0.5 },
]);
