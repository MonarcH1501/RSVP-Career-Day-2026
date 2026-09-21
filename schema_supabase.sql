-- ==========================================================
-- SKEMA SUPABASE: RSVP & PRESENSI CAREER DAY 2026
-- RESTORAN GAJAH MADA PONTIANAK
-- ==========================================================

-- 1. Buat Tabel rsvp_guests
CREATE TABLE IF NOT EXISTS public.rsvp_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    institution_category TEXT NOT NULL DEFAULT 'universitas',
    university_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    pic_position TEXT DEFAULT '',
    pic_phone TEXT NOT NULL,
    pic_email TEXT DEFAULT '',
    attendance_status TEXT NOT NULL DEFAULT 'hadir',
    attendee_count INTEGER NOT NULL DEFAULT 1,
    additional_attendees TEXT DEFAULT '',
    dietary_requirements TEXT DEFAULT '',
    presentation_topic TEXT DEFAULT '',
    needs_projector BOOLEAN DEFAULT false,
    notes TEXT DEFAULT '',
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by TEXT DEFAULT ''
);

-- 2. Aktifkan Row Level Security (RLS) & Berikan Akses Publik
ALTER TABLE public.rsvp_guests ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Publik diizinkan membaca, menambah, mengubah (check-in), dan menghapus
DROP POLICY IF EXISTS "Allow public all rsvp_guests" ON public.rsvp_guests;
CREATE POLICY "Allow public all rsvp_guests" ON public.rsvp_guests 
    FOR ALL 
    TO public 
    USING (true) 
    WITH CHECK (true);

-- 3. Data Awal / Sample Perwakilan (Opsional)
INSERT INTO public.rsvp_guests (
    id, institution_category, university_name, pic_name, pic_position, pic_phone, pic_email, attendance_status, attendee_count, dietary_requirements, presentation_topic, needs_projector, notes, is_checked_in, checked_in_by
) VALUES 
(
    gen_random_uuid(),
    'universitas',
    'Universitas Tanjungpura (UNTAN)',
    'Dr. Hendra Gunawan',
    'Tim Admisi & Humas',
    '081234567890',
    'hendra@untan.ac.id',
    'hadir',
    1,
    'Halal',
    'Sosialisasi Fakultas & Program Beasiswa KIP',
    true,
    'Akan membawa standing banner kampus',
    false,
    ''
),
(
    gen_random_uuid(),
    'yayasan',
    'Yayasan Gereja Protestan Kampung Bali',
    'Pdt. Markus Tan, M.Th',
    'Ketua Yayasan',
    '081398765432',
    'markus.tan@yayasan.org',
    'hadir',
    1,
    'Bebas Alergi',
    'Sambutan & Doa Pembuka Makrab',
    false,
    'Mendukung penuh kelancaran Career Day 2026',
    false,
    ''
),
(
    gen_random_uuid(),
    'sekolah',
    'Panitia Career Day Sekolah',
    'Bpk. Steven Kurniawan, S.Kom',
    'Koordinator Acara',
    '081987654321',
    'steven@sekolah.sch.id',
    'hadir',
    1,
    'Halal',
    'Koordinasi Rundown Pameran & Display Kampus',
    true,
    'Briefing teknis meja booth kampus',
    true,
    'Panitia Restoran Gajah Mada'
)
ON CONFLICT (id) DO NOTHING;
