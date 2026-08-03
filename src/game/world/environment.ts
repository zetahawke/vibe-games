import * as THREE from 'three';
import { makeDirtTexture, makeGrassTexture, makeWoodTexture } from './textures';

export function buildGroundAndPath(
  scene: THREE.Scene,
  pathHalfW: number,
  pathEndZ: number,
  fortHalf: number,
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
): void {
  const grass = makeGrassTexture();
  const dirt = makeDirtTexture();
  trackTexture(grass);
  trackTexture(dirt);

  const grassMat = new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95 });
  const dirtMat = new THREE.MeshStandardMaterial({ map: dirt, roughness: 1 });
  trackMaterial(grassMat);
  trackMaterial(dirtMat);

  // Wide clearing so the forest ring sits on grass, not void.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, pathEndZ + 70), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = pathEndZ / 2 - 10;
  ground.receiveShadow = true;
  scene.add(ground);

  const pathLen = pathEndZ + fortHalf + 2;
  const path = new THREE.Mesh(new THREE.PlaneGeometry(pathHalfW * 2, pathLen), dirtMat);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.02;
  path.position.z = pathLen / 2 - fortHalf;
  path.receiveShadow = true;
  scene.add(path);

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.95 });
  trackMaterial(rockMat);
  const rockCount = Math.floor(18 * (pathEndZ / 52));
  for (let i = 0; i < rockCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const rock = new THREE.Mesh(
      new THREE.SphereGeometry(0.35 + Math.random() * 0.35, 6, 5),
      rockMat,
    );
    rock.position.set(
      side * (pathHalfW + 1.2 + Math.random()),
      0.2,
      6 + i * ((pathEndZ - 8) / rockCount) + Math.random(),
    );
    rock.scale.y = 0.55;
    rock.castShadow = true;
    scene.add(rock);
  }

  buildForest(scene, pathHalfW, pathEndZ, fortHalf, trackMaterial);
}

/** Low-poly pines / leafy trees ringing the playable path (keeps corridor clear). */
function buildForest(
  scene: THREE.Scene,
  pathHalfW: number,
  pathEndZ: number,
  fortHalf: number,
  trackMaterial: (m: THREE.Material) => void,
): void {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x2d5a28, roughness: 0.85 });
  const pineDarkMat = new THREE.MeshStandardMaterial({ color: 0x1f4220, roughness: 0.88 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7a34, roughness: 0.8 });
  const leafLiteMat = new THREE.MeshStandardMaterial({ color: 0x4f9340, roughness: 0.82 });
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x356b30, roughness: 0.92 });
  for (const m of [trunkMat, pineMat, pineDarkMat, leafMat, leafLiteMat, bushMat]) {
    trackMaterial(m);
  }

  const forest = new THREE.Group();
  const clearX = pathHalfW + 2.8;
  const playZMin = -fortHalf - 1;
  const playZMax = pathEndZ - 1;

  const placeOk = (x: number, z: number): boolean => {
    // Keep dirt path + fort interior open; allow trees behind/beside.
    if (Math.abs(x) < clearX && z > playZMin && z < playZMax) return false;
    if (Math.abs(x) < fortHalf + 1.5 && Math.abs(z) < fortHalf + 1.5) return false;
    return true;
  };

  const addPine = (x: number, z: number, scale: number) => {
    const tree = new THREE.Group();
    const h = 3.2 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, h * 0.45, 6),
      trunkMat,
    );
    trunk.position.y = h * 0.22;
    trunk.castShadow = true;
    const coneA = new THREE.Mesh(new THREE.ConeGeometry(1.35 * scale, h * 0.55, 7), pineMat);
    coneA.position.y = h * 0.55;
    coneA.castShadow = true;
    const coneB = new THREE.Mesh(new THREE.ConeGeometry(1.05 * scale, h * 0.45, 7), pineDarkMat);
    coneB.position.y = h * 0.78;
    coneB.castShadow = true;
    const coneC = new THREE.Mesh(new THREE.ConeGeometry(0.7 * scale, h * 0.35, 7), pineMat);
    coneC.position.y = h * 0.98;
    coneC.castShadow = true;
    tree.add(trunk, coneA, coneB, coneC);
    tree.position.set(x, 0, z);
    forest.add(tree);
  };

  const addLeafy = (x: number, z: number, scale: number) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.6 * scale, 6),
      trunkMat,
    );
    trunk.position.y = 0.8 * scale;
    trunk.castShadow = true;
    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 * scale, 0), leafMat);
    canopy.position.y = 2.1 * scale;
    canopy.scale.set(1.15, 1, 1.1);
    canopy.castShadow = true;
    const canopy2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * scale, 0), leafLiteMat);
    canopy2.position.set(0.35 * scale, 2.45 * scale, -0.2 * scale);
    canopy2.castShadow = true;
    tree.add(trunk, canopy, canopy2);
    tree.position.set(x, 0, z);
    forest.add(tree);
  };

  const addBush = (x: number, z: number, scale: number) => {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * scale, 0), bushMat);
    bush.position.set(x, 0.35 * scale, z);
    bush.scale.set(1.2, 0.75, 1.1);
    bush.castShadow = true;
    forest.add(bush);
  };

  // Side belts along the path
  for (let i = 0; i < 56; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const z = -fortHalf + 2 + (i / 55) * (pathEndZ + fortHalf + 8);
    const x = side * (clearX + 1.5 + Math.random() * 18 + (i % 5) * 1.2);
    if (!placeOk(x, z)) continue;
    const scale = 0.75 + Math.random() * 0.7;
    if (Math.random() > 0.35) addPine(x, z + (Math.random() - 0.5) * 2, scale);
    else addLeafy(x, z + (Math.random() - 0.5) * 2, scale);
  }

  // Back of fort + far sides
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 90;
    const z = -fortHalf - 3 - Math.random() * 22;
    if (!placeOk(x, z)) continue;
    const scale = 0.9 + Math.random() * 0.9;
    if (Math.random() > 0.4) addPine(x, z, scale);
    else addLeafy(x, z, scale);
  }

  // Beyond spawn / path end
  for (let i = 0; i < 36; i++) {
    const x = (Math.random() - 0.5) * 85;
    const z = pathEndZ + 2 + Math.random() * 20;
    if (!placeOk(x, z)) continue;
    const scale = 0.8 + Math.random() * 0.85;
    if (Math.random() > 0.45) addPine(x, z, scale);
    else addLeafy(x, z, scale);
  }

  // Outer fill for depth
  for (let i = 0; i < 48; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 38 + Math.random() * 32;
    const x = Math.cos(angle) * radius;
    const z = pathEndZ * 0.35 + Math.sin(angle) * radius * 0.7;
    if (!placeOk(x, z)) continue;
    const scale = 0.7 + Math.random() * 1.1;
    if (Math.random() > 0.5) addPine(x, z, scale);
    else addLeafy(x, z, scale);
  }

  // Bushes near path edge for a softer forest line
  for (let i = 0; i < 28; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const z = 4 + Math.random() * (pathEndZ - 10);
    const x = side * (clearX + 0.4 + Math.random() * 3.5);
    if (!placeOk(x, z)) continue;
    addBush(x, z, 0.7 + Math.random() * 0.6);
  }

  scene.add(forest);
}

export function buildFort(
  pathHalfW: number,
  fortHalf: number,
  fortHeight: number,
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
): THREE.Group {
  const g = new THREE.Group();
  const woodTex = makeWoodTexture();
  trackTexture(woodTex);
  const mat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
  trackMaterial(mat);
  const h = fortHeight;
  const half = fortHalf;
  const thick = 1.1;

  const wall = (x: number, z: number, w: number, d: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };

  wall(0, -half, half * 2 + thick, thick);
  wall(-half, 0, thick, half * 2 + thick);
  wall(half, 0, thick, half * 2 + thick);

  const openHalf = pathHalfW;
  const sideSpan = half - openHalf;
  if (sideSpan > 0.4) {
    wall(-(openHalf + sideSpan / 2), half, sideSpan, thick);
    wall(openHalf + sideSpan / 2, half, sideSpan, thick);
  }

  for (const [x, z] of [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ] as const) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, h + 0.8, 8), mat);
    post.position.set(x, (h + 0.8) / 2, z);
    post.castShadow = true;
    g.add(post);
  }

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(half * 2 + thick * 2, 0.55, half * 2 + thick * 2),
    mat,
  );
  roof.position.set(0, h + 0.2, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);

  const peak = new THREE.Mesh(new THREE.BoxGeometry(half * 1.2, 0.45, half * 1.2), mat);
  peak.position.set(0, h + 0.7, 0);
  peak.castShadow = true;
  g.add(peak);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, h * 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 }),
  );
  pole.position.set(0, h + 0.55 + (h * 0.55) / 2, -half * 0.35);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xd64545, side: THREE.DoubleSide, roughness: 0.7 }),
  );
  flag.position.set(0.85, h + 0.55 + h * 0.4, -half * 0.35);
  g.add(pole, flag);
  return g;
}
