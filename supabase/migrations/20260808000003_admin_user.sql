-- Ops account. Login name is `admin`; Auth still stores a valid email (GoTrue rejects `admin` alone).
-- Change the password in the Supabase dashboard after first apply.

create extension if not exists pgcrypto;

do $$
declare
  admin_id uuid := 'a0e1b2c3-d4e5-4f67-8901-23456789abcd';
  admin_email text := 'admin@juegos.local';
  existing uuid;
begin
  select id into existing from auth.users where email = admin_email;
  if existing is not null then
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt('JdcOps#8k2mNq', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', admin_email),
    'email',
    admin_id::text,
    now(),
    now(),
    now()
  );
end $$;
