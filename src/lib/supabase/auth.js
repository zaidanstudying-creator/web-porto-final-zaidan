import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from './config';
import { createSupabaseServerClient } from './server';

export async function requireActiveAdmin() {
  if (!isSupabaseConfigured()) redirect('/admin/login?error=setup');

  const supabase = await createSupabaseServerClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult?.data?.claims ?? null;
  const userId = claims?.sub;

  if (!userId) redirect('/admin/login');

  const { data: membership, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || membership?.role !== 'admin') {
    redirect('/admin/login?error=unauthorized');
  }

  return { supabase, userId, role: membership.role };
}
