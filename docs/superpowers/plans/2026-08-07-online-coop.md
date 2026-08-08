# Online Co-op & Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time 2–4 player co-op sessions with a 4-digit join code, online leaderboards separated by player count, and an admin dashboard for season management and statistics.

**Architecture:** Supabase Realtime channels sync lightweight game state (wave, kills, lives, scores) between players. The Supabase anon key is used **only** for Realtime WebSocket connections — all database operations go through Vercel Serverless Functions (`api/`) using the server-only `SUPABASE_SERVICE_ROLE_KEY`. One player is the "host"; if the host disconnects, the session ends for all players immediately via Supabase Presence detection — there is no host handoff. The admin dashboard uses Supabase Auth (email/password) to issue JWTs that Vercel Functions verify server-side.

**Prerequisite:** QoL plan must be applied first (database schema migrations for seasons/sessions/scoreboard must exist).

**Tech Stack:** TypeScript, Supabase (`@supabase/supabase-js`), Vercel Serverless Functions (`@vercel/node`), Upstash Redis (`@upstash/redis`), Vite, Three.js

## Global Constraints

- All new identifiers in English.
- UI text in Spanish.
- `npx tsc --noEmit` — zero errors after each task.
- Max 6 concurrent online sessions enforced in the API layer.
- Cross-platform sessions enabled (desktop + mobile in same session).
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — browser-safe, used exclusively for Realtime WebSocket and Auth.
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_EMAIL` — server-only env vars, never prefixed with `VITE_`.
- RLS enabled on all tables; zero `anon` policies = deny all by default.
- Browser client never calls Supabase for database queries — only for Realtime and Auth.

---

### Task 1: Supabase Realtime client + API infrastructure

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `api/_supabase.ts`
- Create: `api/_rateLimit.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `getSupabase()` (Realtime + Auth browser client), `supabaseAdmin` (server-only DB client), `checkLimit(ip, endpoint, limit?): Promise<boolean>`

- [ ] **Step 1: Install dependencies**

```bash
npm install @supabase/supabase-js @vercel/node @upstash/redis
```

- [ ] **Step 2: Create `.env.example`**

```
# Supabase — public values, safe for browser (Realtime WebSocket + Auth only)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase — server-only (never VITE_-prefix these)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Supabase Auth user email (server-only)
ADMIN_EMAIL=admin@yourdomain.com

# Upstash Redis (server-only)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

- [ ] **Step 3: Create `src/lib/supabase.ts`** (Realtime + Auth only — no DB queries)

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

// Used only for Supabase Realtime broadcast channels and Supabase Auth.
// All database access goes through Vercel Functions via SUPABASE_SERVICE_ROLE_KEY.
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _client = createClient(url, key);
  }
  return _client;
}
```

- [ ] **Step 4: Create `api/_supabase.ts`** (server-only)

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
```

- [ ] **Step 5: Create `api/_rateLimit.ts`**

```typescript
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
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts api/_supabase.ts api/_rateLimit.ts .env.example
git commit -m "feat: add Supabase Realtime client and server-side API infra with rate limiting"
```

---

### Task 2: Player registration + Session API endpoints

**Files:**
- Create: `api/players/register.ts`
- Create: `api/players/verify.ts`
- Create: `api/session/create.ts`
- Create: `api/session/join.ts`
- Create: `api/session/close.ts`
- Create: `src/domain/online/playerService.ts`
- Create: `src/domain/online/sessionService.ts`
- Create: `tests/sessionService.test.ts` (mock-based)

**Interfaces:**
- Produces:
  - `POST /api/players/register { username }` → `{ playerId, sessionToken }`
  - `POST /api/players/verify { username, sessionToken }` → `{ playerId }`
  - `POST /api/session/create { playerId, sessionToken }` → `{ sessionId, code }`
  - `POST /api/session/join { playerId, sessionToken, code }` → `{ sessionId, playerCount }`
  - `POST /api/session/close { sessionId, playerId, sessionToken }` → `{ ok }`
  - `resolveIdentity(username): Promise<PlayerIdentity | { error }>`
  - `createSession(playerId, sessionToken): Promise<{ sessionId, code } | { error }>`
  - `joinSession(code, playerId, sessionToken): Promise<{ sessionId, playerCount } | { error }>`
  - `closeSession(sessionId, playerId, sessionToken): Promise<void>`
  - `MAX_SESSIONS = 6`

- [ ] **Step 1: Apply database migrations**

Run in the Supabase SQL editor:

```sql
-- players table: replaces inline player_name strings
create table players (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique,
  session_token  text not null,  -- UUID stored in client localStorage, proves ownership
  created_at     timestamptz not null default now(),
  last_seen      timestamptz not null default now()
);
alter table players enable row level security;
-- No anon policies = deny all by default

-- session_players table: replaces player_count integer in game_sessions
create table session_players (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references game_sessions(id) on delete cascade,
  player_id    uuid not null references players(id),
  is_host      boolean not null default false,
  joined_at    timestamptz not null default now(),
  left_at      timestamptz,
  unique(session_id, player_id)
);
alter table session_players enable row level security;
-- No anon policies = deny all by default

-- Remove player_count from game_sessions — derive it from session_players
alter table game_sessions drop column if exists player_count;

-- scoreboard_entries: replace player_name text with player_id uuid
alter table scoreboard_entries
  drop column if exists player_name,
  add column player_id uuid not null references players(id);
alter table scoreboard_entries enable row level security;
-- No anon policies = deny all by default
```

- [ ] **Step 2: Write tests (mock fetch)**

```typescript
// tests/sessionService.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('MAX_SESSIONS', () => {
  it('is 6', async () => {
    const { MAX_SESSIONS } = await import('@/domain/online/sessionService');
    expect(MAX_SESSIONS).toBe(6);
  });
});

describe('createSession (mocked fetch)', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns error when server responds 409', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'No hay sala disponible. Intenta más tarde.' }),
        { status: 409 },
      ),
    );
    const { createSession } = await import('@/domain/online/sessionService');
    const result = await createSession('player-id', 'token');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/sala/);
  });

  it('returns sessionId and code on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ sessionId: 'abc-123', code: '4567' }), { status: 200 }),
    );
    const { createSession } = await import('@/domain/online/sessionService');
    const result = await createSession('player-id', 'token');
    expect('sessionId' in result).toBe(true);
    if ('sessionId' in result) expect(result.code).toBe('4567');
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
npx vitest run tests/sessionService.test.ts
```

- [ ] **Step 4: Create `api/players/register.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/register', 10))) {
    res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }); return;
  }

  const { username } = req.body as { username?: string };
  if (!username || username.trim().length < 2 || username.trim().length > 20) {
    res.status(400).json({ error: 'Nombre de usuario inválido (2–20 caracteres).' }); return;
  }

  const sessionToken = randomUUID();

  const { data, error } = await supabaseAdmin
    .from('players')
    .insert({ username: username.trim(), session_token: sessionToken })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ese nombre ya está en uso.' }); return;
    }
    res.status(500).json({ error: error.message }); return;
  }

  res.status(200).json({ playerId: data.id, sessionToken });
}
```

- [ ] **Step 5: Create `api/players/verify.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/verify', 20))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { username, sessionToken } = req.body as { username?: string; sessionToken?: string };
  if (!username || !sessionToken) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  const { data, error } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) { res.status(401).json({ error: 'Credenciales inválidas.' }); return; }

  await supabaseAdmin
    .from('players')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', data.id);

  res.status(200).json({ playerId: data.id });
}
```

- [ ] **Step 6: Create `api/session/create.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

const MAX_SESSIONS = 6;

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/create'))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { playerId, sessionToken } = req.body as { playerId?: string; sessionToken?: string };
  if (!playerId || !sessionToken) { res.status(400).json({ error: 'Datos incompletos.' }); return; }

  // Verify player identity.
  const { data: player, error: playerErr } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (playerErr || !player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  // Enforce session cap.
  const { count, error: countErr } = await supabaseAdmin
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');
  if (countErr) { res.status(500).json({ error: countErr.message }); return; }
  if ((count ?? 0) >= MAX_SESSIONS) {
    res.status(409).json({ error: 'No hay sala disponible. Intenta más tarde.' }); return;
  }

  // Generate a unique 4-digit code.
  let code = generateCode();
  for (let i = 0; i < 10; i++) {
    const { data: existing } = await supabaseAdmin
      .from('game_sessions')
      .select('id')
      .eq('code', code)
      .eq('status', 'open')
      .maybeSingle();
    if (!existing) break;
    code = generateCode();
  }

  // Insert session.
  const { data: session, error: insertErr } = await supabaseAdmin
    .from('game_sessions')
    .insert({ code, status: 'open' })
    .select('id')
    .single();
  if (insertErr || !session) { res.status(500).json({ error: 'Error creando sala.' }); return; }

  // Record host in session_players.
  await supabaseAdmin
    .from('session_players')
    .insert({ session_id: session.id, player_id: playerId, is_host: true });

  res.status(200).json({ sessionId: session.id, code });
}
```

- [ ] **Step 7: Create `api/session/join.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/join'))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { playerId, sessionToken, code } = req.body as {
    playerId?: string; sessionToken?: string; code?: string;
  };
  if (!playerId || !sessionToken || !code) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  // Verify player identity.
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (!player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  // Find open session.
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('game_sessions')
    .select('id')
    .eq('code', code)
    .eq('status', 'open')
    .single();
  if (sessionErr || !session) { res.status(404).json({ error: 'Sala no encontrada.' }); return; }

  // Count active players (left_at is null means still in session).
  const { count } = await supabaseAdmin
    .from('session_players')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .is('left_at', null);
  if ((count ?? 0) >= 4) { res.status(409).json({ error: 'La sala está llena.' }); return; }

  // Add player to session.
  await supabaseAdmin
    .from('session_players')
    .insert({ session_id: session.id, player_id: playerId, is_host: false });

  res.status(200).json({ sessionId: session.id, playerCount: (count ?? 0) + 1 });
}
```

- [ ] **Step 8: Create `api/session/close.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/close', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { sessionId, playerId, sessionToken } = req.body as {
    sessionId?: string; playerId?: string; sessionToken?: string;
  };
  if (!sessionId || !playerId || !sessionToken) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  // Verify player owns this identity AND is the host.
  const [{ data: player }, { data: hostEntry }] = await Promise.all([
    supabaseAdmin
      .from('players')
      .select('id')
      .eq('id', playerId)
      .eq('session_token', sessionToken)
      .single(),
    supabaseAdmin
      .from('session_players')
      .select('id')
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .eq('is_host', true)
      .single(),
  ]);
  if (!player || !hostEntry) { res.status(403).json({ error: 'No autorizado.' }); return; }

  await supabaseAdmin
    .from('game_sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', sessionId);

  res.status(200).json({ ok: true });
}
```

- [ ] **Step 9: Create `src/domain/online/playerService.ts`**

```typescript
const STORAGE_KEY_ID    = 'game_player_id';
const STORAGE_KEY_TOKEN = 'game_session_token';
const STORAGE_KEY_NAME  = 'game_username';

export interface PlayerIdentity {
  playerId: string;
  sessionToken: string;
  username: string;
}

// Resolves identity from localStorage or registers a new player.
// Called before any create/join session action.
export async function resolveIdentity(
  username: string,
): Promise<PlayerIdentity | { error: string }> {
  const storedId    = localStorage.getItem(STORAGE_KEY_ID);
  const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const storedName  = localStorage.getItem(STORAGE_KEY_NAME);

  // If we have a cached identity for this exact username, verify it is still valid.
  if (storedId && storedToken && storedName === username) {
    const verifyRes = await fetch('/api/players/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, sessionToken: storedToken }),
    });
    if (verifyRes.ok) {
      return { playerId: storedId, sessionToken: storedToken, username };
    }
    // Token revoked or username changed — clear cache and re-register.
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_NAME);
  }

  // Register as a new player.
  const registerRes = await fetch('/api/players/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const json = await registerRes.json() as { playerId?: string; sessionToken?: string; error?: string };
  if (!registerRes.ok) return { error: json.error ?? 'Error de registro.' };

  localStorage.setItem(STORAGE_KEY_ID,    json.playerId!);
  localStorage.setItem(STORAGE_KEY_TOKEN, json.sessionToken!);
  localStorage.setItem(STORAGE_KEY_NAME,  username);
  return { playerId: json.playerId!, sessionToken: json.sessionToken!, username };
}
```

- [ ] **Step 10: Create `src/domain/online/sessionService.ts`**

```typescript
export const MAX_SESSIONS = 6;

export async function createSession(
  playerId: string,
  sessionToken: string,
): Promise<{ sessionId: string; code: string } | { error: string }> {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, sessionToken }),
  });
  const json = await res.json() as { sessionId?: string; code?: string; error?: string };
  if (!res.ok) return { error: json.error ?? 'Error creando sala.' };
  return { sessionId: json.sessionId!, code: json.code! };
}

export async function joinSession(
  code: string,
  playerId: string,
  sessionToken: string,
): Promise<{ sessionId: string; playerCount: number } | { error: string }> {
  const res = await fetch('/api/session/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, playerId, sessionToken }),
  });
  const json = await res.json() as { sessionId?: string; playerCount?: number; error?: string };
  if (!res.ok) return { error: json.error ?? 'Sala no encontrada.' };
  return { sessionId: json.sessionId!, playerCount: json.playerCount! };
}

export async function closeSession(
  sessionId: string,
  playerId: string,
  sessionToken: string,
): Promise<void> {
  await fetch('/api/session/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, playerId, sessionToken }),
  });
}
```

- [ ] **Step 11: Run tests**

```bash
npx vitest run tests/sessionService.test.ts && npx tsc --noEmit
```

- [ ] **Step 12: Commit**

```bash
git add api/players/ api/session/ src/domain/online/playerService.ts src/domain/online/sessionService.ts tests/sessionService.test.ts
git commit -m "feat: player registration, session CRUD via Vercel Functions, fetch-based client service"
```

---

### Task 3: Realtime state sync channel with Presence

**Files:**
- Create: `src/domain/online/realtimeChannel.ts`

Each player publishes a lightweight "tick" payload every second with their current stats. The host also broadcasts wave transitions. Supabase Presence tracks all connected players. When the host's presence entry disappears, non-host clients immediately call `onHostLeft` — this triggers score recording and hub redirect without any host handoff or re-election.

**Interfaces:**
- Produces:
  - `PlayerTick { playerId, name, wave, kills, score, coins, lives, equippedWeapon }`
  - `WaveTick { wave, phase }`
  - `joinChannel(sessionId, playerId, name, isHost, onPlayerTick, onWaveTick, onHostLeft): RealtimeChannel`
  - `broadcastPlayerTick(channel, tick): void`
  - `broadcastWaveTick(channel, tick): void`
  - `leaveChannel(channel): void`

- [ ] **Step 1: Implement `src/domain/online/realtimeChannel.ts`**

```typescript
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export interface PlayerTick {
  playerId: string;
  name: string;
  wave: number;
  kills: number;
  score: number;
  coins: number;
  lives: number;
  equippedWeapon: string;
}

export interface WaveTick {
  wave: number;
  phase: 'wave' | 'rest';
}

interface PresenceState {
  playerId: string;
  name: string;
  is_host: boolean;
}

export function joinChannel(
  sessionId: string,
  playerId: string,
  name: string,
  isHost: boolean,
  onPlayerTick: (tick: PlayerTick) => void,
  onWaveTick: (tick: WaveTick) => void,
  onHostLeft: () => void,
): RealtimeChannel {
  const channel = getSupabase().channel(`session:${sessionId}`, {
    config: { presence: { key: playerId } },
  });

  channel
    .on('broadcast', { event: 'player_tick' }, ({ payload }) => {
      if ((payload as PlayerTick).playerId !== playerId) {
        onPlayerTick(payload as PlayerTick);
      }
    })
    .on('broadcast', { event: 'wave_tick' }, ({ payload }) => {
      onWaveTick(payload as WaveTick);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      // Non-host clients: if the host's presence entry leaves, end session immediately.
      if (!isHost) {
        const hostDeparted = (leftPresences as PresenceState[]).some((p) => p.is_host);
        if (hostDeparted) onHostLeft();
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ playerId, name, is_host: isHost });
      }
    });

  return channel;
}

export function broadcastPlayerTick(channel: RealtimeChannel, tick: PlayerTick): void {
  channel.send({ type: 'broadcast', event: 'player_tick', payload: tick });
}

export function broadcastWaveTick(channel: RealtimeChannel, tick: WaveTick): void {
  channel.send({ type: 'broadcast', event: 'wave_tick', payload: tick });
}

export function leaveChannel(channel: RealtimeChannel): void {
  channel.unsubscribe();
}
```

- [ ] **Step 2: Commit**

```bash
npx tsc --noEmit
git add src/domain/online/realtimeChannel.ts
git commit -m "feat: Realtime broadcast + Presence-based host departure detection"
```

---

### Task 4: Online lobby UI

**Files:**
- Create: `src/game/ui/screens/lobbyScreen.ts`

The lobby resolves the player's identity (register or verify via localStorage) before creating or joining. On create: shows the 4-digit code and a start button. On join: shows a numeric input. Both lead to starting an `OnlineGameSession`.

- [ ] **Step 1: Implement `src/game/ui/screens/lobbyScreen.ts`**

```typescript
import { el, clear } from '@/shared/dom';
import { createSession, joinSession } from '@/domain/online/sessionService';
import { resolveIdentity, type PlayerIdentity } from '@/domain/online/playerService';

export function renderLobbyScreen(
  root: HTMLElement,
  username: string,
  onStart: (
    sessionId: string,
    code: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
  ) => void,
  onCancel: () => void,
): void {
  clear(root);
  const section = el('section', { className: 'screen' });

  section.append(el('h1', {}, ['Juego en línea']));

  const createBtn = el('button', { type: 'button', className: 'btn primary' }, ['➕ Crear sala']);
  const joinBtn   = el('button', { type: 'button', className: 'btn' },         ['🔗 Unirse a sala']);
  const cancelBtn = el('button', { type: 'button', className: 'btn ghost' },   ['← Volver']);
  const msg = el('p', { className: 'error' }, ['']);

  createBtn.addEventListener('click', async () => {
    createBtn.disabled = true;
    msg.textContent = 'Verificando identidad…';
    const identity = await resolveIdentity(username);
    if ('error' in identity) {
      msg.textContent = identity.error;
      createBtn.disabled = false;
      return;
    }
    msg.textContent = 'Creando sala…';
    const result = await createSession(identity.playerId, identity.sessionToken);
    if ('error' in result) {
      msg.textContent = result.error;
      createBtn.disabled = false;
      return;
    }
    showWaitingCode(result.sessionId, result.code, identity);
  });

  joinBtn.addEventListener('click', () => showJoinInput());
  cancelBtn.addEventListener('click', onCancel);

  section.append(el('div', { className: 'btn-col' }, [createBtn, joinBtn, cancelBtn]), msg);
  root.append(section);

  function showWaitingCode(sessionId: string, code: string, identity: PlayerIdentity): void {
    clear(root);
    const s = el('section', { className: 'screen' });
    s.append(
      el('h1', {}, ['Sala creada']),
      el('p', {}, ['Comparte este código con tus amigos:']),
      el('h2', { className: 'session-code' }, [code]),
      el('p', { className: 'muted' }, ['Esperando jugadores… (máx. 4)']),
    );
    const startBtn   = el('button', { type: 'button', className: 'btn primary' }, ['▶ Comenzar']);
    const cancelBtn2 = el('button', { type: 'button', className: 'btn ghost' },   ['Cancelar']);
    startBtn.addEventListener('click', () =>
      onStart(sessionId, code, identity.playerId, identity.sessionToken, 1, true),
    );
    cancelBtn2.addEventListener('click', onCancel);
    s.append(el('div', { className: 'btn-col' }, [startBtn, cancelBtn2]));
    root.append(s);
  }

  function showJoinInput(): void {
    clear(root);
    const s      = el('section', { className: 'screen' });
    const input  = el('input', { type: 'text', maxLength: '4', placeholder: '1234', className: 'session-code-input' }) as HTMLInputElement;
    const join2  = el('button', { type: 'button', className: 'btn primary' }, ['Unirse']);
    const errMsg = el('p', { className: 'error' }, ['']);
    const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);

    join2.addEventListener('click', async () => {
      join2.disabled = true;
      errMsg.textContent = 'Verificando identidad…';
      const identity = await resolveIdentity(username);
      if ('error' in identity) {
        errMsg.textContent = identity.error;
        join2.disabled = false;
        return;
      }
      errMsg.textContent = 'Uniéndose…';
      const result = await joinSession(input.value.trim(), identity.playerId, identity.sessionToken);
      if ('error' in result) {
        errMsg.textContent = result.error;
        join2.disabled = false;
        return;
      }
      onStart(result.sessionId, input.value.trim(), identity.playerId, identity.sessionToken, result.playerCount, false);
    });
    backBtn.addEventListener('click', () => renderLobbyScreen(root, username, onStart, onCancel));

    s.append(
      el('h1', {}, ['Unirse a sala']),
      el('p', {}, ['Ingresa el código de 4 dígitos:']),
      input, errMsg,
      el('div', { className: 'btn-col' }, [join2, backBtn]),
    );
    root.append(s);
  }
}
```

- [ ] **Step 2: Commit**

```bash
npx tsc --noEmit
git add src/game/ui/screens/lobbyScreen.ts
git commit -m "feat: online lobby UI with player identity resolution and session create/join"
```

---

### Task 5: OnlineGameSession + Score recording API

**Files:**
- Create: `src/game/OnlineGameSession.ts`
- Create: `api/scores/record.ts`
- Modify: `src/game/world/World.ts`

Wraps `GameSession` with online-specific overrides:
- Zombie spawn count ×`playerCount` (via `World.setSpawnMultiplier`)
- Enemy HP × `1 + (playerCount − 1) × 0.2` (via `World.setEnemyHpMultiplier`)
- Broadcasts player tick and wave tick every second
- Non-host clients defer to host's wave state from broadcast
- Host departure (detected by Presence) triggers score recording → hub redirect for non-host players
- On any exit: score recorded via `POST /api/scores/record` (no direct DB access from browser)
- Host explicitly closing calls `POST /api/session/close`

- [ ] **Step 1: Add multipliers to `World.ts`**

```typescript
private spawnMultiplier = 1;
private enemyHpMultiplier = 1;

setSpawnMultiplier(n: number): void {
  this.spawnMultiplier = Math.max(1, n);
}

setEnemyHpMultiplier(n: number): void {
  this.enemyHpMultiplier = Math.max(1, n);
}
```

In the spawn timer block, spawn `spawnMultiplier` enemies per tick:

```typescript
if (this.spawnTimer <= 0) {
  for (let i = 0; i < this.spawnMultiplier; i++) {
    this.spawnEnemy();
  }
  this.spawnTimer = spawnInterval(this.wave);
}
```

In `spawnEnemy()`, multiply base HP by the enemy HP multiplier:

```typescript
const hp = baseHp(this.wave) * this.enemyHpMultiplier;
```

- [ ] **Step 2: Create `api/scores/record.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'scores/record', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const {
    sessionId, playerId, sessionToken,
    personalScore, coinsEarned, lastWeapon, subject, grade,
  } = req.body as {
    sessionId?: string; playerId?: string; sessionToken?: string;
    personalScore?: number; coinsEarned?: number; lastWeapon?: string;
    subject?: string; grade?: string;
  };

  if (!sessionId || !playerId || !sessionToken) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  // Verify player identity.
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (!player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  // Derive player count from session_players at time of recording.
  const { count: playerCount } = await supabaseAdmin
    .from('session_players')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  const { error } = await supabaseAdmin.from('scoreboard_entries').insert({
    session_id:     sessionId,
    player_id:      playerId,
    player_count:   playerCount ?? 1,
    personal_score: personalScore ?? 0,
    session_score:  personalScore ?? 0,
    coins_earned:   coinsEarned ?? 0,
    coins_spent:    0,
    last_weapon:    lastWeapon ?? '',
    subject:        subject ?? '',
    grade:          grade ?? '',
  });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ ok: true });
}
```

- [ ] **Step 3: Implement `src/game/OnlineGameSession.ts`**

```typescript
import { GameSession } from './GameSession';
import {
  joinChannel,
  leaveChannel,
  broadcastPlayerTick,
  broadcastWaveTick,
  type PlayerTick,
} from '@/domain/online/realtimeChannel';
import { closeSession } from '@/domain/online/sessionService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class OnlineGameSession extends GameSession {
  private channel: RealtimeChannel | null = null;
  private readonly sessionId: string;
  private readonly playerId: string;
  private readonly sessionToken: string;
  private readonly isHost: boolean;
  private readonly playerCount: number;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private scoreRecorded = false;

  constructor(
    root: HTMLElement,
    username: string,
    sessionId: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
    onExitToHub: () => void,
  ) {
    super(root, username, 'new', onExitToHub);
    this.sessionId    = sessionId;
    this.playerId     = playerId;
    this.sessionToken = sessionToken;
    this.playerCount  = playerCount;
    this.isHost       = isHost;

    this.world?.setSpawnMultiplier(playerCount);
    this.world?.setEnemyHpMultiplier(1 + (playerCount - 1) * 0.2);

    this.channel = joinChannel(
      sessionId,
      playerId,
      username,
      isHost,
      (tick: PlayerTick) => this.onRemotePlayerTick(tick),
      (tick) => { if (!this.isHost) this.applyRemoteWaveTick(tick); },
      () => this.handleHostLeft(),
    );

    this.tickInterval = setInterval(() => this.broadcastSelf(), 1000);
  }

  private broadcastSelf(): void {
    if (!this.channel || !this.save) return;
    broadcastPlayerTick(this.channel, {
      playerId:       this.playerId,
      name:           this.username,
      wave:           this.waves.wave,
      kills:          this.save.score,
      score:          this.save.score,
      coins:          this.save.coins,
      lives:          this.waves.lives,
      equippedWeapon: this.save.equippedWeapon,
    });
    if (this.isHost) {
      broadcastWaveTick(this.channel, { wave: this.waves.wave, phase: this.waves.phase });
    }
  }

  private onRemotePlayerTick(_tick: PlayerTick): void {
    // Future: render remote player avatars or co-op HUD entries.
  }

  private applyRemoteWaveTick(tick: { wave: number; phase: 'wave' | 'rest' }): void {
    this.waves = { ...this.waves, wave: tick.wave, phase: tick.phase };
  }

  // Called on non-host clients when the host's Presence entry disappears.
  // Records score first, then triggers hub redirect via dispose().
  private handleHostLeft(): void {
    void this.recordScore().finally(() => this.dispose());
  }

  override dispose(): void {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
    if (this.channel) { leaveChannel(this.channel); this.channel = null; }
    if (this.isHost) {
      void this.recordScore();
      void closeSession(this.sessionId, this.playerId, this.sessionToken);
    }
    super.dispose();
  }

  private async recordScore(): Promise<void> {
    if (this.scoreRecorded || !this.save) return;
    this.scoreRecorded = true;
    await fetch('/api/scores/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId:     this.sessionId,
        playerId:      this.playerId,
        sessionToken:  this.sessionToken,
        personalScore: this.save.score,
        coinsEarned:   this.save.coins,
        lastWeapon:    this.save.equippedWeapon,
        subject:       this.save.subject,
        grade:         this.save.grade,
      }),
    });
  }
}
```

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add src/game/OnlineGameSession.ts api/scores/record.ts src/game/world/World.ts
git commit -m "feat: OnlineGameSession with Realtime sync, host departure handling, server-side score recording"
```

---

### Task 6: Leaderboard screen + API endpoint

**Files:**
- Create: `api/leaderboard/index.ts`
- Create: `src/game/ui/screens/leaderboardScreen.ts`

Fetches top 20 entries per player-count category via the leaderboard Vercel Function, which joins `scoreboard_entries` with `players` for the username and checks for an active season before returning data.

- [ ] **Step 1: Create `api/leaderboard/index.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'leaderboard', 60))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const playerCount = Number(req.query['playerCount'] ?? 1);
  if (![1, 2, 3, 4].includes(playerCount)) {
    res.status(400).json({ error: 'playerCount debe ser 1–4.' }); return;
  }

  // Check for active season — no data shown if no season is running.
  const { data: season } = await supabaseAdmin
    .from('seasons')
    .select('name')
    .eq('is_active', true)
    .maybeSingle();

  if (!season) {
    res.status(200).json({ entries: [], seasonName: null }); return;
  }

  const { data, error } = await supabaseAdmin
    .from('scoreboard_entries')
    .select('personal_score, coins_earned, last_weapon, players(username)')
    .eq('player_count', playerCount)
    .order('personal_score', { ascending: false })
    .limit(20);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const entries = (data ?? []).map((row) => ({
    username:      (row.players as { username: string } | null)?.username ?? 'Desconocido',
    personalScore: row.personal_score as number,
    coinsEarned:   row.coins_earned as number,
    lastWeapon:    row.last_weapon as string,
  }));

  res.status(200).json({ entries, seasonName: season.name });
}
```

- [ ] **Step 2: Implement `src/game/ui/screens/leaderboardScreen.ts`**

```typescript
import { el, clear } from '@/shared/dom';

type Category = '1' | '2' | '3' | '4';

interface LeaderboardEntry {
  username: string;
  personalScore: number;
  coinsEarned: number;
  lastWeapon: string;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  seasonName: string | null;
}

export async function renderLeaderboardScreen(
  root: HTMLElement,
  onBack: () => void,
): Promise<void> {
  clear(root);
  const section = el('section', { className: 'screen' });
  root.append(section);

  // Fetch category 1 to check for active season and preload first tab.
  const probeRes  = await fetch('/api/leaderboard?playerCount=1');
  const probeJson = await probeRes.json() as LeaderboardResponse;

  if (!probeJson.seasonName) {
    section.append(
      el('h1', {}, ['Clasificación']),
      el('p', { className: 'muted' }, ['No hay una temporada activa.']),
    );
    const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);
    backBtn.addEventListener('click', onBack);
    section.append(backBtn);
    return;
  }

  section.append(el('h1', {}, [`Clasificación — ${probeJson.seasonName}`]));

  const tabs    = el('div', { className: 'leaderboard-tabs' });
  const content = el('div', { className: 'leaderboard-content' });

  const categories: { id: Category; label: string }[] = [
    { id: '1', label: 'Solo' },
    { id: '2', label: '2P' },
    { id: '3', label: '3P' },
    { id: '4', label: '4P' },
  ];

  for (const cat of categories) {
    const tab = el('button', { type: 'button', className: 'btn ghost leaderboard-tab' }, [cat.label]);
    tab.addEventListener('click', () => void loadCategory(cat.id, content));
    tabs.append(tab);
  }

  // Category 1 already fetched — render without a second request.
  renderEntries(probeJson.entries, content);

  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);
  backBtn.addEventListener('click', onBack);

  section.append(tabs, content, backBtn);
}

async function loadCategory(playerCount: Category, container: HTMLElement): Promise<void> {
  clear(container);
  container.append(el('p', {}, ['Cargando…']));

  const res  = await fetch(`/api/leaderboard?playerCount=${playerCount}`);
  const json = await res.json() as LeaderboardResponse;

  clear(container);
  renderEntries(json.entries ?? [], container);
}

function renderEntries(entries: LeaderboardEntry[], container: HTMLElement): void {
  if (!entries.length) {
    container.append(el('p', { className: 'muted' }, ['Sin entradas todavía.']));
    return;
  }

  const table = el('table', { className: 'leaderboard-table' });
  table.append(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, ['#']),
      el('th', {}, ['Jugador']),
      el('th', {}, ['Puntos']),
      el('th', {}, ['Monedas']),
      el('th', {}, ['Arma']),
    ]),
  ]));
  const tbody = el('tbody', {});
  entries.forEach((entry, i) => {
    tbody.append(el('tr', {}, [
      el('td', {}, [String(i + 1)]),
      el('td', {}, [entry.username]),
      el('td', {}, [String(entry.personalScore)]),
      el('td', {}, [String(entry.coinsEarned)]),
      el('td', {}, [entry.lastWeapon]),
    ]));
  });
  table.append(tbody);
  container.append(table);
}
```

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add api/leaderboard/index.ts src/game/ui/screens/leaderboardScreen.ts
git commit -m "feat: leaderboard API with season guard and username join, fetch-based client screen"
```

---

### Task 7: Admin dashboard with Supabase Auth

**Files:**
- Create: `api/admin/_verifyAdmin.ts`
- Create: `api/admin/seasons.ts`
- Create: `api/admin/stats.ts`
- Create: `src/domain/admin/adminService.ts`
- Create: `src/game/ui/screens/adminScreen.ts`
- Modify: `src/game/ui/screens/hubScreen.ts`

Admin is a real Supabase Auth user created once in the Supabase dashboard (Authentication → Users → Invite). The browser calls `supabase.auth.signInWithPassword` — this is the intended client-side Auth API and returns a JWT. That JWT is sent as `Authorization: Bearer <token>` to every admin Vercel Function. Functions verify the JWT server-side and check the user's email against `ADMIN_EMAIL`. The `VITE_ADMIN_PASSWORD` env var approach is removed entirely.

- [ ] **Step 1: Create `api/admin/_verifyAdmin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

export async function verifyAdminJwt(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.email === process.env.ADMIN_EMAIL;
}
```

- [ ] **Step 2: Create `api/admin/seasons.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';
import { verifyAdminJwt } from './_verifyAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'admin/seasons', 10))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  if (!(await verifyAdminJwt(req.headers.authorization))) {
    res.status(403).json({ error: 'No autorizado.' }); return;
  }

  const { action, name } = req.body as { action?: 'start' | 'end'; name?: string };

  if (action === 'start') {
    if (!name?.trim()) { res.status(400).json({ error: 'Nombre de temporada requerido.' }); return; }
    await supabaseAdmin
      .from('seasons')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('is_active', true);
    const { error } = await supabaseAdmin
      .from('seasons')
      .insert({ name: name.trim(), is_active: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true }); return;
  }

  if (action === 'end') {
    await supabaseAdmin
      .from('seasons')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('is_active', true);
    res.status(200).json({ ok: true }); return;
  }

  res.status(400).json({ error: 'Acción desconocida.' });
}
```

- [ ] **Step 3: Create `api/admin/stats.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';
import { verifyAdminJwt } from './_verifyAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'admin/stats', 20))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  if (!(await verifyAdminJwt(req.headers.authorization))) {
    res.status(403).json({ error: 'No autorizado.' }); return;
  }

  const limit = Math.min(Number(req.query['limit'] ?? 10), 100);

  const { data, error } = await supabaseAdmin
    .from('scoreboard_entries')
    .select('personal_score, players(username)')
    .order('personal_score', { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const players = (data ?? []).map((row) => ({
    username:   (row.players as { username: string } | null)?.username ?? 'Desconocido',
    totalScore: row.personal_score as number,
  }));

  res.status(200).json({ players });
}
```

- [ ] **Step 4: Create `src/domain/admin/adminService.ts`**

```typescript
import { getSupabase } from '@/lib/supabase';

// Supabase Auth sign-in is designed to run on the client — it returns a short-lived JWT.
// That JWT is forwarded to Vercel Functions for server-side identity verification.
export async function adminSignIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : {};
}

export async function getAdminToken(): Promise<string | null> {
  const { data: { session } } = await getSupabase().auth.getSession();
  return session?.access_token ?? null;
}

export async function adminSignOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function startSeason(
  name: string,
  token: string,
): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ action: 'start', name }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error };
}

export async function endSeason(token: string): Promise<{ error?: string }> {
  const res = await fetch('/api/admin/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ action: 'end' }),
  });
  const json = await res.json() as { error?: string };
  return res.ok ? {} : { error: json.error };
}

export async function fetchTopPlayers(
  token: string,
  limit = 10,
): Promise<{ username: string; totalScore: number }[]> {
  const res = await fetch(`/api/admin/stats?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = await res.json() as { players: { username: string; totalScore: number }[] };
  return json.players ?? [];
}
```

- [ ] **Step 5: Create `src/game/ui/screens/adminScreen.ts`**

```typescript
import { el, clear } from '@/shared/dom';
import {
  adminSignIn,
  getAdminToken,
  adminSignOut,
  startSeason,
  endSeason,
  fetchTopPlayers,
} from '@/domain/admin/adminService';

export function renderAdminScreen(root: HTMLElement, onBack: () => void): void {
  clear(root);

  const emailInput = el('input', { type: 'email',    placeholder: 'Correo admin', className: 'input' }) as HTMLInputElement;
  const passInput  = el('input', { type: 'password', placeholder: 'Contraseña',   className: 'input' }) as HTMLInputElement;
  const loginBtn   = el('button', { type: 'button',  className: 'btn primary' }, ['Ingresar']);
  const errMsg     = el('p', { className: 'error' }, ['']);

  const loginSection = el('section', { className: 'screen' }, [
    el('h1', {}, ['Admin']),
    emailInput, passInput, errMsg, loginBtn,
  ]);
  root.append(loginSection);

  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    errMsg.textContent = '';
    const result = await adminSignIn(emailInput.value.trim(), passInput.value);
    if (result.error) {
      errMsg.textContent = result.error;
      loginBtn.disabled = false;
      return;
    }
    const token = await getAdminToken();
    if (!token) {
      errMsg.textContent = 'Error obteniendo sesión.';
      loginBtn.disabled = false;
      return;
    }
    await renderDashboard(root, onBack, token);
  });
}

async function renderDashboard(
  root: HTMLElement,
  onBack: () => void,
  token: string,
): Promise<void> {
  clear(root);
  const section = el('section', { className: 'screen' });

  // Season controls.
  const nameInput = el('input', { type: 'text', placeholder: 'Nombre de temporada', className: 'input' }) as HTMLInputElement;
  const startBtn  = el('button', { type: 'button', className: 'btn primary' }, ['Iniciar temporada']);
  const endBtn    = el('button', { type: 'button', className: 'btn' },         ['Terminar temporada activa']);
  const statusMsg = el('p', {}, ['']);

  startBtn.addEventListener('click', async () => {
    const result = await startSeason(nameInput.value.trim() || 'Temporada', token);
    statusMsg.textContent = result.error ?? 'Temporada iniciada.';
  });
  endBtn.addEventListener('click', async () => {
    const result = await endSeason(token);
    statusMsg.textContent = result.error ?? 'Temporada terminada.';
  });

  // Top players.
  const topList = el('ol', { className: 'admin-top-list' });
  const players = await fetchTopPlayers(token, 10);
  players.forEach((p) => {
    topList.append(el('li', {}, [`${p.username} — ${p.totalScore} pts`]));
  });

  const logoutBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Cerrar sesión']);
  logoutBtn.addEventListener('click', async () => {
    await adminSignOut();
    onBack();
  });

  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Salir']);
  backBtn.addEventListener('click', onBack);

  section.append(
    el('h1', {}, ['Panel de administración']),
    el('h2', {}, ['Temporadas']),
    nameInput, startBtn, endBtn, statusMsg,
    el('h2', {}, ['Top 10 jugadores']),
    topList,
    el('div', { className: 'btn-row' }, [logoutBtn, backBtn]),
  );
  root.append(section);
}
```

- [ ] **Step 6: Add admin route to hub**

In `src/game/ui/screens/hubScreen.ts`, add an admin button (login is protected by Supabase Auth so it can always be visible):

```typescript
import { renderAdminScreen } from './adminScreen';

// Inside renderHubScreen, append:
const adminBtn = el('button', { type: 'button', className: 'btn ghost' }, ['⚙ Admin']);
adminBtn.addEventListener('click', () =>
  renderAdminScreen(root, () => renderHubScreen(root, username, setGameStarter /* ...other args */))
);
root.append(adminBtn);
```

- [ ] **Step 7: Commit**

```bash
npx tsc --noEmit
git add api/admin/ src/domain/admin/adminService.ts src/game/ui/screens/adminScreen.ts src/game/ui/screens/hubScreen.ts
git commit -m "feat: admin dashboard with Supabase Auth JWT, season controls, and top player stats"
```

---

### Self-Review

| Requirement | Covered |
|---|---|
| 4-digit session code | ✅ Task 2 (`api/session/create`) |
| Max 6 sessions | ✅ Task 2 (enforced server-side in `api/session/create`) |
| 2× spawns, ×1.2 HP per player | ✅ Task 5 (`setSpawnMultiplier`, `setEnemyHpMultiplier`) |
| Cross-platform sessions | ✅ (Supabase Realtime, no platform restriction) |
| Offline remains untouched | ✅ (`OnlineGameSession` is a separate class) |
| Host leaves → all players kicked | ✅ Tasks 3 + 5 (Presence `leave` → `handleHostLeft`) |
| No host handoff or re-election | ✅ Removed — session ends immediately on host departure |
| No anon key for DB access | ✅ All DB ops in Vercel Functions via `SUPABASE_SERVICE_ROLE_KEY` |
| RLS deny-all for anon role | ✅ Task 2 (migrations enable RLS, zero anon policies) |
| Rate limiting on all endpoints | ✅ Tasks 2, 5, 6, 7 (`checkLimit` in every handler) |
| Player identity persistence | ✅ Task 2 (`resolveIdentity`, localStorage session token) |
| Scoreboard: solo / 2p / 3p / 4p | ✅ Task 6 |
| Personal score vs session score | ✅ Task 5 schema fields |
| No leaderboard without active season | ✅ Task 6 (`api/leaderboard/index.ts` season check) |
| Season start/end in admin | ✅ Task 7 (`api/admin/seasons.ts`) |
| Top 10 players stat in admin | ✅ Task 7 (`api/admin/stats.ts`) |
| Admin protected by Supabase Auth JWT | ✅ Task 7 (`verifyAdminJwt` in every admin endpoint) |

**Deferred:**
- Release notes page (simple static Markdown view — trivial follow-up).
- Other games' admin statistics (same pattern as this game).
