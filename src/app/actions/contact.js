'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { z } from 'zod';

const messageSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama maksimal 100 karakter.'),
  email: z.email('Masukkan alamat email yang valid.').max(254),
  subject: z.string().trim().min(3, 'Subjek minimal 3 karakter.').max(180, 'Subjek maksimal 180 karakter.'),
  message: z.string().trim().min(10, 'Pesan minimal 10 karakter.').max(4000, 'Pesan maksimal 4.000 karakter.'),
});

const recentSubmissions = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 3;

function getClientKey(headerList) {
  const forwardedFor = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || headerList.get('x-real-ip') || 'unknown';
}

export async function sendContactMessage(_previousState, formData) {
  // Honeypot: bots often populate every field; return a generic success without storing it.
  if (String(formData.get('website') ?? '').trim()) {
    return { status: 'success', message: 'Pesan berhasil dikirim. Terima kasih sudah menghubungi.' };
  }

  const parsed = messageSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Periksa kembali isi formulir.' };
  }

  const headersList = await headers();
  const key = getClientKey(headersList);
  const now = Date.now();
  const recent = (recentSubmissions.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS) {
    recentSubmissions.set(key, recent);
    return { status: 'error', message: 'Terlalu banyak pesan terkirim. Coba lagi beberapa menit lagi.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    return { status: 'error', message: 'Pengiriman pesan belum dikonfigurasi di server.' };
  }

  try {
    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { error } = await supabase.from('contact_messages').insert(parsed.data);
    if (error) {
      return { status: 'error', message: 'Pesan gagal disimpan. Coba lagi nanti.' };
    }

    recent.push(now);
    recentSubmissions.set(key, recent);
    return { status: 'success', message: 'Pesan berhasil dikirim. Terima kasih sudah menghubungi.' };
  } catch {
    return { status: 'error', message: 'Koneksi sedang bermasalah. Coba lagi nanti.' };
  }
}
