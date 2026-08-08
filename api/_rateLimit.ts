import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function checkLimit(
  ip: string,
  endpoint: string,
  limit = 20,
): Promise<boolean> {
  const key = `rl:${endpoint}:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= limit;
}
