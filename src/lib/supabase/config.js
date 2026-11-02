import { z } from 'zod';

const publicConfigSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

export function getSupabasePublicConfig() {
  const result = publicConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return result.success ? result.data : null;
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
