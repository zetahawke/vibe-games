import { registerBoxParts } from '../../registry';

registerBoxParts('pistol', [
  { size: [0.18, 0.22, 0.45], position: [0, 0, -0.25], color: 0x2b2b2b, metal: 0.5, rough: 0.4 },
  { size: [0.1, 0.1, 0.28], position: [0, 0.02, -0.55], color: 0x444444, metal: 0.7, rough: 0.3 },
  { size: [0.14, 0.32, 0.16], position: [0, -0.22, -0.1], color: 0x1a1a1a, metal: 0.2, rough: 0.7 },
]);

registerBoxParts('pistol_upgraded', [
  { size: [0.18, 0.22, 0.45], position: [0, 0, -0.25], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
  { size: [0.1, 0.1, 0.28], position: [0, 0.02, -0.55], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 },
  { size: [0.14, 0.32, 0.16], position: [0, -0.22, -0.1], color: 0x7a5a00, metal: 0.65, rough: 0.35 },
]);
