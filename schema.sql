-- ==========================================================
-- SKRIP DATABASE SUPABASE: CAREER DAY 2026 RSVP & GUESTBOOK
-- ==========================================================
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run

-- 1. Buat Tabel rsvp_guests
CREATE TABLE IF NOT EXISTS public.rsvp_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Informasi Institusi & Perwakilan
    university_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    pic_position TEXT DEFAULT '',
    pic_phone TEXT NOT NULL,
    pic_email TEXT DEFAULT '',
    
    -- Konfirmasi Kehadiran
    attendance_status TEXT NOT NULL DEFAULT 'hadir' CHECK (attendance_status IN ('hadir', 'tidak_hadir', 'ragu_ragu')),
    attendee_count INTEGER NOT NULL DEFAULT 1,
    additional_attendees TEXT DEFAULT '',
    
    -- Kebutuhan Acara & Konsumsi
    dietary_requirements TEXT DEFAULT '',
    presentation_topic TEXT DEFAULT '',
    needs_projector BOOLEAN DEFAULT false,
    notes TEXT DEFAULT '',
    
    -- Buku Tamu / Check-In Hari-H
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by TEXT DEFAULT ''
);

-- 2. Index untuk performa query & pencarian
CREATE INDEX IF NOT EXISTS idx_rsvp_university ON public.rsvp_guests (university_name);
CREATE INDEX IF NOT EXISTS idx_rsvp_attendance ON public.rsvp_guests (attendance_status);
CREATE INDEX IF NOT EXISTS idx_rsvp_checkin ON public.rsvp_guests (is_checked_in);
CREATE INDEX IF NOT EXISTS idx_rsvp_created_at ON public.rsvp_guests (created_at DESC);

-- 3. Trigger otomatis update timestamp 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.rsvp_guests;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.rsvp_guests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row Level Security (RLS)
-- Aktifkan RLS
ALTER TABLE public.rsvp_guests ENABLE ROW LEVEL SECURITY;

-- Policy: Publik / Anonim dapat membaca data tamu (untuk pencarian buku tamu & dashboard)
CREATE POLICY "Allow public read access"
    ON public.rsvp_guests
    FOR SELECT
    USING (true);

-- Policy: Publik / Tamu dapat mendaftar (Insert)
CREATE POLICY "Allow public insert"
    ON public.rsvp_guests
    FOR INSERT
    WITH CHECK (true);

-- Policy: Publik / Admin dapat mengupdate (Update status, check-in, dsb.)
CREATE POLICY "Allow public update"
    ON public.rsvp_guests
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Publik / Admin dapat menghapus data (Delete)
CREATE POLICY "Allow public delete"
    ON public.rsvp_guests
    FOR DELETE
    USING (true);

-- 5. Data Dummy Awal (Opsional - untuk demo)
INSERT INTO public.rsvp_guests 
(university_name, pic_name, pic_position, pic_phone, pic_email, attendance_status, attendee_count, additional_attendees, dietary_requirements, presentation_topic, needs_projector, notes, is_checked_in)
VALUES
('Universitas Indonesia', 'Dr. Budi Santoso', 'Kepala Humas & Admisi', '081234567890', 'budi.santoso@ui.ac.id', 'hadir', 2, 'Siti Rahma (Staf Promosi)', 'Halal, No seafood', 'Peluang Beasiswa & Jalur Prestasi UI 2026', true, 'Perlu meja display brosur ukuran sedang', true),
('Institut Teknologi Bandung', 'Prof. Hendra Wijaya', 'Dosen & Tim Promosi', '081398765432', 'hendra@itb.ac.id', 'hadir', 2, 'Rian Pratama', 'Halal', 'Fakultas Teknik & Perkuliahan STEI-ITB', true, 'Akan membawa standing banner', false),
('Universitas Gadjah Mada', 'Anisa Permata, S.I.Kom', 'Staf Admisi & Kerjasama', '085712341234', 'anisa.p@ugm.ac.id', 'hadir', 1, '', 'Vegetarian', 'Eksplorasi Program Studi Unggulan UGM', false, '', false),
('Universitas Multimedia Nusantara', 'Kevin Sanjaya', 'Marketing Officer', '082188889999', 'kevin.s@umn.ac.id', 'hadir', 3, 'Clarissa, Denny', 'Halal', 'Fakultas Seni, Desain, & Teknologi Digital', true, 'Minta colokan listrik untuk demonstrasi animasi', false),
('Binus University', 'Maria Angela', 'Education Counselor', '081900112233', 'maria.a@binus.edu', 'ragu_ragu', 1, '', 'Halal', 'Global Employability Program Binus', false, 'Menunggu persetujuan rektorat hari Rabu', false);
