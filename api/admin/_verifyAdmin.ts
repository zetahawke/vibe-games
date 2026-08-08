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
