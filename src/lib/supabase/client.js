'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from './config';

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error('Supabase belum dikonfigurasi. Isi variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  return createBrowserClient(config.url, config.publishableKey);
}
