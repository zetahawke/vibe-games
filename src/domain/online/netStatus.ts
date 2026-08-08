import type { RoomStatus } from './roomBus';

export function netStatusLabel(status: RoomStatus, code: string): string {
  const net = status === 'online' ? '🟢 En línea' : status === 'error' ? '🔴 Sin conexión' : '🟡 Conectando…';
  const room = String(code).replace(/\D/g, '').padStart(4, '0').slice(-4);
  return `${net} · ${room}`;
}
