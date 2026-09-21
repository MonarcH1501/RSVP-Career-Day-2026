# 🎓 RSVP & Buku Tamu Career Day 2026 (Malam Keakraban Universitas)

Aplikasi web modern, responsif, dan lengkap untuk konfirmasi kehadiran (RSVP), buku tamu digital hari-H, dan dashboard manajemen data (CRUD) perwakilan universitas mitra pada acara **Malam Keakraban (Makrab) Career Day 2026** menggunakan **React, Tailwind CSS, dan Supabase**.

---

## 🌟 Fitur Utama

1. **📝 Formulir RSVP Delegasi Universitas**:
   - Pengisian nama universitas, nama PIC, jabatan, no. WhatsApp aktif, dan email.
   - Pilihan status kehadiran: **Pasti Hadir**, **Masih Ragu-Ragu**, atau **Berhalangan**.
   - Input jumlah pax delegasi yang hadir untuk alokasi konsumsi makan malam.
   - Pilihan kebutuhan khusus: preferensi konsumsi/diet (Halal, Vegetarian, dll.), topik materi promosi kampus ke siswa, kebutuhan layar proyektor LCD, dan catatan khusus.
   - **E-Tiket Konfirmasi**: Ringkasan konfirmasi kehadiran elegan dengan animasi selebrasi yang bisa dicetak/disimpan langsung oleh perwakilan kampus.

2. **📖 Buku Tamu Digital & Presensi Check-In (Hari-H)**:
   - Pencarian cepat nama universitas atau nama PIC di meja resepsionis sekolah.
   - Tombol **1-Klik Check-In** untuk mencatat waktu kedatangan riil secara akurat.
   - Fitur **+ Tamu Walk-In** untuk mendaftarkan perwakilan kampus yang hadir langsung di venue tanpa sempat mengisi form sebelumnya.
   - Indikator live status tamu yang sudah tiba vs yang masih ditunggu.

3. **📊 Dashboard Admin Panitia (CRUD Lengkap)**:
   - Dilindungi **PIN Akses Admin** (Default: `2026`).
   - Ringkasan statistik (KPI): Total Univ Terdaftar, Konfirmasi Hadir, Total Porsi Konsumsi (Pax), Tamu Sudah Tiba, dan Kebutuhan Proyektor.
   - **Create**: Tambah data delegasi secara manual oleh panitia.
   - **Read**: Tabel data interaktif + Modal detail informasi lengkap tiap universitas.
   - **Update**: Edit data universitas, PIC, kontak, jumlah pax, maupun status kehadiran.
   - **Delete**: Hapus data dengan dialog konfirmasi aman.
   - **Export to CSV**: Mengunduh seluruh data dalam format spreadsheet/Excel untuk laporan konsumsi dan pencetakan nametag.

4. **⚡ Mode Offline / Demo & Online Supabase**:
   - Aplikasi dapat langsung diuji coba secara lokal dengan penyimpanan browser (`localStorage`).
   - Dilengkapi panduan visual dan skrip database siap pakai untuk koneksi ke **Supabase**.

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka URL lokal yang muncul di terminal (biasanya `http://localhost:5173`).

2. **PIN Masuk Dashboard Admin**:
   - Default PIN: `2026` (Dapat diubah di file `.env` pada variabel `VITE_ADMIN_PIN`).

---

## 🗄️ Panduan Menghubungkan Database Online Supabase

Aplikasi ini sudah dirancang untuk langsung tersambung ke **Supabase** dalam 3 langkah mudah:

### Langkah 1: Buat Proyek di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan masuk / daftar akun gratis.
2. Klik tombol **New Project**, beri nama (misalnya `career-day-2026`), dan buat password database.

### Langkah 2: Jalankan Skrip SQL Tabel
1. Di dashboard Supabase, buka menu **SQL Editor** di panel kiri.
2. Klik **New Query**.
3. Buka file `schema.sql` yang ada di folder proyek ini, lalu salin (*copy*) seluruh isinya dan tempel (*paste*) ke SQL Editor Supabase.
4. Klik tombol **Run**. Tabel `rsvp_guests`, index, trigger, dan sample data akan otomatis dibuat.

### Langkah 3: Salin Kredensial ke `.env`
1. Di dashboard Supabase, buka menu **Project Settings** (ikon gerigi) -> **API**.
2. Salin **Project URL** dan **anon / public key**.
3. Buka file `.env` di folder proyek ini dan tempel nilainya:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_ADMIN_PIN=2026
   ```
4. Restart development server:
   ```bash
   npm run dev
   ```
5. Badge di pojok kanan atas aplikasi akan berubah menjadi **🟢 Supabase Online**, dan seluruh data akan tersimpan langsung di database cloud PostgreSQL!

---

## 📂 Struktur Berkas Proyek

```
RSVP Career Day 2026/
├── schema.sql                 # Skrip SQL untuk tabel Supabase (PostgreSQL)
├── .env                       # File konfigurasi kredensial lokal
├── .env.example               # Template contoh konfigurasi .env
├── package.json               # Dependensi proyek
├── index.html                 # Halaman HTML utama & styling font
├── src/
│   ├── types/
│   │   └── index.ts           # Definisi interface TypeScript (RsvpGuest, status, dll.)
│   ├── lib/
│   │   └── supabase.ts        # Client Supabase & fallback LocalStorage CRUD
│   ├── components/
│   │   ├── Navbar.tsx         # Header navigasi & status Supabase
│   │   ├── RsvpForm.tsx       # Formulir RSVP publik + E-Tiket konfirmasi
│   │   ├── Guestbook.tsx      # Buku tamu digital & 1-klik check-in meja resepsionis
│   │   ├── AdminDashboard.tsx # Dashboard admin lengkap (CRUD, KPI, Export CSV)
│   │   ├── AdminLoginModal.tsx# Modal login proteksi PIN panitia
│   │   └── SupabaseSetupModal.tsx # Panduan interaktif integrasi Supabase
│   ├── App.tsx                # State management utama aplikasi
│   ├── main.tsx               # Entry point React
│   └── index.css              # Styling Tailwind CSS v4
```

---

*Dibuat untuk mempermudah koordinasi dan kepanitiaan Makrab Career Day 2026 bersama seluruh Perguruan Tinggi mitra.*
