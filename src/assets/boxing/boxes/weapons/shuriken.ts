import { registerBoxParts } from '../../registry';

registerBoxParts('shuriken', [
  { size: [0.55, 0.05, 0.12], position: [0, 0, 0], color: 0x1a1a1a, metal: 0.85, rough: 0.25 },
  { size: [0.12, 0.05, 0.55], position: [0, 0, 0], color: 0x1a1a1a, metal: 0.85, rough: 0.25 },
  { size: [0.1, 0.06, 0.1], position: [0, 0, 0], color: 0x333333, metal: 0.5, rough: 0.4 },
]);

registerBoxParts('shuriken_upgraded', [
  {
    size: [0.55, 0.05, 0.12],
    position: [0, 0, 0],
    color: 0x111111,
    metal: 0.9,
    rough: 0.2,
    emissive: 0x444444,
    emissiveIntensity: 0.1,
  },
  {
    size: [0.12, 0.05, 0.55],
    position: [0, 0, 0],
    color: 0x111111,
    metal: 0.9,
    rough: 0.2,
    emissive: 0x444444,
    emissiveIntensity: 0.1,
  },
  { size: [0.1, 0.06, 0.1], position: [0, 0, 0], color: 0xc9a227, metal: 0.85, rough: 0.2 },
]);
