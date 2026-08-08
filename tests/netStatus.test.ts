import { describe, expect, it } from 'vitest';
import { netStatusLabel } from '@/domain/online/netStatus';

describe('netStatusLabel', () => {
  it('puts the room code next to online status', () => {
    expect(netStatusLabel('online', '78')).toBe('🟢 En línea · 0078');
  });
});
