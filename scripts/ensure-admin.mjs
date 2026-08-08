import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const email = 'admin@juegos.local';
const password = 'JdcOps#8k2mNq';
const extraEmail = env.ADMIN_EMAIL;

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function grantAdmin(userId) {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });
  if (error) throw error;
}

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: 'admin' },
});

if (createErr && !/already|registered|exists/i.test(createErr.message)) {
  console.error('createUser failed:', createErr.message);
  process.exit(1);
}

if (created?.user) {
  console.log('created', email);
} else {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error('listUsers failed:', listErr.message);
    process.exit(1);
  }
  const existing = list.users.find((u) => u.email === email);
  if (!existing) {
    console.error('user exists according to createUser but was not listed');
    process.exit(1);
  }
  await grantAdmin(existing.id);
  console.log('updated', email);
}

if (extraEmail && extraEmail !== email) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error('listUsers failed:', listErr.message);
    process.exit(1);
  }
  const extra = list.users.find((u) => u.email?.toLowerCase() === extraEmail.toLowerCase());
  if (extra) {
    const { error } = await admin.auth.admin.updateUserById(extra.id, {
      app_metadata: { role: 'admin' },
    });
    if (error) {
      console.error('grant extra failed:', error.message);
      process.exit(1);
    }
    console.log('granted admin role to', extra.email);
  }
}

const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error: signErr } = await anon.auth.signInWithPassword({ email, password });
console.log('signIn', signErr ? signErr.message : 'ok');
if (signErr) process.exit(1);
