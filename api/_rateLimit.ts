import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // rate limiting disabled — safe for local dev without Upstash
  }
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

export async function checkLimit(
  ip: string,
  endpoint: string,
  limit = 20,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // allow all when Upstash is not configured
  const key = `rl:${endpoint}:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= limit;
}
