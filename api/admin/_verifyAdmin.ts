import { createClient } from '@supabase/supabase-js';
import { bearerFromHeaders, isAdminUser } from '../../src/domain/admin/adminIdentity';

export async function verifyAdminJwt(
  headers: Record<string, string | string[] | undefined>,
): Promise<boolean> {
  const authHeader = bearerFromHeaders(headers);
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user } } = await supabase.auth.getUser(token);
  return isAdminUser(user, process.env.ADMIN_EMAIL);
}
