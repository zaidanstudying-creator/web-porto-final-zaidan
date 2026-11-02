# Supabase setup

Backend Supabase portofolio tersambung ke project `webporto` di region `ap-northeast-2`. Migrasi schema CMS sudah diterapkan ke project tersebut.

## Environment

`.env.local` sudah diisi dengan URL project dan publishable key. File itu diabaikan Git. Untuk mesin atau deployment lain, isi kedua variabel berikut di environment deployment. `.env.example` tetap kosong sebagai template. Jangan menambahkan secret key atau `service_role` key ke variabel `NEXT_PUBLIC_*`.

Variabel aplikasi:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_LOGIN_EMAIL` (server-only): email akun Supabase Auth admin yang dipakai di belakang layar. Form login hanya meminta password.
- `SUPABASE_SECRET_KEY` (server-only): key rahasia Supabase untuk endpoint form kontak. Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk key ini.

Jika variabel itu belum tersedia di deployment, situs publik tetap dapat dibuka tetapi login admin tidak akan tersambung.

## Schema dan Storage

Migrasi `supabase/migrations/20261027155607_stage5_portfolio_schema.sql` sudah membuat tabel portofolio, indeks, trigger `updated_at`, kebijakan RLS/GRANT, serta dua bucket pada project `webporto`:

- `portfolio-public`: gambar publik, maksimum 15 MiB, hanya JPEG/PNG/WebP/AVIF.
- `admin-private`: CV/dokumen privat, maksimum 20 MiB, hanya gambar yang sama atau PDF.

CMS menyediakan unggah/pilih gambar dari field Profile, Project cover, Experience logo, History image, Profile card pattern, artwork ScrollExpand (“Behind the Code”), dan gambar belakang/strap Lanyard. Foto depan Lanyard menggunakan foto profil. Pengaturan ukuran dan warna Lanyard dapat diedit di Site settings.

Bucket publik memang menyajikan objek tanpa autentikasi. Kebijakan Storage tetap membatasi unggah, daftar, perubahan, dan hapus kepada admin aktif. Bucket privat seluruhnya memakai RLS.
Jika migrasi ini dipakai pada project lain, periksa dahulu apakah nama bucket tersebut sudah dipakai sebelum menerapkannya.

Untuk pemakaian lokal, pasang Supabase CLI dan Docker Desktop, inisialisasi konfigurasi lokal bila belum tersedia, kemudian gunakan `supabase start` dan `supabase db reset`. Perintah reset membangun ulang database lokal dari migrasi; jangan jalankan pada database remote atau database yang berisi data penting.

Tes dasar RLS berada di `supabase/tests/stage5_rls.test.sql` dan dijalankan dengan `supabase test db` setelah stack lokal tersedia.

## Membuat admin pertama

1. Dari Supabase Dashboard, buat pengguna melalui Authentication → Users. Pendaftaran publik tidak dibuat di aplikasi.
2. Salin UUID pengguna tersebut.
3. Di SQL Editor pada project yang benar, jalankan query terbatas ini dengan UUID dari langkah sebelumnya:

   ```sql
   insert into public.admin_users (user_id, role, is_active)
   values ('UUID-PENGGUNA-AUTH', 'admin', true);
   ```

4. Isi `ADMIN_LOGIN_EMAIL` pada `.env.local` dan environment deployment dengan email akun tadi. Akses `/admin/login`; halaman hanya meminta password.

`admin_users` tidak memberi hak INSERT/UPDATE/DELETE kepada `authenticated`; perubahan keanggotaan harus dilakukan oleh operator tepercaya melalui Dashboard/SQL Editor. `admin_activity_logs` hanya dapat ditulis oleh backend tepercaya menggunakan secret server-only, sedangkan CMS biasa tetap memakai session admin dan RLS.

## Status dan batasan

- Schema sudah diterapkan, tetapi project Auth saat ini belum memiliki pengguna. Buat pengguna admin pertama melalui Supabase Dashboard → Authentication → Users, lalu masukkan UUID-nya ke `admin_users` dengan query di atas. Set `ADMIN_LOGIN_EMAIL` dengan email tersebut (server-only), lalu login melalui `/admin/login` menggunakan password akun itu. Email tidak ditampilkan di halaman.
- Tes RLS lokal belum dijalankan. Jangan jalankan `supabase db reset` pada project remote karena perintah itu membangun ulang database lokal.
- Form kontak memvalidasi input di server, memakai honeypot dan pembatasan kiriman sederhana, lalu menyimpan melalui key server-only. Isi `SUPABASE_SECRET_KEY` pada `.env.local` dan environment deployment agar kiriman dapat disimpan ke `contact_messages`; jangan berikan key ini ke browser atau repo.
- `site_settings` hanya menerima key dan bentuk nilai publik yang di-allowlist di migrasi. Simpan pesan, dokumen privat, dan secret di jalur terpisah yang tidak diekspos.
