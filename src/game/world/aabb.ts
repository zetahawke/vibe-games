export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function overlaps(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}

export function aabbFromCenter(x: number, z: number, half: number): AABB {
  return { minX: x - half, maxX: x + half, minZ: z - half, maxZ: z + half };
}
