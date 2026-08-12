import { registerBoxParts } from '../../registry';

registerBoxParts('sword', [
  { size: [0.1, 0.28, 0.1], position: [0, -0.12, 0], color: 0x5c3a1e, metal: 0.1, rough: 0.9 },
  { size: [0.28, 0.08, 0.08], position: [0, 0.02, 0], color: 0x888888, metal: 0.7, rough: 0.35 },
  { size: [0.08, 0.12, 0.85], position: [0, 0.08, -0.5], color: 0xcfd6e0, metal: 0.85, rough: 0.25 },
]);

registerBoxParts('sword_upgraded', [
  { size: [0.1, 0.28, 0.1], position: [0, -0.12, 0], color: 0x9a6030, metal: 0.05, rough: 0.85 },
  { size: [0.28, 0.08, 0.08], position: [0, 0.02, 0], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
  { size: [0.08, 0.12, 0.85], position: [0, 0.08, -0.5], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 },
]);

registerBoxParts('shield', [
  { size: [0.55, 0.7, 0.08], position: [0, -0.15, 0.05], color: 0x4a5a8a, metal: 0.35, rough: 0.55 },
  { size: [0.18, 0.18, 0.1], position: [0, -0.1, 0.12], color: 0xc9a227, metal: 0.6, rough: 0.4 },
]);

registerBoxParts('shield_upgraded', [
  { size: [0.55, 0.7, 0.08], position: [0, -0.15, 0.05], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
  { size: [0.18, 0.18, 0.1], position: [0, -0.1, 0.12], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 },
]);
