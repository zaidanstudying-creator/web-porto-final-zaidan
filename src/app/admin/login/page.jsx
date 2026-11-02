import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { loginAdmin } from './actions';
import styles from './login.module.css';

const errorMessages = {
  invalid: 'Kata sandi tidak valid.',
  unauthorized: 'Akun ini tidak memiliki akses admin yang aktif.',
  setup: 'Koneksi login admin belum selesai dikonfigurasi.',
};

export const metadata = { title: 'Admin Login | Ihsan Fawwas Zaidan' };

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const hasSupabase = isSupabaseConfigured();
  const hasAdminEmail = Boolean(process.env.ADMIN_LOGIN_EMAIL);
  const errorMessage = errorMessages[params?.error];

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-login-title">
        <Link href="/" className={styles.eyebrow}>← Portfolio</Link>
        <h1 className={styles.title} id="admin-login-title">Admin sign in</h1>
        <p className={styles.description}>Masukkan kata sandi admin untuk melanjutkan.</p>

        {errorMessage && <p className={styles.message} role="alert">{errorMessage}</p>}

        <form className={styles.form} action={loginAdmin}>
          <input type="hidden" name="next" value={typeof params?.next === 'string' ? params.next : '/admin'} />
          <label className={styles.label} htmlFor="password">Password
            <input className={styles.input} id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} />
          </label>
          <button className={styles.button} type="submit">Sign in</button>
        </form>
        {(!hasSupabase || !hasAdminEmail) && (
          <div className={styles.setup} role="status">
            {hasSupabase
              ? <>Kolom password sudah siap. Untuk memproses login, admin perlu menyelesaikan konfigurasi <code>ADMIN_LOGIN_EMAIL</code> dan membuat akun pertama. Email hanya dipakai di server.</>
              : <>Login admin belum tersambung. Isi URL dan publishable key Supabase serta konfigurasi admin server terlebih dahulu.</>}
          </div>
        )}
        <p className={styles.footnote}>Pendaftaran akun admin tidak tersedia dari halaman ini.</p>
      </section>
    </main>
  );
}
