import { registerBoxParts } from '../../registry';

registerBoxParts('longsword', [
  { size: [0.12, 0.4, 0.12], position: [0, -0.15, 0.05], color: 0x5c3a1e, metal: 0.1, rough: 0.9 },
  { size: [0.36, 0.1, 0.1], position: [0, 0.08, 0], color: 0x666666, metal: 0.7, rough: 0.35 },
  { size: [0.1, 0.14, 1.15], position: [0, 0.12, -0.65], color: 0xb8c0cc, metal: 0.85, rough: 0.22 },
]);

registerBoxParts('longsword_upgraded', [
  { size: [0.12, 0.4, 0.12], position: [0, -0.15, 0.05], color: 0x9a6030, metal: 0.05, rough: 0.85 },
  { size: [0.36, 0.1, 0.1], position: [0, 0.08, 0], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
  { size: [0.1, 0.14, 1.15], position: [0, 0.12, -0.65], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 },
]);
