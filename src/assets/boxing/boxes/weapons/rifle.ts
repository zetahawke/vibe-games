import { registerBoxParts } from '../../registry';

registerBoxParts('rifle', [
  { size: [0.14, 0.16, 0.7], position: [0, 0, -0.35], color: 0x2f3d2f, metal: 0.45, rough: 0.4 },
  { size: [0.08, 0.08, 0.55], position: [0, 0.04, -0.85], color: 0x444444, metal: 0.75, rough: 0.28 },
  { size: [0.14, 0.18, 0.35], position: [0, -0.02, 0.15], color: 0x6b3e1f, metal: 0.1, rough: 0.85 },
  { size: [0.12, 0.28, 0.16], position: [0, -0.2, -0.2], color: 0x222222, metal: 0.3, rough: 0.6 },
]);

registerBoxParts('rifle_upgraded', [
  { size: [0.14, 0.16, 0.7], position: [0, 0, -0.35], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.18 },
  { size: [0.08, 0.08, 0.55], position: [0, 0.04, -0.85], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 },
  { size: [0.14, 0.18, 0.35], position: [0, -0.02, 0.15], color: 0x9a6030, metal: 0.05, rough: 0.85 },
  { size: [0.12, 0.28, 0.16], position: [0, -0.2, -0.2], color: 0x7a5a00, metal: 0.65, rough: 0.35 },
]);
