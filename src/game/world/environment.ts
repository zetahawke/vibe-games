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

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, pathEndZ + 40), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = pathEndZ / 2 - 4;
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
