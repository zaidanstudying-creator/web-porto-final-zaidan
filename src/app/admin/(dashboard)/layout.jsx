import { requireActiveAdmin } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({ children }) {
  await requireActiveAdmin();
  return children;
}
