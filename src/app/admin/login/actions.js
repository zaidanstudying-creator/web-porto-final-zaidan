'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  password: z.string().min(1).max(256),
  next: z.string().optional(),
});

function getSafeAdminPath(value) {
  if (!value || !value.startsWith('/admin') || value.startsWith('//') || value === '/admin/login') {
    return '/admin';
  }
  return value;
}

export async function loginAdmin(formData) {
  const parsed = loginSchema.safeParse({
    password: formData.get('password'),
    next: formData.get('next'),
  });

  if (!parsed.success) redirect('/admin/login?error=invalid');
  const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
  if (!isSupabaseConfigured() || !adminEmail) redirect('/admin/login?error=setup');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: parsed.data.password,
  });

  if (error || !data.user) redirect('/admin/login?error=invalid');

  const { data: membership, error: membershipError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (membershipError || membership?.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/admin/login?error=unauthorized');
  }

  redirect(getSafeAdminPath(parsed.data.next));
}
