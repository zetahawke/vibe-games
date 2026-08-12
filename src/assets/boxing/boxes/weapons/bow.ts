import { registerBoxParts } from '../../registry';

/**
 * Facing convention (all boxing catalogs):
 *   −Z = toward target / character front (cap brim, gun barrel, bow limbs)
 *   +Z = toward wielder / character back (bow string, jersey number)
 * Player root matches Three.js: local −Z is forward.
 */
registerBoxParts('bow', [
  // Riser / grip in the palm
  { size: [0.07, 0.32, 0.09], position: [0, 0, 0], color: 0x5a3218, metal: 0.05, rough: 0.85 },
  // Upper limb curves toward −Z (target)
  { size: [0.05, 0.28, 0.06], position: [0, 0.28, -0.06], color: 0x6b3e1f, metal: 0.05, rough: 0.85, rotation: [0.35, 0, 0] },
  { size: [0.05, 0.28, 0.06], position: [0, 0.48, -0.22], color: 0x8a5a2b, metal: 0.05, rough: 0.85, rotation: [0.7, 0, 0] },
  // Lower limb curves toward −Z
  { size: [0.05, 0.28, 0.06], position: [0, -0.28, -0.06], color: 0x6b3e1f, metal: 0.05, rough: 0.85, rotation: [-0.35, 0, 0] },
  { size: [0.05, 0.28, 0.06], position: [0, -0.48, -0.22], color: 0x8a5a2b, metal: 0.05, rough: 0.85, rotation: [-0.7, 0, 0] },
  // String toward wielder (+Z)
  { size: [0.015, 0.95, 0.015], position: [0, 0, 0.2], color: 0xddd8c8, metal: 0.1, rough: 0.6 },
]);

registerBoxParts('bow_upgraded', [
  { size: [0.07, 0.32, 0.09], position: [0, 0, 0], color: 0xb8860b, metal: 0.7, rough: 0.3, emissive: 0xd4a017, emissiveIntensity: 0.15 },
  { size: [0.05, 0.28, 0.06], position: [0, 0.28, -0.06], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.2, rotation: [0.35, 0, 0] },
  { size: [0.05, 0.28, 0.06], position: [0, 0.48, -0.22], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3, rotation: [0.7, 0, 0] },
  { size: [0.05, 0.28, 0.06], position: [0, -0.28, -0.06], color: 0xd4a017, metal: 0.75, rough: 0.25, emissive: 0xd4a017, emissiveIntensity: 0.2, rotation: [-0.35, 0, 0] },
  { size: [0.05, 0.28, 0.06], position: [0, -0.48, -0.22], color: 0xffd700, metal: 0.85, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3, rotation: [-0.7, 0, 0] },
  { size: [0.015, 0.95, 0.015], position: [0, 0, 0.2], color: 0xffe8a0, metal: 0.2, rough: 0.5 },
]);
