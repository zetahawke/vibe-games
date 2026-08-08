# Co-op Room Bus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragmented hello/start/tick/hits sync with a host-authoritative RoomBus (`peer` / `match` / `hit`) so both clients share avatars, HUD stats, wave progress, and mob HP.

**Architecture:** One anon-key RealtimeClient; subscribe then send. Pure `matchStore` holds peers + last match. `OnlineGameSession` publishes what it owns and applies the store to World/HUD. Guests never simulate waves.

**Tech Stack:** TypeScript, Vite, Vitest, `@supabase/supabase-js` RealtimeClient, Three.js World/HUD

## Global Constraints

- UI text in Spanish; code identifiers in English.
- `npx vitest run` and `npx tsc --noEmit` pass after each task.
- Anon key is Realtime-only; no browser DB writes.
- Offline `GameSession` unchanged.
- Do not call `channel.send` unless `channel.state === 'joined'`.
- One topic: `jdc-room-{4 digits}`.
- Spec: `docs/superpowers/specs/2026-08-08-coop-room-bus-design.md`.

---

## File map

| File | Role |
|------|------|
| Create `src/domain/online/matchStore.ts` | Peers + match snapshot + guest-start + hit seq |
| Create `src/domain/online/roomBus.ts` | Channel lifecycle + typed send/on |
| Modify `src/domain/online/netParse.ts` | `parseMatch` combining clock + mobs + subject/grade |
| Modify `src/game/OnlineGameSession.ts` | Use RoomBus + store; drop old publishers |
| Delete or gut `src/domain/online/realtimeChannel.ts` | Re-export types that World still needs, or move `NetPeer`/`EnemyNetState` to `netParse` |
| Delete `src/domain/online/netSend.ts` | Replaced by roomBus send rules |
| Tests: `tests/matchStore.test.ts`, `tests/roomBus.test.ts`, update `tests/netParse.test.ts`, replace `tests/realtimeChannel.test.ts` / `tests/netSend.test.ts` |

Keep: `enemySync.ts`, `hitSeq.ts`, `sessionService.ts`, `playerService.ts`, `netStatus.ts`, `getRealtime()`.

---

### Task 1: Match store (pure)

**Files:**
- Create: `src/domain/online/matchStore.ts`
- Test: `tests/matchStore.test.ts`

**Interfaces:**
- Produces:

```typescript
export interface PeerState {
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

export interface MatchSnapshot {
  subject: string;
  grade: string;
  englishGrade: string;
  pathHalfW: number;
  wave: number;
  phase: 'wave' | 'rest';
  phaseTimeLeftMs: number;
  status: 'playing' | 'gameover';
  lives: number;
  enemies: Array<{ id: number; type: string; x: number; z: number; hp: number; hpMax: number }>;
}

export function createMatchStore(selfId: string): {
  applyPeer(peer: PeerState): void;
  applyMatch(match: MatchSnapshot): void;
  peers(): PeerState[];
  match(): MatchSnapshot | null;
  shouldGuestStart(): MatchSnapshot | null;
  takeHitsForHost(playerId: string, hits: import('./hitSeq').SeqHit[]): import('./hitSeq').SeqHit[];
};
```

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { createMatchStore, type PeerState } from '@/domain/online/matchStore';

function peer(over: Partial<PeerState> & Pick<PeerState, 'playerId' | 'name'>): PeerState {
  return {
    is_host: false, started: false, x: 0, z: 8, rotY: 0,
    weapon: 'knife', score: 0, lives: 3, coins: 0, ...over,
  };
}

describe('createMatchStore', () => {
  it('ORs started when the same peer updates', () => {
    const s = createMatchStore('me');
    s.applyPeer(peer({ playerId: 'g', name: 'hija', started: true, x: 1 }));
    s.applyPeer(peer({ playerId: 'g', name: 'hija', started: false, x: 4 }));
    expect(s.peers()).toHaveLength(1);
    expect(s.peers()[0]?.started).toBe(true);
    expect(s.peers()[0]?.x).toBe(4);
  });

  it('tells a guest to start from the first match with subject and grade', () => {
    const s = createMatchStore('g');
    expect(s.shouldGuestStart()).toBeNull();
    s.applyMatch({
      subject: 'math', grade: '5th', englishGrade: '7th', pathHalfW: 3,
      wave: 1, phase: 'rest', phaseTimeLeftMs: 8000, status: 'playing', lives: 3, enemies: [],
    });
    expect(s.shouldGuestStart()?.subject).toBe('math');
    s.markGuestStarted();
    expect(s.shouldGuestStart()).toBeNull();
  });

  it('returns only new hit seqs per player', () => {
    const s = createMatchStore('host');
    const first = s.takeHitsForHost('g', [{ seq: 1, netId: 9, dmg: 10 }, { seq: 2, netId: 9, dmg: 10 }]);
    expect(first.map((h) => h.seq)).toEqual([1, 2]);
    const again = s.takeHitsForHost('g', [{ seq: 2, netId: 9, dmg: 10 }, { seq: 3, netId: 8, dmg: 5 }]);
    expect(again.map((h) => h.seq)).toEqual([3]);
  });
});
```

Add `markGuestStarted()` to the store interface (guest flipped local flag after `beginWithSave`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/matchStore.test.ts`

Expected: FAIL — cannot resolve `@/domain/online/matchStore`

- [ ] **Step 3: Write minimal implementation**

Implement `createMatchStore` using a `Map` of peers, `mergePresencePeers`-style OR for `started`/`is_host`, last-write for pose/stats, `takeNewHits` from `hitSeq.ts` for host hits, and a `guestStarted` boolean.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/matchStore.test.ts`

Expected: PASS

- [ ] **Step 5: Commit** (only if the user asked to commit)

```bash
git add src/domain/online/matchStore.ts tests/matchStore.test.ts
git commit -m "feat(coop): add host-authoritative match store"
```

---

### Task 2: `parseMatch` on netParse

**Files:**
- Modify: `src/domain/online/netParse.ts`
- Test: `tests/netParse.test.ts`

**Interfaces:**
- Consumes: existing `unpackMobs`, `parseClockTick`, `parseMatchStart`
- Produces: `parseMatch(raw: unknown): MatchSnapshot | null` — null if subject/grade missing (guest cannot start) OR if clock fields missing after start; for host ticks always include subject+grade+clock+mobs.

Prefer one function that requires subject, grade, and timer (`t` / `phaseTimeLeftMs`). Reuse `unpackMobs` + clock field mapping. Export `MatchSnapshot` from `matchStore` or define a shared type in `netParse` and import it in the store — pick **one**: put `MatchSnapshot` + `PeerState` in `netParse.ts` OR in `matchStore.ts` and import from tests/session. Spec store types live in `matchStore.ts`; `parseMatch` returns `MatchSnapshot` imported from there (watch circular imports). Safer: keep snapshot types in `netParse.ts`, store imports them.

If Task 1 already defined types in `matchStore.ts`, either move types to `netParse.ts` in this task or have `parseMatch` return a structural type compatible with `MatchSnapshot`.

- [ ] **Step 1: Write failing tests** in `tests/netParse.test.ts`

```typescript
import { parseMatch } from '@/domain/online/netParse';

it('parses compact match including subject and mobs', () => {
  const m = parseMatch({
    subject: 'math', grade: '5th', englishGrade: '7th', pathHalfW: 3,
    w: 2, p: 'r', t: 8000, s: 'p', l: 3,
    m: [[2, 0, 1, 4, 20, 20]],
  });
  expect(m?.wave).toBe(2);
  expect(m?.phase).toBe('rest');
  expect(m?.enemies).toEqual([{ id: 2, type: 'zombie', x: 1, z: 4, hp: 20, hpMax: 20 }]);
});

it('rejects match without grade', () => {
  expect(parseMatch({ subject: 'math', w: 1, p: 'w', t: 1000, s: 'p', l: 3, m: [] })).toBeNull();
});
```

- [ ] **Step 2: Run** `npx vitest run tests/netParse.test.ts` — Expected: FAIL `parseMatch` is not a function

- [ ] **Step 3: Implement** `parseMatch` wrapping `parseMatchStart` + `parseClockTick` + `unpackMobs`; return null if either start or clock is null.

- [ ] **Step 4: Run** `npx vitest run tests/netParse.test.ts` — Expected: PASS

- [ ] **Step 5: Commit** if requested: `feat(coop): parse unified match broadcast`

---

### Task 3: RoomBus

**Files:**
- Create: `src/domain/online/roomBus.ts`
- Test: `tests/roomBus.test.ts`
- Keep: `src/lib/supabase.ts` `getRealtime()`

**Interfaces:**
- Consumes: `getRealtime()`, `normalizeRoomCode` / `matchingRealtimeChannels` (move these two helpers into `roomBus.ts` or a tiny `roomTopic.ts` so `realtimeChannel.ts` can die later)
- Produces:

```typescript
export type RoomEvent = 'peer' | 'match' | 'hit';

export interface RoomBus {
  readonly status: 'connecting' | 'online' | 'error';
  send(event: RoomEvent, payload: Record<string, unknown>): void;
  on(event: RoomEvent, handler: (payload: unknown) => void): void;
  onPresenceLeave(handler: (left: Array<{ is_host?: boolean; playerId?: string }>) => void): void;
  leave(): void;
}

export async function connectRoom(opts: {
  code: string | number;
  playerId: string;
  name: string;
  isHost: boolean;
}): Promise<RoomBus>;
```

Send implementation:

```typescript
send(event, payload) {
  if (channel.state !== 'joined') return;
  void channel.send({ type: 'broadcast', event, payload });
}
```

Optional: `sendMatchBootstrap(payload)` once via `channel.httpSend('match', payload)` from host `beginWithSave` only.

`connectRoom`: remove same-topic channels, `channel(topic, { broadcast: { ack: false, self: false }, presence: { key: playerId, enabled: true } })`, register `.on('broadcast', { event: 'peer'|'match'|'hit' })`, `.on('presence', { event: 'leave' })`, `subscribe` → on `SUBSCRIBED` `track({ playerId, name, is_host })` then resolve.

- [ ] **Step 1: Failing test** — fake client like `tests/realtimeChannel.test.ts`, assert `send('peer', { x: 1 })` does **not** call `channel.send` before subscribe callback, and **does** after status joined:

```typescript
it('does not send before the channel is joined', async () => {
  let joined = false;
  const sends: unknown[] = [];
  const ch = {
    state: 'joining' as string,
    send: vi.fn(async (args: unknown) => { sends.push(args); }),
    httpSend: vi.fn(),
    on: vi.fn(function (this: unknown) { return this; }),
    subscribe: vi.fn((cb: (s: string) => void) => {
      ch.state = 'joined';
      joined = true;
      cb('SUBSCRIBED');
      return ch;
    }),
    track: vi.fn(async () => 'ok'),
    topic: 'realtime:jdc-room-0012',
  };
  // mock getRealtime to return { channel: () => ch, getChannels: () => [], removeChannel: async () => 'ok' }
  const bus = await connectRoom({ code: '12', playerId: 'p1', name: 'papa', isHost: true });
  expect(joined).toBe(true);
  bus.send('peer', { playerId: 'p1', name: 'papa' });
  expect(ch.send).toHaveBeenCalledWith({
    type: 'broadcast',
    event: 'peer',
    payload: { playerId: 'p1', name: 'papa' },
  });
});

it('drops send while not joined', async () => {
  // after leave(), or state forced to closed
});
```

Also port `matchingRealtimeChannels` test here (or keep a 5-line `roomTopic.ts`).

- [ ] **Step 2: Run** `npx vitest run tests/roomBus.test.ts` — Expected: FAIL

- [ ] **Step 3: Implement** `connectRoom` / `RoomBus`

- [ ] **Step 4: Run** `npx vitest run tests/roomBus.test.ts` — Expected: PASS

- [ ] **Step 5: Commit** if requested: `feat(coop): add RoomBus subscribe-then-send`

---

### Task 4: Wire OnlineGameSession

**Files:**
- Modify: `src/game/OnlineGameSession.ts`
- Modify: `src/game/world/World.ts` only if apply signatures need nothing (prefer no World change)

**Interfaces:**
- Consumes: `connectRoom`, `createMatchStore`, `parseMatch`, `parsePeer` (small helper next to store or in netParse), `takeNewHits` via store

Replace `joinChannel` + `publishPresence` / `publishWorld` / `publishStart` / `publishHits`.

Constructor:

```typescript
this.store = createMatchStore(playerId);
void this.connectRealtime(username, isHost);
```

`connectRealtime`:

```typescript
this.bus = await connectRoom({ code: this.code, playerId: this.playerId, name: username, isHost });
this.netStatus = 'online';
this.bus.on('peer', (raw) => {
  const p = parsePeer(raw);
  if (!p) return;
  this.store.applyPeer(p);
  this.onStorePeers();
});
this.bus.on('match', (raw) => {
  const m = parseMatch(raw);
  if (!m) return;
  this.store.applyMatch(m);
  if (!this.isHost && !this.gameInitialized) {
    const start = this.store.shouldGuestStart();
    if (start) {
      this.store.markGuestStarted();
      this.startAsGuest(start);
    }
  }
  this.applyMatchToGuest(m);
});
this.bus.on('hit', (raw) => { /* host only: store.takeHitsForHost + world.applyRemoteHit */ });
this.bus.onPresenceLeave((left) => {
  if (!this.isHost && left.some((p) => p.is_host)) this.handleHostLeft();
});
this.publishInterval = setInterval(() => this.publish(), 200);
this.refreshLobbyList?.();
```

`publish()`:

```typescript
this.bus.send('peer', { /* self pose + score + started: this.gameInitialized */ });
if (!this.isHost && this.localHits.length) {
  this.bus.send('hit', { playerId: this.playerId, hits: this.localHits });
}
if (this.isHost && this.gameInitialized && this.save) {
  this.bus.send('match', {
    subject: this.save.subject, grade: this.save.grade,
    englishGrade: this.save.englishGrade, pathHalfW: this.save.pathHalfW,
    w: this.waves.wave, p: this.waves.phase === 'rest' ? 'r' : 'w',
    t: Math.round(this.waves.phaseTimeLeftMs),
    s: this.waves.status === 'gameover' ? 'g' : 'p',
    l: this.waves.lives,
    m: packMobs(this.world?.getEnemySnapshot() ?? []),
  });
}
```

On host `beginWithSave`, also `httpSend` once if `RoomBus` exposes `sendBootstrap('match', payload)` (first match only).

Guest `applyMatchToGuest`: same as current `onClock` + `onMobs` (skip mob apply during rest). Coop panel reads `this.store.peers()`. Remotes: `upsertRemotePlayer` for every peer except self when `started || gameInitialized`.

Lobby list: `this.store.peers()` instead of `this.peers` Map (or keep Map synced in `onStorePeers`).

- [ ] **Step 1: Manual/typecheck first** — after edits run `npx tsc --noEmit`. There is no full OnlineGameSession unit test; add a tiny test for “guest start decision” already covered by store.

- [ ] **Step 2: Remove imports** of `joinChannel`, `publishWorld`, `publishStart`, `publishHits`, `publishPresence`.

- [ ] **Step 3: Run** `npx vitest run && npx tsc --noEmit` — Expected: PASS

- [ ] **Step 4: Manual test plan**

1. Hard-refresh two windows (not HMR).
2. Login papa / hija (same or different passwords).
3. Host creates room; guest joins code.
4. Both lobby lists show both names before Comenzar.
5. Network → WS: one `websocket?apikey` 101 Pending. Almost no `hello`/`tick` fetch.
6. Host starts: guest leaves waiting screen within ~1 s; same subject path.
7. Combat: timers within ~0.3 s; both see the other avatar; guest shooting reduces host mob HP (and guest bar follows next match).
8. Host leave: guest returns / session ends.

- [ ] **Step 5: Commit** if requested: `feat(coop): drive session from RoomBus match store`

---

### Task 5: Remove dead sync paths

**Files:**
- Delete: `src/domain/online/netSend.ts`, `tests/netSend.test.ts`
- Delete or slim: `src/domain/online/realtimeChannel.ts`, `tests/realtimeChannel.test.ts`
- Move `EnemyNetState` / any World-facing types to `netParse.ts` if still imported from `realtimeChannel.ts`

Grep the repo for `publishWorld`, `joinChannel`, `planBroadcast`, `combineNetPeers`, `from '@/domain/online/realtimeChannel'`. Update imports.

- [ ] **Step 1: Grep and fix all imports**

- [ ] **Step 2: Run** `npx vitest run && npx tsc --noEmit` — Expected: PASS (no missing modules)

- [ ] **Step 3: Commit** if requested: `refactor(coop): drop hello/start/tick send paths`

---

## Spec coverage

| Spec section | Task |
|--------------|------|
| Host authority / guest no tickWave | Task 4 (`advancesWaveLocally` stays host-only) |
| One RealtimeClient, no Auth token WS | Already `getRealtime`; Task 3 must not add `accessToken` |
| Events peer / match / hit | Tasks 3–4 |
| Match includes start fields | Task 2 + 4 |
| Presence only for host-left | Task 3 track slim + leave handler |
| matchStore + parseMatch + roomBus tests | Tasks 1–3 |
| No send before joined | Task 3 |
| Out of scope admin/PIN/save | Not tasked |

## Placeholder / type check

- Types: `PeerState`, `MatchSnapshot`, `RoomBus`, `connectRoom`, `parseMatch`, `createMatchStore`, `markGuestStarted` — used consistently above.
- No TBD sections.
