export type AttendanceStatus = 'hadir' | 'tidak_hadir';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

// Kategori Peserta: Unit Sekolah, Yayasan YGPKB, atau Bidang ITBSS
export type InstitutionCategory = 'sekolah' | 'yayasan' | 'itbss' | 'universitas';

// 12 Unit Sekolah resmi
export const SCHOOL_UNITS = [
  'TK 1',
  'TK 2',
  'SD 1',
  'SD 2',
  'SMP 1',
  'SMP 2',
  'SMK 1',
  'SMK 2',
  'SMA Reg',
  'SD IBC',
  'SMP IBC',
  'SMA IBC',
] as const;

export type SchoolUnit = typeof SCHOOL_UNITS[number];

export const YAYASAN_NAME = 'Yayasan Gereja Protestan Kampung Bali (YGPKB)';
export const ITBSS_NAME = 'Institut Teknologi dan Bisnis Sabda Setia (ITBSS)';

// Flag untuk mengaktifkan / menonaktifkan fitur QR Code & Kamera Scanner sementara
export const ENABLE_QR_SCAN = false;

export const ALL_INSTITUTION_UNITS = [
  ...SCHOOL_UNITS,
  YAYASAN_NAME,
  ITBSS_NAME,
] as const;

export interface RsvpGuest {
  id: string;
  created_at: string;
  updated_at: string;
  institution_category: InstitutionCategory;
  university_name: string; // Nama Unit Sekolah / YGPKB / ITBSS
  pic_name: string;        // Nama Guru / Staf / Tamu
  pic_position?: string;   // Jabatan / Peran (Guru, Tendik, Staf, Pengurus, Dosen, dll)
  pic_phone: string;       // No WhatsApp Pribadi
  pic_email?: string;      // Email
  attendance_status: AttendanceStatus;
  approval_status?: ApprovalStatus; // 'approved' (default)
  attendee_count: number;  // 1 orang per barcode
  additional_attendees?: string;
  dietary_requirements?: string;
  presentation_topic?: string;
  needs_projector: boolean;
  notes?: string;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  checked_in_by?: string;  // Nama staf resepsionis yang scan QR
}

export type CreateRsvpInput = {
  institution_category: InstitutionCategory;
  university_name: string;
  pic_name: string;
  pic_position?: string;
  pic_phone: string;
  pic_email?: string;
  attendance_status: AttendanceStatus;
  approval_status?: ApprovalStatus;
  attendee_count?: number;
  additional_attendees?: string;
  dietary_requirements?: string;
  presentation_topic?: string;
  needs_projector?: boolean;
  notes?: string;
};

export type UpdateRsvpInput = Partial<CreateRsvpInput> & {
  is_checked_in?: boolean;
  checked_in_at?: string | null;
  checked_in_by?: string;
};
