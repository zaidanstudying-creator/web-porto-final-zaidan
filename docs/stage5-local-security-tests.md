# Pengujian keamanan lokal Tahap 5

Pengujian Storage hanya menerima `SUPABASE_URL` loopback (`localhost`, `127.0.0.1`, atau `::1`). Suite akan gagal sebelum membuat request jika URL mengarah ke host lain. Jangan gunakan key atau kredensial project remote.

## Menjalankan tes database

1. Pasang Supabase CLI dan Docker Desktop. Siapkan konfigurasi lokal Supabase jika belum ada; pertahankan berkas `supabase/migrations` dan `supabase/tests`.
2. Jalankan `supabase start`, lalu `supabase db reset` pada stack lokal saja. Perintah ini mengaplikasikan migrasi dan seed ke database lokal.
3. Jalankan `supabase test db` untuk tes pgTAP di `supabase/tests/stage5_rls.test.sql`.

Tes pgTAP membuat fixture di dalam transaksi dan mengakhirinya dengan `ROLLBACK`. Tes memeriksa izin role, baris published/unpublished, akses admin aktif/nonaktif, inbox, activity log, allowlist settings, serta konfigurasi dan policy Storage.

## Menjalankan tes URL dan Storage API

Tes URL mandiri:

```sh
npm run test:security
```

Tes Storage integration dilewati bila environment lokal belum tersedia. Untuk mengaktifkannya, buat dua pengguna **pada Auth lokal** melalui Studio: satu pengguna aktif yang memiliki baris `admin_users` lokal, dan satu pengguna tanpa membership. Lalu set environment lokal berikut pada shell:

- `SUPABASE_URL` (loopback lokal saja)
- `SUPABASE_PUBLISHABLE_KEY` (key stack lokal)
- `STORAGE_TEST_ADMIN_EMAIL` dan `STORAGE_TEST_ADMIN_PASSWORD`
- `STORAGE_TEST_NON_ADMIN_EMAIL` dan `STORAGE_TEST_NON_ADMIN_PASSWORD`

Jalankan `node --test tests/storage-security.test.js`. Test mengunggah objek bernama unik ke bucket lokal, memeriksa akses publik/privat, lalu menghapus hanya objek fixture tersebut. Test tidak membuat atau menghapus akun.

## Keterbatasan eksekusi saat ini

Pada lingkungan agen saat ini, Supabase CLI tidak tersedia dan Docker daemon menolak akses ke socket lokal. Karena itu migrasi PostgreSQL dan tes Storage API belum dijalankan. Jangan mengganti URL lokal dengan project remote untuk mengatasi keterbatasan ini.
