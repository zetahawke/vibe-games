import { registerBoxParts } from '../../../../registry';

// Camiseta de fútbol: torso ligeramente mayor + franja + número
registerBoxParts('jersey', [
  { size: [0.92, 1.05, 0.55], position: [0, 0, 0], color: 0xe8e8e8, metal: 0.05, rough: 0.9 },
  { size: [0.94, 0.18, 0.56], position: [0, 0.15, 0], color: 0xc94c4c, metal: 0.05, rough: 0.9 },
  { size: [0.22, 0.28, 0.08], position: [0, -0.05, 0.28], color: 0x1a1a1a, metal: 0.1, rough: 0.8 },
]);

// Peto / armadura: pecho (+ front = −Z) + hombreras
registerBoxParts('armor', [
  { size: [0.95, 0.85, 0.58], position: [0, 0.05, 0], color: 0x6a6e78, metal: 0.65, rough: 0.4 },
  { size: [0.32, 0.22, 0.32], position: [-0.55, 0.35, 0], color: 0x555963, metal: 0.7, rough: 0.35 },
  { size: [0.32, 0.22, 0.32], position: [0.55, 0.35, 0], color: 0x555963, metal: 0.7, rough: 0.35 },
  { size: [0.35, 0.12, 0.12], position: [0, 0.2, -0.3], color: 0xc9a227, metal: 0.6, rough: 0.4 },
]);
