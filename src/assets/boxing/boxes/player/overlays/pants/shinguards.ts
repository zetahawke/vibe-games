import { registerBoxParts } from '../../../../registry';

/** Single shin piece; `applyOverlays` instances it on each leg. */
registerBoxParts('shinguard', [
  { size: [0.34, 0.5, 0.22], position: [0, 0, 0.04], color: 0xd0d4dc, metal: 0.4, rough: 0.5 },
]);

/** Kept for catalog / shop id; not attached as a single root mesh. */
registerBoxParts('shinguards', [
  { size: [0.34, 0.5, 0.22], position: [-0.22, 0, 0.04], color: 0xd0d4dc, metal: 0.4, rough: 0.5 },
  { size: [0.34, 0.5, 0.22], position: [0.22, 0, 0.04], color: 0xd0d4dc, metal: 0.4, rough: 0.5 },
]);
