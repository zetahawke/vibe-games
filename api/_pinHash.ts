import { createHash } from 'crypto';

export function hashPin(pin: string): string {
  return createHash('sha256').update(`jdc-2026:${pin}`).digest('hex');
}
