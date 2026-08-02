import * as THREE from 'three';
import { Phase } from '../save/save';
import { WeaponDef, zombieHpForWave } from '../weapons/weapons';
import { zombiesToSpawnForWave } from '../waves/waveLogic';
import { InputState } from '../input/InputManager';
import { aabbFromCenter, overlaps } from './aabb';
import {
  FORT_HALF,
  FORT_HEIGHT,
  PATH_END_Z,
  rollPathHalfWidth,
} from './layout';
import {
  makeClothTexture,
  makeDirtTexture,
  makeGrassTexture,
  makeSkinTexture,
  makeSkyTexture,
  makeWoodTexture,
  makeZombieTexture,
} from './textures';

export type WorldEvents = { kills: number; fortBreached: boolean };

interface Zombie {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  hp: number;
  speed: number;
  walkPhase: number;
}

interface PlayerRig {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  weapon: THREE.Object3D;
}

const PLAYER_SPEED = 8;
const BASE_ZOMBIE_SPEED = 2.15;

export class World {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private playerRig: PlayerRig;
  /** Face +Z (down the path toward zombies). */
  private yaw = Math.PI;
  private pitch = 0.2;
  private zombies: Zombie[] = [];
  private spawnAcc = 0;
  private fireCooldown = 0;
  private attackAnim = 0;
  private walkPhase = 0;
  private paused = false;
  private phase: Phase = 'wave';
  private wave = 1;
  private toSpawn = 0;
  private textures: THREE.Texture[] = [];
  private materials: THREE.Material[] = [];
  private readonly pathHalfW: number;
  private readonly pathEndZ = PATH_END_Z;
  private readonly fortHalf = FORT_HALF;
  private readonly fortHeight = FORT_HEIGHT;

  constructor(private container: HTMLElement, pathHalfW: number = rollPathHalfWidth()) {
    this.pathHalfW = pathHalfW;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      280,
    );

    const skyTex = makeSkyTexture();
    this.textures.push(skyTex);
    this.scene.background = skyTex;
    this.scene.fog = new THREE.Fog(0xb8d4e8, 55, 140);

    this.scene.add(new THREE.AmbientLight(0xbdd4ff, 0.45));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.15);
    sun.position.set(18, 42, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -55;
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0x9ecbff, 0x3d5c2e, 0.35));

    this.buildGroundAndPath();
    this.scene.add(this.buildFort());
    this.playerRig = this.buildPlayer();
    this.playerRig.root.position.set(0, 0, 8);
    this.playerRig.root.rotation.y = this.yaw;
    this.scene.add(this.playerRig.root);

    window.addEventListener('resize', this.onResize);
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  get player(): THREE.Group {
    return this.playerRig.root;
  }

  setPaused(p: boolean): void {
    this.paused = p;
  }

  setWavePhase(phase: Phase, wave: number): void {
    const phaseChanged = phase !== this.phase;
    const waveChanged = wave !== this.wave;
    this.phase = phase;
    this.wave = wave;
    if (phase === 'wave' && (phaseChanged || waveChanged)) {
      this.toSpawn = zombiesToSpawnForWave(wave);
      this.spawnAcc = 0;
    }
    if (phase === 'rest') {
      this.clearZombies();
      this.toSpawn = 0;
    }
  }

  clearZombies(): void {
    for (const z of this.zombies) this.scene.remove(z.root);
    this.zombies = [];
  }

  update(dt: number, input: InputState, equipped: WeaponDef): WorldEvents {
    const events: WorldEvents = { kills: 0, fortBreached: false };
    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return events;
    }

    this.yaw -= input.lookDx * 0.0025;
    this.pitch = Math.min(0.8, Math.max(-0.2, this.pitch - input.lookDy * 0.002));

    // Facing: yaw=π → +Z (path / zombies)
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    move.addScaledVector(right, input.moveX);
    move.addScaledVector(forward, -input.moveZ);
    if (move.lengthSq() > 1) move.normalize();
    const moving = move.lengthSq() > 0.01;
    this.playerRig.root.position.addScaledVector(move, PLAYER_SPEED * dt);
    this.playerRig.root.position.x = THREE.MathUtils.clamp(
      this.playerRig.root.position.x,
      -this.pathHalfW - 1.5,
      this.pathHalfW + 1.5,
    );
    this.playerRig.root.position.z = THREE.MathUtils.clamp(
      this.playerRig.root.position.z,
      -this.fortHalf + 0.5,
      this.pathEndZ - 3,
    );
    this.playerRig.root.rotation.y = this.yaw;

    if (moving) this.walkPhase += dt * 9;
    this.animatePlayer(moving, dt, equipped);

    const camOffset = new THREE.Vector3(0, 3.4, 6.8);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.position.copy(this.playerRig.root.position).add(camOffset);
    this.camera.position.y += Math.sin(this.pitch) * 2;
    this.camera.lookAt(
      this.playerRig.root.position.x - Math.sin(this.yaw) * 8,
      1.6,
      this.playerRig.root.position.z - Math.cos(this.yaw) * 8,
    );

    this.fireCooldown = Math.max(0, this.fireCooldown - dt * 1000);
    if (input.fire && this.fireCooldown <= 0) {
      this.fireCooldown = equipped.cooldownMs;
      this.attackAnim = 1;
      events.kills += this.tryFire(equipped);
    }

    if (this.phase === 'wave') {
      this.spawnAcc += dt;
      while (this.toSpawn > 0 && this.spawnAcc >= 1.1) {
        this.spawnAcc -= 1.1;
        this.spawnZombie();
        this.toSpawn -= 1;
      }

      const fortAabb = aabbFromCenter(0, 0, this.fortHalf);
      for (const z of this.zombies) {
        // March down the path toward the fort (mostly -Z)
        const target = new THREE.Vector3(0, 0, 0);
        const dir = target.clone().sub(z.root.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) dir.normalize();
        z.root.position.addScaledVector(dir, z.speed * dt);
        // Keep loosely on the path
        z.root.position.x = THREE.MathUtils.clamp(
          z.root.position.x,
          -this.pathHalfW + 0.8,
          this.pathHalfW - 0.8,
        );
        z.root.rotation.y = Math.atan2(dir.x, dir.z);
        z.walkPhase += dt * (6 + z.speed);
        const swing = Math.sin(z.walkPhase) * 0.55;
        z.leftLeg.rotation.x = swing;
        z.rightLeg.rotation.x = -swing;
        z.leftArm.rotation.x = -swing * 0.8;
        z.rightArm.rotation.x = swing * 0.8;
        const zab = aabbFromCenter(z.root.position.x, z.root.position.z, 0.7);
        if (overlaps(zab, fortAabb)) {
          events.fortBreached = true;
          break;
        }
      }
      if (events.fortBreached) this.clearZombies();
    }

    this.renderer.render(this.scene, this.camera);
    return events;
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.clearZombies();
    for (const t of this.textures) t.dispose();
    for (const m of this.materials) m.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private animatePlayer(moving: boolean, dt: number, equipped: WeaponDef): void {
    const swing = moving ? Math.sin(this.walkPhase) * 0.65 : 0;
    this.playerRig.leftLeg.rotation.x = swing;
    this.playerRig.rightLeg.rotation.x = -swing;
    this.playerRig.leftArm.rotation.x = -swing * 0.7;

    if (this.attackAnim > 0) {
      this.attackAnim = Math.max(0, this.attackAnim - dt * 4);
      const t = this.attackAnim;
      if (equipped.isMelee) {
        // Positive X swings the arm toward local -Z (character forward)
        this.playerRig.rightArm.rotation.x = 1.35 * t;
        this.playerRig.rightArm.rotation.z = 0.25 * t;
      } else {
        this.playerRig.rightArm.rotation.x = 0.35 * t;
        this.playerRig.weapon.position.z = -0.45 - 0.12 * t;
      }
    } else {
      this.playerRig.rightArm.rotation.x = swing * 0.7;
      this.playerRig.rightArm.rotation.z = 0;
      this.playerRig.weapon.position.z = -0.45;
    }

    this.playerRig.weapon.scale.set(
      equipped.isMelee ? 0.55 : 1,
      equipped.isMelee ? 0.55 : 0.7,
      equipped.isMelee ? 1.35 : 1.1,
    );
  }

  private tryFire(equipped: WeaponDef): number {
    const origin = this.playerRig.root.position.clone();
    origin.y = 1.2;
    const dir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    let kills = 0;
    let best: Zombie | null = null;
    let bestDist = Infinity;

    for (const z of this.zombies) {
      const toZ = z.root.position.clone().sub(origin);
      toZ.y = 0;
      const dist = toZ.length();
      if (dist > equipped.range) continue;
      const aligned = toZ.clone().normalize().dot(dir);
      const lateral = Math.abs(toZ.clone().normalize().cross(dir).y);
      if (equipped.isMelee) {
        if (dist <= equipped.range && aligned > 0.15 && dist < bestDist) {
          best = z;
          bestDist = dist;
        }
      } else if (aligned > 0.92 && lateral < 0.25 && dist < bestDist) {
        best = z;
        bestDist = dist;
      }
    }

    if (best) {
      best.hp -= equipped.damage;
      if (best.hp <= 0) {
        this.scene.remove(best.root);
        this.zombies = this.zombies.filter((z) => z !== best);
        kills = 1;
      }
    }
    return kills;
  }

  private spawnZombie(): void {
    const z = this.buildZombie();
    const lane = (Math.random() * 2 - 1) * (this.pathHalfW - 1.2);
    z.root.position.set(lane, 0, this.pathEndZ + Math.random() * 2);
    this.scene.add(z.root);
    z.hp = zombieHpForWave(this.wave);
    // Small speed variation (±~10%)
    const waveBoost = 1 + (this.wave - 1) * 0.04;
    z.speed = BASE_ZOMBIE_SPEED * waveBoost * (0.9 + Math.random() * 0.2);
    this.zombies.push(z);
  }

  private buildGroundAndPath(): void {
    const grass = makeGrassTexture();
    const dirt = makeDirtTexture();
    this.textures.push(grass, dirt);

    const grassMat = new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95 });
    const dirtMat = new THREE.MeshStandardMaterial({ map: dirt, roughness: 1 });
    this.materials.push(grassMat, dirtMat);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, this.pathEndZ + 40),
      grassMat,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = this.pathEndZ / 2 - 4;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const pathLen = this.pathEndZ + this.fortHalf + 2;
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(this.pathHalfW * 2, pathLen),
      dirtMat,
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.02;
    path.position.z = pathLen / 2 - this.fortHalf;
    path.receiveShadow = true;
    this.scene.add(path);

    // Simple roadside rocks for depth
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.95 });
    this.materials.push(rockMat);
    const rockCount = Math.floor(18 * (this.pathEndZ / 52));
    for (let i = 0; i < rockCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const rock = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 + Math.random() * 0.35, 6, 5),
        rockMat,
      );
      rock.position.set(
        side * (this.pathHalfW + 1.2 + Math.random()),
        0.2,
        6 + i * ((this.pathEndZ - 8) / rockCount) + Math.random(),
      );
      rock.scale.y = 0.55;
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  private buildPlayer(): PlayerRig {
    const skinTex = makeSkinTexture();
    const shirtTex = makeClothTexture('#2f6fed', '#2558c4');
    const pantsTex = makeClothTexture('#2a3a55', '#1d2a3f');
    this.textures.push(skinTex, shirtTex, pantsTex);

    const skin = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.7 });
    const shirt = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.85 });
    const pants = new THREE.MeshStandardMaterial({ map: pantsTex, roughness: 0.9 });
    this.materials.push(skin, shirt, pants);

    const root = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.5), shirt);
    body.position.y = 1.35;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skin);
    head.position.y = 2.15;
    head.castShadow = true;

    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.18, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.95 }),
    );
    hair.position.y = 2.42;

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.55, 1.7, 0);
    const la = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), skin);
    la.position.y = -0.35;
    la.castShadow = true;
    leftArm.add(la);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.55, 1.7, 0);
    const ra = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), skin);
    ra.position.y = -0.35;
    ra.castShadow = true;
    const weapon = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.35 }),
    );
    // Extend in local -Z (character forward when yaw faces path)
    weapon.position.set(0, -0.75, -0.45);
    weapon.castShadow = true;
    rightArm.add(ra, weapon);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 0.85, 0);
    const ll = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.35), pants);
    ll.position.y = -0.4;
    ll.castShadow = true;
    leftLeg.add(ll);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 0.85, 0);
    const rl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.35), pants);
    rl.position.y = -0.4;
    rl.castShadow = true;
    rightLeg.add(rl);

    root.add(body, head, hair, leftArm, rightArm, leftLeg, rightLeg);
    return { root, leftArm, rightArm, leftLeg, rightLeg, weapon };
  }

  private buildZombie(): Zombie {
    const tex = makeZombieTexture();
    this.textures.push(tex);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    this.materials.push(mat);
    const dark = new THREE.MeshStandardMaterial({ color: 0x2f3d28, roughness: 0.95 });
    this.materials.push(dark);

    const root = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), mat);
    body.position.y = 1.35;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.55), mat);
    head.position.y = 2.15;
    head.castShadow = true;

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.55, 1.75, 0);
    const la = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.26), mat);
    la.position.y = -0.4;
    leftArm.add(la);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.55, 1.75, 0);
    const ra = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.26), mat);
    ra.position.y = -0.4;
    rightArm.add(ra);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 0.85, 0);
    const ll = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.32), dark);
    ll.position.y = -0.4;
    leftLeg.add(ll);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 0.85, 0);
    const rl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.32), dark);
    rl.position.y = -0.4;
    rightLeg.add(rl);

    root.add(body, head, leftArm, rightArm, leftLeg, rightLeg);
    return {
      root,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      hp: 1,
      speed: BASE_ZOMBIE_SPEED,
      walkPhase: Math.random() * Math.PI * 2,
    };
  }

  private buildFort(): THREE.Group {
    const g = new THREE.Group();
    const woodTex = makeWoodTexture();
    this.textures.push(woodTex);
    const mat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
    this.materials.push(mat);
    const h = this.fortHeight;
    const half = this.fortHalf;
    const thick = 1.1;

    const wall = (x: number, z: number, w: number, d: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    };

    // Back + sides; open toward +Z (path / zombies)
    wall(0, -half, half * 2 + thick, thick);
    wall(-half, 0, thick, half * 2 + thick);
    wall(half, 0, thick, half * 2 + thick);

    // Front gate: opening matches path/entrance width
    const openHalf = this.pathHalfW;
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
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.42, h + 0.8, 8),
        mat,
      );
      post.position.set(x, (h + 0.8) / 2, z);
      post.castShadow = true;
      g.add(post);
    }

    // Roof / techo
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(half * 2 + thick * 2, 0.55, half * 2 + thick * 2),
      mat,
    );
    roof.position.set(0, h + 0.2, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    g.add(roof);

    // Slight peak for silhouette
    const peak = new THREE.Mesh(
      new THREE.BoxGeometry(half * 1.2, 0.45, half * 1.2),
      mat,
    );
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

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
