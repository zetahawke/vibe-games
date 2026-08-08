import * as THREE from 'three';
import type { WeaponDef } from '@/domain/weapons/weapons';
import type { Enemy } from './enemy';

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
}

export function spawnProjectiles(
  scene: THREE.Scene,
  origin: THREE.Vector3,
  aim: THREE.Vector3,
  equipped: WeaponDef,
): Projectile[] {
  const kind = equipped.kind;
  const count = kind === 'shotgun' ? 5 : 1;
  const spread = kind === 'shotgun' ? 0.12 : 0.01;
  const speed = kind === 'rifle' ? 55 : kind === 'shotgun' ? 42 : 48;
  const pelletDamage = kind === 'shotgun' ? Math.ceil(equipped.damage / count) : equipped.damage;
  const created: Projectile[] = [];

  for (let i = 0; i < count; i++) {
    const dir = aim.clone();
    dir.x += (Math.random() - 0.5) * spread;
    dir.y += (Math.random() - 0.5) * spread * 0.5;
    dir.z += (Math.random() - 0.5) * spread;
    dir.normalize();
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(kind === 'shotgun' ? 0.08 : 0.07, 6, 6),
      new THREE.MeshStandardMaterial({
        color: kind === 'rifle' ? 0xffe066 : 0xffcc33,
        emissive: 0xaa7700,
        metalness: 0.2,
        roughness: 0.4,
      }),
    );
    // Start at the muzzle; tiny forward nudge avoids clipping into the arm mesh.
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
  onHit: (e: Enemy, damage: number) => number,
): { remaining: Projectile[]; kills: number } {
  let kills = 0;
  const remaining: Projectile[] = [];
  for (const p of projectiles) {
    p.life -= dt;
    p.mesh.position.addScaledVector(p.velocity, dt);
    let hit = false;
    for (const e of enemies) {
      const d = p.mesh.position.distanceTo(e.root.position.clone().setY(1.2));
      if (d < 1.1) {
        kills += onHit(e, p.damage);
        hit = true;
        break;
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
