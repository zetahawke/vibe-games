import { registerBoxParts } from '../../registry';

registerBoxParts('kunai', [
  { size: [0.1, 0.28, 0.1], position: [0, -0.12, 0], color: 0x3a3a3a, metal: 0.4, rough: 0.55 },
  { size: [0.07, 0.12, 0.7], position: [0, 0.08, -0.45], color: 0xb8c0cc, metal: 0.9, rough: 0.2 },
  { size: [0.22, 0.04, 0.08], position: [0, 0.02, -0.08], color: 0x222222, metal: 0.5, rough: 0.4 },
]);

registerBoxParts('kunai_upgraded', [
  {
    size: [0.1, 0.28, 0.1],
    position: [0, -0.12, 0],
    color: 0xb8860b,
    metal: 0.75,
    rough: 0.3,
    emissive: 0xd4a017,
    emissiveIntensity: 0.15,
  },
  {
    size: [0.07, 0.12, 0.75],
    position: [0, 0.08, -0.48],
    color: 0xffe8a0,
    metal: 0.95,
    rough: 0.15,
    emissive: 0xffd700,
    emissiveIntensity: 0.2,
  },
  { size: [0.22, 0.04, 0.08], position: [0, 0.02, -0.08], color: 0xd4a017, metal: 0.8, rough: 0.25 },
]);
