// Backwards-compatible re-exports — prefer importing from './enemy' directly.
export {
  BASE_ZOMBIE_SPEED,
  buildEnemy as buildZombie,
  animateEnemyWalk as animateZombieWalk,
  type Enemy as Zombie,
} from './enemy';
