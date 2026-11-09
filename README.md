# Portfolio Ihsan Fawwas Zaidan

Website portofolio pribadi yang menampilkan profil, proyek, keahlian, pengalaman, riwayat, sertifikat, dan kontak. Konten website dapat dikelola melalui CMS admin, sedangkan data dan media disimpan menggunakan Supabase.

## Fitur

- Halaman portofolio responsif dengan animasi dan komponen interaktif.
- Bagian About dan kartu profil dengan foto, tulisan, serta efek visual.
- Daftar proyek, teknologi, keahlian, pengalaman, riwayat, dan sertifikat.
- Formulir kontak untuk pengunjung.
- CMS admin untuk mengubah konten dan pengaturan tampilan serta mengelola media.
- Login admin menggunakan Supabase Auth.

## Teknologi

- **Next.js 16** dengan App Router
- **React 19** dan JavaScript (ES Modules)
- **CSS Modules** dan CSS global untuk tampilan responsif
- **Supabase** untuk autentikasi, database PostgreSQL, dan penyimpanan media
- **GSAP**, **Motion**, dan **Three.js** untuk animasi dan elemen interaktif
- **Zod** untuk validasi data
- **Hugeicons** untuk ikon

## Persyaratan

- Node.js **20.9.0 atau lebih baru**
- npm
- Project Supabase untuk menjalankan CMS dan menyimpan data
- Docker Desktop dan Supabase CLI jika ingin menjalankan Supabase secara lokal

## Instalasi dan menjalankan

1. Clone repository dan masuk ke folder proyek:

   ```bash
   git clone https://github.com/zaidanstudying-creator/web-porto-final-zaidan.git
   cd web-porto-final-zaidan
   ```

2. Pasang dependensi:

   ```bash
   npm ci
   ```

3. Buat file environment lokal dari template:

   ```bash
   cp .env.example .env.local
   ```

4. Isi `.env.local` dengan konfigurasi Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   ADMIN_LOGIN_EMAIL=admin@example.com
   SUPABASE_SECRET_KEY=your_server_secret_key
   ```

   `ADMIN_LOGIN_EMAIL` dan `SUPABASE_SECRET_KEY` hanya digunakan di server. Jangan memakai prefix `NEXT_PUBLIC_` pada secret key dan jangan commit `.env.local` ke Git.

5. Siapkan database Supabase dan bucket storage menggunakan file migrasi di `supabase/migrations/`. Untuk panduan database, storage, dan pembuatan admin, lihat [docs/supabase-setup.md](docs/supabase-setup.md).

6. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

7. Buka [http://localhost:3000](http://localhost:3000). Halaman login CMS tersedia di [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## Menjalankan Supabase lokal (opsional)

Pasang Supabase CLI dan Docker Desktop terlebih dahulu. Jika konfigurasi CLI belum tersedia, inisialisasi Supabase di repository, lalu jalankan stack lokal:

```bash
supabase init
supabase start
supabase db reset
```

`supabase db reset` membangun ulang **database lokal** dari migrasi. Jangan jalankan perintah reset pada project Supabase remote atau database yang berisi data penting. Gunakan URL dan key lokal yang ditampilkan Supabase CLI untuk `.env.local`.

## Perintah proyek

```bash
npm run dev       # Menjalankan server pengembangan
npm run build     # Membuat build production
npm start         # Menjalankan build production
npm run lint      # Memeriksa kode dengan ESLint
```

## Struktur direktori

```text
src/app/                 Halaman website, login, dan admin CMS
src/components/          Komponen portofolio dan elemen interaktif
src/lib/supabase/        Konfigurasi dan helper Supabase
public/                  Gambar dan aset statis
supabase/migrations/     Migrasi database
docs/                    Panduan tambahan
```
