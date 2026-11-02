import { requireActiveAdmin } from '@/lib/supabase/auth';
import AdminDashboard from './admin-dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin CMS | Ihsan Fawwas Zaidan' };

const tables = [
  'profiles', 'projects', 'technologies', 'project_technologies', 'skills', 'experiences',
  'history_entries', 'social_links', 'site_settings', 'contact_messages', 'media_assets'
];

export default async function AdminPage() {
  const { supabase } = await requireActiveAdmin();
  const results = await Promise.all(tables.map((table) => supabase.from(table).select('*')));
  const initialData = Object.fromEntries(tables.map((table, index) => [table, results[index].data ?? []]));
  const failed = results.find((result) => result.error);

  return <AdminDashboard initialData={initialData} initialError={failed?.error?.message ?? ''} />;
}
