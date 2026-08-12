import { registerBoxParts } from '../../registry';

registerBoxParts('shotgun', [
  { size: [0.16, 0.18, 0.4], position: [0, -0.05, 0.05], color: 0x6b3e1f, metal: 0.1, rough: 0.85 },
  { size: [0.14, 0.14, 0.85], position: [0, 0.02, -0.5], color: 0x444444, metal: 0.65, rough: 0.35 },
  { size: [0.18, 0.16, 0.28], position: [0, -0.08, -0.25], color: 0x2b2b2b, metal: 0.4, rough: 0.5 },
]);

registerBoxParts('shotgun_upgraded', [
  { size: [0.16, 0.18, 0.4], position: [0, -0.05, 0.05], color: 0x9a6030, metal: 0.05, rough: 0.85 },
  { size: [0.14, 0.14, 0.85], position: [0, 0.02, -0.5], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 },
  { size: [0.18, 0.16, 0.28], position: [0, -0.08, -0.25], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
]);
