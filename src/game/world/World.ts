import * as THREE from 'three';
import { WAVE_DURATION_MS } from '@/config/gameConfig';
import type { Phase } from '@/domain/save/save';
import { enemyHp, pickEnemyType, spawnInterval, ENEMY_DEFS } from '@/domain/waves/enemyConfig';
import { WeaponDef, WeaponId } from '@/domain/weapons/weapons';
import type { InputState } from '@/game/input/InputManager';
import { aabbFromCenter, overlaps } from './aabb';
import { buildFort, buildGroundAndPath } from './environment';
import { FORT_HALF, FORT_HEIGHT, PATH_END_Z, rollPathHalfWidth } from './layout';
import {
  aimDirection,
  animatePlayer,
  buildPlayer,
  lerpAngle,
  muzzleAimDirection,
  PLAYER_GRAVITY,
  PLAYER_GROUND_Y,
  PLAYER_JUMP_SPEED,
  PLAYER_SPEED,
  syncWeaponModel,
  updateThirdPersonCamera,
  yawFacingMove,
  type PlayerRig,
} from './player';
import {
  clearProjectiles,
  spawnProjectiles,
  updateProjectiles,
  type Projectile,
} from './projectiles';
import { makeSkyTexture } from './textures';
import { animateEnemyWalk, BASE_ZOMBIE_SPEED, buildEnemy, type Enemy } from './enemy';

export type WorldEvents = { kills: number; fortBreached: boolean };

export class World {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private playerRig: PlayerRig;
  private yaw = Math.PI;
  /** Body facing (can differ from camera yaw while strafing). */
  private bodyYaw = Math.PI;
  private pitch = 0.2;
  private enemies: Enemy[] = [];
  private fireCooldown = 0;
  private attackAnim = 0;
  private walkPhase = 0;
  private vy = 0;
  private paused = false;
  private phase: Phase = 'rest';
  private wave = 0;
  private spawnTimer = 0;
  private projectiles: Projectile[] = [];
  private equippedId: WeaponId | null = null;
  private textures: THREE.Texture[] = [];
  private materials: THREE.Material[] = [];
  private readonly pathHalfW: number;
  private readonly pathEndZ = PATH_END_Z;
  private readonly fortHalf = FORT_HALF;
  private readonly fortHeight = FORT_HEIGHT;
  private hpBarsLayer: HTMLElement;
  private hpBarEls = new Map<Enemy, HTMLElement>();

  constructor(private container: HTMLElement, pathHalfW: number = rollPathHalfWidth()) {
    this.pathHalfW = pathHalfW;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.append(this.renderer.domElement);

    this.hpBarsLayer = document.createElement('div');
    this.hpBarsLayer.className = 'zombie-hp-layer';
    container.append(this.hpBarsLayer);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      280,
    );

    const skyTex = makeSkyTexture();
    this.textures.push(skyTex);
    this.scene.background = skyTex;
    this.scene.fog = new THREE.Fog(0xa8c4a8, 45, 125);

    this.scene.add(new THREE.AmbientLight(0xbdd4ff, 0.45));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.15);
    sun.position.set(18, 42, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0x9ecbff, 0x3d5c2e, 0.35));

    const trackTex = (t: THREE.Texture) => this.textures.push(t);
    const trackMat = (m: THREE.Material) => this.materials.push(m);

    buildGroundAndPath(
      this.scene,
      this.pathHalfW,
      this.pathEndZ,
      this.fortHalf,
      trackTex,
      trackMat,
    );
    this.scene.add(buildFort(this.pathHalfW, this.fortHalf, this.fortHeight, trackTex, trackMat));
    this.playerRig = buildPlayer(trackTex, trackMat);
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

  isPlayerInFort(): boolean {
    const { x, z } = this.playerRig.root.position;
    const h = this.fortHalf;
    return Math.abs(x) <= h && Math.abs(z) <= h;
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
      this.spawnTimer = spawnInterval(wave);
    }
    if (phase === 'rest') {
      this.clearEnemies();
      clearProjectiles(this.scene, this.projectiles);
      this.projectiles = [];
    }
  }

  clearEnemies(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.root);
      this.hpBarEls.get(e)?.remove();
      this.hpBarEls.delete(e);
    }
    this.enemies = [];
  }

  /** @deprecated use clearEnemies() */
  clearZombies(): void { this.clearEnemies(); }

  update(dt: number, input: InputState, equipped: WeaponDef): WorldEvents {
    const events: WorldEvents = { kills: 0, fortBreached: false };
    this.equippedId = syncWeaponModel(
      this.playerRig.weaponSlot,
      this.equippedId,
      equipped.id,
    );

    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return events;
    }

    this.yaw -= input.lookDx * 0.0025;
    this.pitch = Math.min(0.55, Math.max(-0.4, this.pitch - input.lookDy * 0.002));

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    move.addScaledVector(right, input.moveX);
    move.addScaledVector(forward, -input.moveZ);
    if (move.lengthSq() > 1) move.normalize();
    const moving = move.lengthSq() > 0.01;
    this.playerRig.root.position.addScaledVector(move, PLAYER_SPEED * dt);

    if (input.jump && this.playerRig.root.position.y <= PLAYER_GROUND_Y + 0.001) {
      this.vy = PLAYER_JUMP_SPEED;
    }
    this.vy -= PLAYER_GRAVITY * dt;
    this.playerRig.root.position.y += this.vy * dt;
    if (this.playerRig.root.position.y <= PLAYER_GROUND_Y) {
      this.playerRig.root.position.y = PLAYER_GROUND_Y;
      this.vy = 0;
    }
    const grounded = this.playerRig.root.position.y <= PLAYER_GROUND_Y + 0.001;

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

    // Face movement direction (W/A/S/D); when idle, ease toward camera look.
    const turnSpeed = moving ? 14 : 6;
    const targetBodyYaw = moving
      ? yawFacingMove(move.x, move.z)
      : this.yaw;
    this.bodyYaw = lerpAngle(this.bodyYaw, targetBodyYaw, Math.min(1, dt * turnSpeed));
    this.playerRig.root.rotation.y = this.bodyYaw;

    if (moving && grounded) this.walkPhase += dt * 9;
    this.attackAnim = animatePlayer(
      this.playerRig,
      this.walkPhase,
      this.attackAnim,
      moving,
      grounded,
      dt,
      equipped,
    );
    updateThirdPersonCamera(this.camera, this.playerRig.root, this.yaw, this.pitch);

    this.fireCooldown = Math.max(0, this.fireCooldown - dt * 1000);
    if (input.fire && this.fireCooldown <= 0) {
      this.fireCooldown = equipped.cooldownMs;
      this.attackAnim = 1;
      if (equipped.isMelee) {
        events.kills += this.tryMelee(equipped);
      } else {
        const { origin, direction } = muzzleAimDirection(
          this.playerRig,
          this.yaw,
          this.pitch,
        );
        this.projectiles.push(
          ...spawnProjectiles(this.scene, origin, direction, equipped),
        );
      }
    }

    const proj = updateProjectiles(
      this.scene,
      this.projectiles,
      this.enemies,
      dt,
      (e, dmg) => this.damageEnemy(e, dmg),
    );
    this.projectiles = proj.remaining;
    events.kills += proj.kills;

    if (this.phase === 'wave') {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = spawnInterval(this.wave);
      }

      const fortAabb = aabbFromCenter(0, 0, this.fortHalf);
      for (const e of this.enemies) {
        const dir = new THREE.Vector3(0, 0, 0).sub(e.root.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) dir.normalize();
        e.root.position.addScaledVector(dir, e.speed * dt);
        e.root.position.x = THREE.MathUtils.clamp(
          e.root.position.x,
          -this.pathHalfW + 0.8,
          this.pathHalfW - 0.8,
        );
        e.root.rotation.y = Math.atan2(dir.x, dir.z);
        animateEnemyWalk(e, dt);
        const eab = aabbFromCenter(e.root.position.x, e.root.position.z, 0.7 * ENEMY_DEFS[e.type].scale);
        if (overlaps(eab, fortAabb)) {
          events.fortBreached = true;
          break;
        }
      }
      if (events.fortBreached) this.clearEnemies();
    }

    this.updateHpBars();
    this.renderer.render(this.scene, this.camera);
    return events;
  }

  private updateHpBars(): void {
    const now = performance.now();
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const above = new THREE.Vector3();
    for (const e of this.enemies) {
      const bar = this.hpBarEls.get(e);
      if (!bar) continue;
      const visible = now < e.hpShowUntil;
      bar.hidden = !visible;
      if (!visible) continue;
      const headY = 2.8 * ENEMY_DEFS[e.type].scale;
      above.set(e.root.position.x, headY, e.root.position.z);
      above.project(this.camera);
      if (above.z > 1) { bar.hidden = true; continue; }
      const sx = ((above.x + 1) / 2) * w;
      const sy = ((-above.y + 1) / 2) * h;
      bar.style.left = `${sx - 30}px`;
      bar.style.top = `${sy - 8}px`;
      const pct = Math.max(0, Math.min(1, e.hp / e.hpMax)) * 100;
      (bar.firstElementChild as HTMLElement).style.width = `${pct}%`;
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.clearEnemies();
    this.hpBarsLayer.remove();
    clearProjectiles(this.scene, this.projectiles);
    this.projectiles = [];
    for (const t of this.textures) t.dispose();
    for (const m of this.materials) m.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private tryMelee(equipped: WeaponDef): number {
    const origin = this.playerRig.root.position.clone();
    origin.y = 1.2;
    const dir = aimDirection(this.yaw, this.pitch);
    dir.y = 0;
    dir.normalize();
    let best: Enemy | null = null;
    let bestDist = Infinity;

    for (const e of this.enemies) {
      const toE = e.root.position.clone().sub(origin);
      toE.y = 0;
      const dist = toE.length();
      if (dist > equipped.range * 1.2) continue;
      if (toE.clone().normalize().dot(dir) > 0.15 && dist < bestDist) {
        best = e;
        bestDist = dist;
      }
    }
    return best ? this.damageEnemy(best, equipped.damage) : 0;
  }

  private damageEnemy(e: Enemy, dmg: number): number {
    e.hp = Math.max(0, e.hp - dmg);
    e.hpShowUntil = performance.now() + 2000;
    if (e.hp <= 0) {
      this.scene.remove(e.root);
      this.hpBarEls.get(e)?.remove();
      this.hpBarEls.delete(e);
      this.enemies = this.enemies.filter((x) => x !== e);
      return 1;
    }
    return 0;
  }

  private spawnEnemy(): void {
    const type = pickEnemyType(this.wave);
    const e = buildEnemy(type, (t) => this.textures.push(t), (m) => this.materials.push(m));
    const hp = enemyHp(type, this.wave);
    e.hp = hp;
    e.hpMax = hp;
    e.hpShowUntil = performance.now() + 2000;
    const lane = (Math.random() - 0.5) * (this.pathHalfW - 1.2) * 2;
    e.root.position.set(lane, 0, this.pathEndZ + Math.random() * 2);
    this.scene.add(e.root);
    this.enemies.push(e);

    const bar = document.createElement('div');
    bar.className = 'zombie-hp-bar';
    bar.innerHTML = '<div class="zombie-hp-fill"></div>';
    this.hpBarsLayer.append(bar);
    this.hpBarEls.set(e, bar);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
