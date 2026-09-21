-- ==========================================================
-- SKRIP DATABASE MYSQL: CAREER DAY 2026 RSVP & GUESTBOOK
-- ==========================================================
-- Lokasi Acara: Hotel Gajahmada Pontianak
-- Peserta: Universitas Mitra, Panitia Sekolah, & Yayasan Gereja Protestan Kampung Bali
-- ==========================================================

CREATE DATABASE IF NOT EXISTS career_day_2026 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE career_day_2026;

-- 2. Buat Tabel rsvp_guests
CREATE TABLE IF NOT EXISTS rsvp_guests (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Kategori Institusi / Asal Delegasi
    institution_category ENUM('universitas', 'sekolah', 'yayasan') NOT NULL DEFAULT 'universitas',
    
    -- Informasi Institusi & Perwakilan
    university_name VARCHAR(255) NOT NULL,
    pic_name VARCHAR(255) NOT NULL,
    pic_position VARCHAR(255) DEFAULT '',
    pic_phone VARCHAR(50) NOT NULL,
    pic_email VARCHAR(255) DEFAULT '',
    
    -- Konfirmasi Kehadiran (Bisa Hadir / Berhalangan)
    attendance_status ENUM('hadir', 'tidak_hadir') NOT NULL DEFAULT 'hadir',
    attendee_count INT NOT NULL DEFAULT 1,
    additional_attendees TEXT,
    dietary_requirements VARCHAR(255) DEFAULT '',
    
    -- Kebutuhan Presentasi & Teknis (Hanya jika Hadir)
    presentation_topic TEXT,
    needs_projector TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT,
    
    -- Presensi / Buku Tamu Hari-H di Hotel Gajahmada Pontianak
    is_checked_in TINYINT(1) NOT NULL DEFAULT 0,
    checked_in_at DATETIME NULL DEFAULT NULL,
    checked_in_by VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Index untuk Kecepatan Pencarian & Filter
CREATE INDEX idx_institution_cat ON rsvp_guests (institution_category);
CREATE INDEX idx_university_name ON rsvp_guests (university_name);
CREATE INDEX idx_attendance_status ON rsvp_guests (attendance_status);
CREATE INDEX idx_is_checked_in ON rsvp_guests (is_checked_in);
CREATE INDEX idx_created_at ON rsvp_guests (created_at DESC);

-- ==========================================================
-- DATA CONTOH AWAL (SEED DATA)
-- ==========================================================
INSERT INTO rsvp_guests 
(id, institution_category, university_name, pic_name, pic_position, pic_phone, pic_email, attendance_status, attendee_count, additional_attendees, dietary_requirements, presentation_topic, needs_projector, notes, is_checked_in, checked_in_at, checked_in_by)
VALUES
(
    UUID(), 
    'universitas',
    'Universitas Tanjungpura (UNTAN)', 
    'Dr. Hendra Gunawan', 
    'Tim Admisi & Humas', 
    '081234567890', 
    'admisi@untan.ac.id', 
    'hadir', 
    2, 
    'Dewi Sartika (Staf Promosi)', 
    'Halal', 
    'Sosialisasi Fakultas & Program Beasiswa KIP', 
    1, 
    'Akan membawa standing banner', 
    1, 
    NOW(), 
    'Panitia Hotel Gajahmada'
),
(
    UUID(), 
    'yayasan',
    'Yayasan Gereja Protestan Kampung Bali', 
    'Pdt. Markus Tan, M.Th', 
    'Ketua Yayasan', 
    '081398765432', 
    'yayasan.kampungbali@gmail.com', 
    'hadir', 
    2, 
    'Ibu Yohana (Sekretaris Yayasan)', 
    'Halal / Bebas Pantangan', 
    'Sambutan & Apresiasi Kemitraan Kampus', 
    0, 
    'Duduk di meja kehormatan', 
    0, 
    NULL, 
    ''
),
(
    UUID(), 
    'sekolah',
    'Panitia Career Day Sekolah', 
    'Bpk. Steven, S.Pd', 
    'Ketua Pelaksana Career Day 2026', 
    '085712341234', 
    'panitia.careerday@sekolah.sch.id', 
    'hadir', 
    4, 
    'Tim Acara, Tim Logistik, MC', 
    'Halal', 
    'Koordinasi Rundown Pameran & Sesi Presentasi Siswa', 
    1, 
    'Briefing teknis display kampus di sekolah', 
    1, 
    NOW(), 
    'Panitia Hotel Gajahmada'
),
(
    UUID(), 
    'universitas',
    'Universitas Multimedia Nusantara', 
    'Kevin Sanjaya', 
    'Marketing & Admission Officer', 
    '082188889999', 
    'kevin.s@umn.ac.id', 
    'hadir', 
    2, 
    'Clarissa', 
    'Halal', 
    'Program Desain & Animasi Digital UMN', 
    1, 
    'Minta stopkontak demo', 
    0, 
    NULL, 
    ''
),
(
    UUID(), 
    'universitas',
    'Binus University', 
    'Maria Angela', 
    'Education Counselor', 
    '081900112233', 
    'maria.a@binus.edu', 
    'tidak_hadir', 
    0, 
    '', 
    '', 
    '', 
    0, 
    'Mohon maaf ada agenda bersamaan di Jakarta', 
    0, 
    NULL, 
    ''
);

-- ==========================================================
-- QUERY-QUERY SQL UTAMA
-- ==========================================================

-- A. Ambil Rekap Total Kehadiran & Konsumsi di Hotel Gajahmada
SELECT 
    COUNT(*) AS total_undangan,
    SUM(CASE WHEN attendance_status = 'hadir' THEN 1 ELSE 0 END) AS total_hadir,
    SUM(CASE WHEN attendance_status = 'tidak_hadir' THEN 1 ELSE 0 END) AS total_berhalangan,
    SUM(CASE WHEN attendance_status = 'hadir' THEN attendee_count ELSE 0 END) AS total_porsi_makanan_pax,
    SUM(CASE WHEN is_checked_in = 1 THEN 1 ELSE 0 END) AS total_sudah_tiba_di_hotel
FROM rsvp_guests;

-- B. Rekap Kehadiran per Kategori (Univ, Sekolah, Yayasan)
SELECT 
    institution_category,
    COUNT(*) AS total_peserta,
    SUM(CASE WHEN attendance_status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
    SUM(CASE WHEN attendance_status = 'hadir' THEN attendee_count ELSE 0 END) AS total_pax
FROM rsvp_guests
GROUP BY institution_category;
