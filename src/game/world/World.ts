import * as THREE from 'three';
import { WAVE_DURATION_MS } from '@/config/gameConfig';
import type { PlayerLook } from './player';
import type { Phase } from '@/domain/save/save';
import { isNightWave, nightSpeedMul } from '@/domain/waves/dayNight';
import { enemyHp, pickEnemyType, spawnInterval, ENEMY_DEFS, type EnemyType } from '@/domain/waves/enemyConfig';
import { reconcileEnemySnapshot } from '@/domain/online/enemySync';
import { getWeapon, WeaponDef, WeaponId } from '@/domain/weapons/weapons';
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

export type WorldEvents = { kills: Array<{ type: EnemyType }>; fortBreached: boolean };

const _scratchDir = new THREE.Vector3();

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const map = (m as THREE.MeshStandardMaterial).map;
      map?.dispose();
      m.dispose();
    }
  });
}

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
  private spawnMultiplier = 1;
  private enemyHpMultiplier = 1;
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
  private remoteAvatars = new Map<string, {
    rig: PlayerRig;
    walkPhase: number;
    weaponId: WeaponId | null;
    grounded: boolean;
  }>();
  private remoteTargets = new Map<string, { x: number; y: number; z: number; rotY: number }>();
  private guestMode = false;
  private nextNetId = 1;
  /** netIds killed locally — ignore lagging host snapshots until host drops them. */
  private killedNetIds = new Set<number>();
  /** Host-authored positions for guest puppet interpolation. */
  private enemyNetTargets = new Map<number, { x: number; z: number }>();
  private onEnemyHitCb: ((netId: number, dmg: number, killed: boolean) => void) | null = null;
  private onShotCb: ((
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    weapon: WeaponId,
  ) => void) | null = null;
  private sky: THREE.Mesh;
  private skyDay: THREE.CanvasTexture;
  private skyNight: THREE.CanvasTexture;
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private amb: THREE.AmbientLight;
  private onEnemySpawnCb: ((state: {
    id: number; type: EnemyType; x: number; z: number; hp: number; hpMax: number;
  }) => void) | null = null;

  constructor(
    private container: HTMLElement,
    pathHalfW: number = rollPathHalfWidth(),
    look: PlayerLook = {},
  ) {
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

    this.skyDay = makeSkyTexture(false);
    this.skyNight = makeSkyTexture(true);
    this.textures.push(this.skyDay, this.skyNight);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyDay,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(160, 24, 16), skyMat);
    this.scene.add(this.sky);
    this.scene.fog = new THREE.Fog(0xa8c4a8, 45, 125);

    this.amb = new THREE.AmbientLight(0xbdd4ff, 0.45);
    this.sun = new THREE.DirectionalLight(0xfff0d0, 1.15);
    this.sun.position.set(18, 42, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -70;
    this.sun.shadow.camera.right = 70;
    this.sun.shadow.camera.top = 70;
    this.sun.shadow.camera.bottom = -70;
    this.hemi = new THREE.HemisphereLight(0x9ecbff, 0x3d5c2e, 0.35);
    this.scene.add(this.amb, this.sun, this.hemi);

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
    this.playerRig = buildPlayer(trackTex, trackMat, look);
    this.playerRig.root.position.set(0, 0, 8);
    this.playerRig.root.rotation.y = this.yaw;
    this.scene.add(this.playerRig.root);

    window.addEventListener('resize', this.onResize);
  }

  get canvas(): HTMLCanvasElement { return this.renderer.domElement; }
  get player(): THREE.Group      { return this.playerRig.root; }
  get playerYaw(): number        { return this.bodyYaw; }
  get playerGrounded(): boolean {
    return this.playerRig.root.position.y <= PLAYER_GROUND_Y + 0.001;
  }

  // ── Remote player avatars ──────────────────────────────────────────────

  upsertRemotePlayer(
    playerId: string,
    x: number,
    z: number,
    rotY: number,
    weaponId?: string,
    y = 0,
    grounded = true,
    look?: PlayerLook,
  ): void {
    this.remoteTargets.set(playerId, { x, y, z, rotY });
    let avatar = this.remoteAvatars.get(playerId);
    if (!avatar) {
      const rig = buildPlayer((t) => this.textures.push(t), (m) => this.materials.push(m), look);
      rig.root.position.set(x, y, z);
      rig.root.rotation.y = rotY;
      this.scene.add(rig.root);
      avatar = { rig, walkPhase: 0, weaponId: null, grounded };
      this.remoteAvatars.set(playerId, avatar);
    }
    avatar.grounded = grounded;
    if (weaponId) {
      avatar.weaponId = syncWeaponModel(avatar.rig.weaponSlot, avatar.weaponId, weaponId as WeaponId);
    }
  }

  removeRemotePlayer(playerId: string): void {
    const avatar = this.remoteAvatars.get(playerId);
    if (avatar) {
      disposeObject3D(avatar.rig.root);
      this.scene.remove(avatar.rig.root);
      this.remoteAvatars.delete(playerId);
    }
    this.remoteTargets.delete(playerId);
  }

  clearRemotePlayers(): void {
    for (const id of [...this.remoteAvatars.keys()]) this.removeRemotePlayer(id);
  }

  setGuestMode(guest: boolean): void {
    this.guestMode = guest;
  }

  setShotHandler(handler: (
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    weapon: WeaponId,
  ) => void): void {
    this.onShotCb = handler;
  }

  spawnRemoteShot(
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    weaponId: string,
  ): void {
    const equipped = getWeapon((weaponId as WeaponId) || 'pistol');
    if (equipped.isMelee) return;
    const direction = new THREE.Vector3(dir.x, dir.y, dir.z);
    if (direction.lengthSq() < 1e-6) return;
    direction.normalize();
    const from = new THREE.Vector3(origin.x, origin.y, origin.z);
    const shots = spawnProjectiles(this.scene, from, direction, equipped, { spreadScale: 0 });
    for (const p of shots) p.visualOnly = true;
    this.projectiles.push(...shots);
  }

  setCombatNetHandlers(handlers: {
    onHit: (netId: number, dmg: number, killed: boolean) => void;
    onSpawn: (state: {
      id: number; type: EnemyType; x: number; z: number; hp: number; hpMax: number;
    }) => void;
  }): void {
    this.onEnemyHitCb = handlers.onHit;
    this.onEnemySpawnCb = handlers.onSpawn;
  }

  getEnemySnapshot(): Array<{
    id: number; type: EnemyType; x: number; z: number; hp: number; hpMax: number;
  }> {
    return this.enemies.map((e) => ({
      id: e.netId,
      type: e.type,
      x: e.root.position.x,
      z: e.root.position.z,
      hp: e.hp,
      hpMax: e.hpMax,
    }));
  }

  spawnRemoteEnemy(state: {
    id: number; type: EnemyType; x: number; z: number; hp: number; hpMax: number;
  }): void {
    if (this.killedNetIds.has(state.id)) return;
    this.enemyNetTargets.set(state.id, { x: state.x, z: state.z });
    if (this.enemies.some((e) => e.netId === state.id)) return;
    this.nextNetId = Math.max(this.nextNetId, state.id + 1);
    this.placeEnemy(state.type, state.id, state.x, state.z, state.hp, state.hpMax);
  }

  applyRemoteHit(netId: number, dmg: number): number {
    const e = this.enemies.find((x) => x.netId === netId);
    if (!e) return 0;
    return this.damageEnemy(e, dmg, true) ? 1 : 0;
  }

  applyEnemySnapshot(states: Array<{
    id: number; type: EnemyType; x: number; z: number; hp: number; hpMax: number;
  }>): void {
    // An empty snapshot during combat is almost certainly a dropped/partial
    // packet — never wipe living enemies because of it.
    if (states.length === 0 && this.phase === 'wave' && this.enemies.length > 0) return;

    const { apply, tombs } = reconcileEnemySnapshot(states, this.killedNetIds);
    this.killedNetIds = tombs;

    const seen = new Set(apply.map((s) => s.id));
    for (const s of apply) {
      this.enemyNetTargets.set(s.id, { x: s.x, z: s.z });
      const existing = this.enemies.find((e) => e.netId === s.id);
      if (!existing) {
        this.spawnRemoteEnemy(s);
      } else {
        // Never rewind HP above what we already applied locally (in-flight hit).
        existing.hp = Math.min(existing.hp, s.hp);
        existing.hpMax = s.hpMax;
        existing.hpShowUntil = performance.now() + 2000;
      }
    }
    for (const e of [...this.enemies]) {
      if (!seen.has(e.netId)) this.removeEnemyVisual(e);
    }
    for (const id of [...this.enemyNetTargets.keys()]) {
      if (!seen.has(id) && !this.killedNetIds.has(id)) this.enemyNetTargets.delete(id);
    }
  }

  isPlayerInFort(): boolean {
    const { x, z } = this.playerRig.root.position;
    const h = this.fortHalf;
    return Math.abs(x) <= h && Math.abs(z) <= h;
  }

  setPaused(p: boolean): void {
    this.paused = p;
  }

  setSpawnMultiplier(n: number): void {
    this.spawnMultiplier = Math.max(1, n);
  }

  setEnemyHpMultiplier(n: number): void {
    this.enemyHpMultiplier = Math.max(1, n);
  }

  setWavePhase(phase: Phase, wave: number): void {
    const phaseChanged = phase !== this.phase;
    const waveChanged = wave !== this.wave;
    this.phase = phase;
    this.wave = wave;
    this.applyDayNight(isNightWave(wave));
    const mul = nightSpeedMul(wave);
    for (const e of this.enemies) {
      e.speed = BASE_ZOMBIE_SPEED * ENEMY_DEFS[e.type].speedFactor * mul;
    }
    if (phase === 'wave' && (phaseChanged || waveChanged)) {
      this.spawnTimer = spawnInterval(wave);
    }
    if (phase === 'rest') {
      this.clearEnemies();
      clearProjectiles(this.scene, this.projectiles);
      this.projectiles = [];
    }
  }

  private applyDayNight(night: boolean): void {
    const mat = this.sky.material as THREE.MeshBasicMaterial;
    mat.map = night ? this.skyNight : this.skyDay;
    mat.needsUpdate = true;
    this.scene.fog = new THREE.Fog(night ? 0x1a2438 : 0xa8c4a8, night ? 30 : 45, night ? 90 : 125);
    this.amb.intensity = night ? 0.18 : 0.45;
    this.sun.intensity = night ? 0.25 : 1.15;
    this.hemi.intensity = night ? 0.12 : 0.35;
  }

  clearEnemies(): void {
    for (const e of [...this.enemies]) this.removeEnemyVisual(e);
    this.killedNetIds.clear();
    this.enemyNetTargets.clear();
  }

  /** @deprecated use clearEnemies() */
  clearZombies(): void { this.clearEnemies(); }

  update(dt: number, input: InputState, equipped: WeaponDef): WorldEvents {
    const events: WorldEvents = { kills: [], fortBreached: false };
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
    this.sky.position.copy(this.camera.position);

    this.fireCooldown = Math.max(0, this.fireCooldown - dt * 1000);
    if (input.fire && this.fireCooldown <= 0) {
      this.fireCooldown = equipped.cooldownMs;
      this.attackAnim = 1;
      if (equipped.isMelee) {
        const killed = this.tryMelee(equipped);
        if (killed) events.kills.push({ type: killed });
      } else {
        const { origin, direction } = muzzleAimDirection(
          this.playerRig,
          this.yaw,
          this.pitch,
        );
        this.projectiles.push(
          ...spawnProjectiles(this.scene, origin, direction, equipped),
        );
        this.onShotCb?.(
          { x: origin.x, y: origin.y, z: origin.z },
          { x: direction.x, y: direction.y, z: direction.z },
          equipped.id,
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
    events.kills.push(...proj.kills.map((type) => ({ type })));

    if (this.phase === 'wave') {
      if (this.guestMode) {
        this.lerpNetworkEnemies(dt);
      } else {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          for (let i = 0; i < this.spawnMultiplier; i++) {
            this.spawnEnemy();
          }
          this.spawnTimer = spawnInterval(this.wave);
        }

        const fortAabb = aabbFromCenter(0, 0, this.fortHalf);
        const dir = _scratchDir;
        for (const e of this.enemies) {
          dir.copy(e.root.position).multiplyScalar(-1);
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
    }

    this.lerpRemoteAvatars(dt);
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
    this.clearRemotePlayers();
    this.clearEnemies();
    this.hpBarsLayer.remove();
    clearProjectiles(this.scene, this.projectiles);
    this.projectiles = [];
    for (const t of this.textures) t.dispose();
    for (const m of this.materials) m.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private tryMelee(equipped: WeaponDef): EnemyType | null {
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
    return best ? this.damageEnemy(best, equipped.damage) : null;
  }

  private lerpNetworkEnemies(dt: number): void {
    const t = Math.min(1, dt * 14);
    for (const e of this.enemies) {
      const target = this.enemyNetTargets.get(e.netId);
      if (!target) continue;
      const px = e.root.position.x;
      const pz = e.root.position.z;
      e.root.position.x = THREE.MathUtils.lerp(px, target.x, t);
      e.root.position.z = THREE.MathUtils.lerp(pz, target.z, t);
      const dx = target.x - px;
      const dz = target.z - pz;
      if (dx * dx + dz * dz > 0.00005) {
        e.root.rotation.y = Math.atan2(dx, dz);
        animateEnemyWalk(e, dt);
      }
    }
  }

  private lerpRemoteAvatars(dt: number): void {
    const t = Math.min(1, dt * 18);
    for (const [id, avatar] of this.remoteAvatars) {
      const target = this.remoteTargets.get(id);
      if (!target) continue;
      const root = avatar.rig.root;
      const prevX = root.position.x;
      const prevZ = root.position.z;
      root.position.x = THREE.MathUtils.lerp(prevX, target.x, t);
      root.position.y = THREE.MathUtils.lerp(root.position.y, target.y, t);
      root.position.z = THREE.MathUtils.lerp(prevZ, target.z, t);
      root.rotation.y = lerpAngle(root.rotation.y, target.rotY, t);
      const dx = root.position.x - prevX;
      const dz = root.position.z - prevZ;
      const moving = dx * dx + dz * dz > 0.00002;
      if (moving) avatar.walkPhase += dt * 9;
      const weapon = getWeapon(avatar.weaponId ?? 'knife');
      animatePlayer(avatar.rig, avatar.walkPhase, 0, moving, avatar.grounded, dt, weapon);
    }
  }

  private damageEnemy(e: Enemy, dmg: number, remote = false): EnemyType | null {
    e.hp = Math.max(0, e.hp - dmg);
    e.hpShowUntil = performance.now() + 2000;
    const killed = e.hp <= 0;
    if (!remote && e.netId > 0) this.onEnemyHitCb?.(e.netId, dmg, killed);
    if (killed) {
      const type = e.type;
      if (e.netId > 0) this.killedNetIds.add(e.netId);
      this.removeEnemyVisual(e);
      return type;
    }
    return null;
  }

  private spawnEnemy(): void {
    if (this.guestMode) return;
    const type = pickEnemyType(this.wave);
    const hp = Math.round(enemyHp(type, this.wave) * this.enemyHpMultiplier);
    const x = (Math.random() - 0.5) * (this.pathHalfW - 1.2) * 2;
    const z = this.pathEndZ + Math.random() * 2;
    const netId = this.nextNetId++;
    this.placeEnemy(type, netId, x, z, hp, hp);
    this.onEnemySpawnCb?.({ id: netId, type, x, z, hp, hpMax: hp });
  }

  private placeEnemy(
    type: EnemyType,
    netId: number,
    x: number,
    z: number,
    hp: number,
    hpMax: number,
  ): Enemy {
    const e = buildEnemy(type, () => undefined, () => undefined);
    e.netId = netId;
    e.hp = hp;
    e.hpMax = hpMax;
    e.speed = BASE_ZOMBIE_SPEED * ENEMY_DEFS[type].speedFactor * nightSpeedMul(this.wave);
    e.hpShowUntil = performance.now() + 2000;
    e.root.position.set(x, 0, z);
    this.scene.add(e.root);
    this.enemies.push(e);

    const bar = document.createElement('div');
    bar.className = 'zombie-hp-bar';
    bar.innerHTML = '<div class="zombie-hp-fill"></div>';
    this.hpBarsLayer.append(bar);
    this.hpBarEls.set(e, bar);
    return e;
  }

  private removeEnemyVisual(e: Enemy): void {
    disposeObject3D(e.root);
    this.scene.remove(e.root);
    this.hpBarEls.get(e)?.remove();
    this.hpBarEls.delete(e);
    this.enemies = this.enemies.filter((x) => x !== e);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
