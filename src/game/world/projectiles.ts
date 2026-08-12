import * as THREE from 'three';
import type { EnemyType } from '@/domain/waves/enemyConfig';
import type { WeaponDef } from '@/domain/weapons/weapons';
import type { Enemy } from './enemy';

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  visualOnly?: boolean;
}

const randomizeWeaponDamage = (damage: number) => {
  return Math.floor(Math.random() * (Math.floor(damage * 1.4) - Math.floor(damage * 0.6) + 1) + Math.floor(damage * 0.6));
};

export function spawnProjectiles(
  scene: THREE.Scene,
  origin: THREE.Vector3,
  aim: THREE.Vector3,
  equipped: WeaponDef,
  opts?: { spreadScale?: number },
): Projectile[] {
  const kind = equipped.kind;
  const count = kind === 'shotgun' ? 10 : 1;
  const spread = (kind === 'shotgun' ? 0.12 : 0.01) * (opts?.spreadScale ?? 1);
  const speed = kind === 'rifle' ? 55 : kind === 'bow' ? 40 : kind === 'shotgun' ? 42 : 48;
  const damage = randomizeWeaponDamage(equipped.damage);
  const pelletDamage = kind === 'shotgun' ? Math.ceil(damage / count) : damage;
  const created: Projectile[] = [];

  for (let i = 0; i < count; i++) {
    const dir = aim.clone();
    dir.x += (Math.random() - 0.5) * spread;
    dir.y += (Math.random() - 0.5) * spread * 0.5;
    dir.z += (Math.random() - 0.5) * spread;
    dir.normalize();
    const mat = new THREE.MeshStandardMaterial({
      color: kind === 'bow' ? 0xc8a050 : kind === 'rifle' ? 0xffe066 : 0xffcc33,
      emissive: kind === 'bow' ? 0x664400 : 0xaa7700,
      metalness: 0.2,
      roughness: 0.4,
    });
    const mesh = kind === 'bow'
      ? new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.55), mat)
      : new THREE.Mesh(new THREE.SphereGeometry(kind === 'shotgun' ? 0.08 : 0.07, 6, 6), mat);
    if (kind === 'bow') {
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    }
    mesh.position.copy(origin).addScaledVector(dir, 0.25);
    scene.add(mesh);
    created.push({
      mesh,
      velocity: dir.multiplyScalar(speed),
      damage: pelletDamage,
      life: equipped.range / speed + 0.15,
    });
  }
  return created;
}

export function updateProjectiles(
  scene: THREE.Scene,
  projectiles: Projectile[],
  enemies: Enemy[],
  dt: number,
  onHit: (e: Enemy, damage: number) => EnemyType | null,
): { remaining: Projectile[]; kills: EnemyType[] } {
  const kills: EnemyType[] = [];
  const remaining: Projectile[] = [];
  for (const p of projectiles) {
    p.life -= dt;
    p.mesh.position.addScaledVector(p.velocity, dt);
    let hit = false;
    if (!p.visualOnly) {
      for (const e of enemies) {
        const d = p.mesh.position.distanceTo(e.root.position.clone().setY(1.2));
        if (d < 1.1) {
          const type = onHit(e, p.damage);
          if (type) kills.push(type);
          hit = true;
          break;
        }
      }
    }
    if (hit || p.life <= 0) {
      scene.remove(p.mesh);
    } else {
      remaining.push(p);
    }
  }
  return { remaining, kills };
}

export function clearProjectiles(scene: THREE.Scene, projectiles: Projectile[]): void {
  for (const p of projectiles) scene.remove(p.mesh);
}
