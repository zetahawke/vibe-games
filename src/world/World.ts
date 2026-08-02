import * as THREE from 'three';
import { Phase } from '../save/save';
import { WeaponDef } from '../weapons/weapons';
import { zombieHpForWave } from '../weapons/weapons';
import { zombiesToSpawnForWave } from '../waves/waveLogic';
import { InputState } from '../input/InputManager';
import { aabbFromCenter, overlaps } from './aabb';

export type WorldEvents = { kills: number; fortBreached: boolean };

interface Zombie {
  mesh: THREE.Mesh;
  hp: number;
  speed: number;
}

const ARENA = 40;
const FORT_HALF = 3.5;
const PLAYER_SPEED = 8;
const SPAWN_RADIUS = 34;

export class World {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private player = new THREE.Group();
  private yaw = 0;
  private pitch = 0.25;
  private zombies: Zombie[] = [];
  private spawnAcc = 0;
  private fireCooldown = 0;
  private paused = false;
  private phase: Phase = 'wave';
  private wave = 1;
  private toSpawn = 0;
  private fortMesh: THREE.Group;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      200,
    );

    this.scene.background = new THREE.Color(0x87a0b8);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xfff2cc, 0.9);
    sun.position.set(20, 30, 10);
    this.scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA * 2, ARENA * 2),
      new THREE.MeshStandardMaterial({ color: 0x3d6b3a }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.fortMesh = this.buildFort();
    this.scene.add(this.fortMesh);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.4, 1),
      new THREE.MeshStandardMaterial({ color: 0x2f6fed }),
    );
    body.position.y = 0.9;
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xffcc99 }),
    );
    head.position.y = 1.9;
    this.player.add(body, head);
    this.player.position.set(0, 0, 8);
    this.scene.add(this.player);

    window.addEventListener('resize', this.onResize);
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
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
    for (const z of this.zombies) this.scene.remove(z.mesh);
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

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    move.addScaledVector(right, input.moveX);
    move.addScaledVector(forward, -input.moveZ);
    if (move.lengthSq() > 1) move.normalize();
    this.player.position.addScaledVector(move, PLAYER_SPEED * dt);
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -ARENA + 1, ARENA - 1);
    this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -ARENA + 1, ARENA - 1);
    this.player.rotation.y = this.yaw;

    const camOffset = new THREE.Vector3(0, 3.2, 6.5);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.position.copy(this.player.position).add(camOffset);
    this.camera.position.y += Math.sin(this.pitch) * 2;
    this.camera.lookAt(
      this.player.position.x - Math.sin(this.yaw) * 8,
      1.5,
      this.player.position.z - Math.cos(this.yaw) * 8,
    );

    this.fireCooldown = Math.max(0, this.fireCooldown - dt * 1000);
    if (input.fire && this.fireCooldown <= 0) {
      this.fireCooldown = equipped.cooldownMs;
      events.kills += this.tryFire(equipped);
    }

    if (this.phase === 'wave') {
      this.spawnAcc += dt;
      while (this.toSpawn > 0 && this.spawnAcc >= 1.1) {
        this.spawnAcc -= 1.1;
        this.spawnZombie();
        this.toSpawn -= 1;
      }

      const fortAabb = aabbFromCenter(0, 0, FORT_HALF);
      for (const z of this.zombies) {
        const dir = new THREE.Vector3(-z.mesh.position.x, 0, -z.mesh.position.z);
        if (dir.lengthSq() > 0.001) dir.normalize();
        z.mesh.position.addScaledVector(dir, z.speed * dt);
        const zab = aabbFromCenter(z.mesh.position.x, z.mesh.position.z, 0.7);
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
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private tryFire(equipped: WeaponDef): number {
    const origin = this.player.position.clone();
    origin.y = 1.2;
    const dir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    let kills = 0;
    let best: Zombie | null = null;
    let bestDist = Infinity;

    for (const z of this.zombies) {
      const toZ = z.mesh.position.clone().sub(origin);
      toZ.y = 0;
      const dist = toZ.length();
      if (dist > equipped.range) continue;
      const aligned = toZ.clone().normalize().dot(dir);
      const lateral = Math.abs(toZ.clone().normalize().cross(dir).y);
      if (equipped.isMelee) {
        if (dist <= equipped.range && aligned > 0.2 && dist < bestDist) {
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
        this.scene.remove(best.mesh);
        this.zombies = this.zombies.filter((z) => z !== best);
        kills = 1;
      }
    }
    return kills;
  }

  private spawnZombie(): void {
    const angle = Math.random() * Math.PI * 2;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.6, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x4a7a32 }),
    );
    mesh.position.set(Math.cos(angle) * SPAWN_RADIUS, 0.8, Math.sin(angle) * SPAWN_RADIUS);
    this.scene.add(mesh);
    this.zombies.push({
      mesh,
      hp: zombieHpForWave(this.wave),
      speed: 2.2 + this.wave * 0.12,
    });
  }

  private buildFort(): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const wall = (x: number, z: number, w: number, d: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), mat);
      m.position.set(x, 1.1, z);
      g.add(m);
    };
    wall(0, -FORT_HALF, FORT_HALF * 2, 1);
    wall(0, FORT_HALF, FORT_HALF * 2, 1);
    wall(-FORT_HALF, 0, 1, FORT_HALF * 2);
    wall(FORT_HALF, 0, 1, FORT_HALF * 2);
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xc0392b }),
    );
    flag.position.set(0, 1.5, 0);
    g.add(flag);
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
