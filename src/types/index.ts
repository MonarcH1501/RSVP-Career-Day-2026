export type AttendanceStatus = 'hadir' | 'tidak_hadir';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export type InstitutionCategory = 'universitas' | 'sekolah' | 'yayasan';

export interface RsvpGuest {
  id: string;
  created_at: string;
  updated_at: string;
  institution_category: InstitutionCategory;
  university_name: string; // Nama Universitas / Sekolah / Yayasan
  pic_name: string;        // Nama Tamu / Peserta Individu
  pic_position?: string;   // Jabatan di Kampus / Lembaga
  pic_phone: string;       // No WhatsApp Pribadi
  pic_email?: string;      // Email
  attendance_status: AttendanceStatus;
  approval_status?: ApprovalStatus; // 'approved' (default), 'pending', 'rejected'
  attendee_count: number;  // Selalu 1 per orang
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
