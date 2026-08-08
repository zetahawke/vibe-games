# Co-op Room Bus — Design Spec

**Date:** 2026-08-08  
**Status:** Approved for planning  
**Supersedes:** ad-hoc sync in `realtimeChannel.ts` (`hello` / `start` / `tick` / `hits` + Presence-as-game-state)

---

## 1. Goal

Online co-op (2–4) must share one Realtime topic. Each client publishes what it owns; everyone else applies that to World + HUD. The host is the only simulator of waves and enemies. Joining the Postgres room (4-digit code) already works; this spec is the **in-match sync**, not session create/join APIs.

Success looks like: both windows same wave/phase/timer; both see each other’s avatars; guest HP bars follow host mobs; guest score/coins appear on host panel; guest can start a match the host already started.

---

## 2. Authority

| Concern | Owner |
|---------|--------|
| Wave, phase, timer, fort lives, spawn/move/HP of mobs | Host |
| Own avatar pose, weapon, personal score/coins/lives display | Each player |
| Applying guest shots to mobs | Host (`hit` → `applyRemoteHit`) |
| Session lifetime | Host leave ends the room (DB + guests exit) |

Guests never run `tickWave` or local enemy spawn. If payloads later get too large, split `match` (clock vs mobs) — do not split until measured.

---

## 3. Transport

- **One** `RealtimeClient` with anon `apikey` only (`getRealtime()`). No `createClient` / Auth `accessToken` on this socket (that opened a second `?token=` WS and dropped the joined channel).
- Topic: `jdc-room-{4-digit}` (Realtime prefixes `realtime:`).
- Subscribe **before** any send. Wait until status `SUBSCRIBED` and `channel.state === 'joined'`.
- `channel.send({ type: 'broadcast', event, payload })` **only** when `state === 'joined'`. Never call `send` when it would REST-fallback. One optional `httpSend` for the first host `match` after start (guest bootstrap if a WS frame was missed).
- Presence: `track({ playerId, name, is_host })` only as “who is connected” / host-left. **Not** the source of pose, score, or `started`.
- Drop only a stale channel with the **same** room topic; do not `removeAllChannels()` (that disconnects the shared socket).

Chrome Network: a single WS with status `101` and Time “Pending” is normal (connection still open).

---

## 4. Events

All payloads are JSON objects (Realtime rejects bare arrays).

### `peer` — every client, ~200 ms

```ts
{
  playerId: string;
  name: string;
  is_host: boolean;
  started: boolean;
  x: number;
  z: number;
  rotY: number;
  weapon: string;
  score: number;
  lives: number;
  coins: number;
}
```

### `match` — host only, ~200 ms in wave / ~500 ms in rest

Includes bootstrap fields so there is no separate `start` event:

```ts
{
  subject: string;
  grade: string;
  englishGrade: string;
  pathHalfW: number;
  w: number;                 // wave
  p: 'w' | 'r';              // wave | rest
  t: number;                 // phaseTimeLeftMs
  s: 'p' | 'g';              // playing | gameover
  l: number;                 // fort lives
  m: MobTuple[];             // [id, typeIndex, x, z, hp, hpMax]
}
```

### `hit` — guest on shot (seq window, max ~20)

```ts
{ playerId: string; hits: Array<{ seq: number; netId: number; dmg: number }> }
```

---

## 5. Modules

| File | Responsibility |
|------|----------------|
| `src/lib/supabase.ts` | `getRealtime()` singleton (already) |
| `src/domain/online/roomBus.ts` | connect / leave / `send` / `on` / presence leave |
| `src/domain/online/matchStore.ts` | Merge peers + last match; `shouldGuestStart`; hit seq |
| `src/domain/online/netParse.ts` | `parseMatch`, `packMobs` / `unpackMobs` (keep) |
| `src/domain/online/enemySync.ts` | Tombstones (keep) |
| `src/domain/online/hitSeq.ts` | `takeNewHits` (keep) |
| `src/game/OnlineGameSession.ts` | Lobby UI; publish loop; apply store → World/HUD |

Delete or stop using: `hello` / `start` / `tick` publishers, `netSend` REST pump for hello/tick, `channelAdapter.push` bypass.

World and HUD do not import Realtime. They receive parsed snapshots / peer rows.

---

## 6. Apply rules

| Data | Event | Who applies |
|------|--------|-------------|
| Remote avatars + weapon | `peer` | All except self → `upsertRemotePlayer` |
| Coop panel (name, ♥, coins, score) | `peer` | All, from store |
| Wave / phase / timer / fort lives | `match` | Guest writes `waves` + HUD |
| Mob HP bars + positions | `match.m` | Guest `applyEnemySnapshot` + tombstones |
| Guest damage | `hit` | Host only; others see result on next `match` |

Guest starts when store has a `match` with `subject` + `grade` and local game not initialized.

Lobby lists store peers (from `peer` events). Host may start solo. If host Presence leave (or no `match` for ~4 s after guest has started), guest exits.

---

## 7. Error handling

- Subscribe `TIMED_OUT` / `CHANNEL_ERROR` → status `error`, Spanish “Sin conexión”.
- Host leave → guest `dispose` (existing leave/close APIs).
- Send while not joined → drop (except one `httpSend` of `match` at host begin).
- Do not invent wave progress on the guest.

---

## 8. Testing

- `matchStore`: merge peers (started OR); guest start from first valid `match`; hit seq ignores duplicates.
- `parseMatch`: compact clock + mobs + subject/grade; reject missing grade.
- `roomBus` with fake channel: no `send` before `joined`; after subscribe, `send` called with `{ type: 'broadcast', event, payload }`.
- Keep existing `packMobs` / `takeNewHits` / `reconcileEnemySnapshot` tests.

---

## 9. Out of scope

- Server-authoritative simulation  
- Splitting `match` into clock vs mobs (until size is a problem)  
- Admin dashboard, PIN/identity, session create/join APIs  
- Saving online runs locally  

---

## 10. Constraints (project-wide)

- UI copy in Spanish; code identifiers in English.  
- Offline solo play unchanged (`GameSession` without RoomBus).  
- Anon key: Realtime only, no DB writes from the browser.  
- Max 4 players / 6 open sessions remain API concerns.  
