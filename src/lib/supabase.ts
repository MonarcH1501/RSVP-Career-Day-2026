import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RsvpGuest, CreateRsvpInput, UpdateRsvpInput } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plakmwzxtzohkcxrxmvt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FDEgHpTan_cfDmRXrxWw_Q_miJU9D1L';
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type DatabaseType = 'mysql' | 'supabase' | 'local';

let detectedDatabase: DatabaseType = 'local';

export const getActiveDatabaseType = (): DatabaseType => detectedDatabase;

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim() !== '' &&
    supabaseUrl.startsWith('http') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('...')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock data awal kosong
const INITIAL_DEMO_DATA: RsvpGuest[] = [];

const LOCAL_STORAGE_KEY = 'rsvp_career_day_guests_v3';

const getLocalGuests = (): RsvpGuest[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DATA));
      return INITIAL_DEMO_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading localStorage', err);
    return INITIAL_DEMO_DATA;
  }
};

const saveLocalGuests = (guests: RsvpGuest[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guests));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
};

export const sanitizeGuest = (g: any): RsvpGuest => {
  let approvalStatus: 'approved' | 'pending' | 'rejected' = g.approval_status || 'approved';
  let cleanedNotes = g.notes || '';

  // Extract [APPROVAL:status] tag if notes has it
  const match = cleanedNotes.match(/\[APPROVAL:(approved|pending|rejected)\]/);
  if (match) {
    approvalStatus = match[1] as 'approved' | 'pending' | 'rejected';
    cleanedNotes = cleanedNotes.replace(/\[APPROVAL:(approved|pending|rejected)\]\s*/g, '').trim();
  }

  return {
    ...g,
    institution_category: g.institution_category || 'universitas',
    approval_status: approvalStatus,
    notes: cleanedNotes,
    needs_projector: Boolean(g.needs_projector),
    is_checked_in: Boolean(g.is_checked_in),
  };
};

// ======================= API FUNCTIONS =======================

export const fetchGuests = async (): Promise<{
  data: RsvpGuest[];
  error: string | null;
  databaseType: DatabaseType;
}> => {
  // 1. Coba koneksi ke Backend MySQL API terlebih dahulu
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${apiUrl}/guests`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      detectedDatabase = 'mysql';
      const sanitized = (json.data || []).map(sanitizeGuest);
      return { data: sanitized, error: null, databaseType: 'mysql' };
    }
  } catch (_mysqlErr) {
    // MySQL API belum aktif
  }

  // 2. Coba Supabase jika dikonfigurasi
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rsvp_guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        detectedDatabase = 'supabase';
        const sanitized = (data as any[]).map(sanitizeGuest);
        return { data: sanitized, error: null, databaseType: 'supabase' };
      }
    } catch (_supabaseErr) {}
  }

  // 3. Fallback ke Local Storage
  detectedDatabase = 'local';
  const localGuests = getLocalGuests().map(sanitizeGuest);
  return { data: localGuests, error: null, databaseType: 'local' };
};

export const createGuest = async (
  input: CreateRsvpInput
): Promise<{ data: RsvpGuest | null; error: string | null }> => {
  const isAbsent = input.attendance_status === 'tidak_hadir';
  const newGuestBase = {
    ...input,
    institution_category: input.institution_category || 'universitas',
    university_name: input.university_name.trim(),
    pic_name: input.pic_name.trim(),
    pic_phone: input.pic_phone.trim(),
    pic_email: input.pic_email?.trim() || '',
    pic_position: input.pic_position?.trim() || '',
    approval_status: input.approval_status || 'approved',
    attendee_count: isAbsent ? 0 : (input.attendee_count || 1),
    additional_attendees: isAbsent ? '' : (input.additional_attendees?.trim() || ''),
    dietary_requirements: isAbsent ? '' : (input.dietary_requirements?.trim() || ''),
    presentation_topic: isAbsent ? '' : (input.presentation_topic?.trim() || ''),
    notes: input.notes?.trim() || '',
    needs_projector: isAbsent ? false : Boolean(input.needs_projector),
  };

  // MySQL API
  if (detectedDatabase === 'mysql') {
    try {
      const res = await fetch(`${apiUrl}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuestBase),
      });
      if (res.ok) {
        const json = await res.json();
        const item = json.data;
        return {
          data: sanitizeGuest(item),
          error: null,
        };
      }
    } catch (err) {
      console.warn('MySQL create failed, falling back:', err);
    }
  }

  // Supabase
  if (detectedDatabase === 'supabase' && supabase) {
    try {
      // 1. Coba insert standar (jika kolom approval_status sudah ada di DB)
      const basePayload = {
        ...newGuestBase,
        is_checked_in: false,
        checked_in_at: null,
        checked_in_by: '',
      };

      const { data, error } = await supabase
        .from('rsvp_guests')
        .insert([basePayload])
        .select()
        .single();

      if (!error && data) {
        return { data: sanitizeGuest(data), error: null };
      }

      // 2. Jika kolom approval_status belum ada di DB (PGRST204), simpan status di notes
      if (error && (error.code === 'PGRST204' || error.message?.includes('approval_status'))) {
        const approvalTag = newGuestBase.approval_status ? `[APPROVAL:${newGuestBase.approval_status}]` : '';
        const notesWithTag = approvalTag
          ? (newGuestBase.notes ? `${approvalTag} ${newGuestBase.notes}` : approvalTag)
          : (newGuestBase.notes || '');

        const { approval_status: _omit, ...payloadWithoutApproval } = basePayload;
        const fallbackPayload = {
          ...payloadWithoutApproval,
          notes: notesWithTag,
        };

        const { data: retryData, error: retryError } = await supabase
          .from('rsvp_guests')
          .insert([fallbackPayload])
          .select()
          .single();

        if (!retryError && retryData) {
          return { data: sanitizeGuest(retryData), error: null };
        }
      }
    } catch (err) {
      console.warn('Supabase create failed:', err);
    }
  }

  // Local storage mode
  const localData = getLocalGuests();
  const fallbackGuest: RsvpGuest = {
    ...newGuestBase,
    id: crypto.randomUUID ? crypto.randomUUID() : 'guest_' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_checked_in: false,
    checked_in_at: null,
    checked_in_by: '',
  };
  saveLocalGuests([fallbackGuest, ...localData]);
  return { data: fallbackGuest, error: null };
};

export const updateGuest = async (
  id: string,
  input: UpdateRsvpInput
): Promise<{ data: RsvpGuest | null; error: string | null }> => {
  // MySQL API
  if (detectedDatabase === 'mysql') {
    try {
      const res = await fetch(`${apiUrl}/guests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const json = await res.json();
        const item = json.data;
        return {
          data: sanitizeGuest(item),
          error: null,
        };
      }
    } catch (err) {
      console.warn('MySQL update failed:', err);
    }
  }

  // Supabase
  if (detectedDatabase === 'supabase' && supabase) {
    try {
      const { data, error } = await supabase
        .from('rsvp_guests')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return { data: sanitizeGuest(data), error: null };
      }

      // Fallback jika approval_status kolom belum ada di DB
      if (error && (error.code === 'PGRST204' || error.message?.includes('approval_status')) && input.approval_status) {
        const { data: currentGuest } = await supabase
          .from('rsvp_guests')
          .select('notes')
          .eq('id', id)
          .single();

        let baseNotes = (currentGuest?.notes || '').replace(/\[APPROVAL:(approved|pending|rejected)\]\s*/g, '').trim();
        if (input.notes !== undefined) {
          baseNotes = input.notes.replace(/\[APPROVAL:(approved|pending|rejected)\]\s*/g, '').trim();
        }
        const newNotes = `[APPROVAL:${input.approval_status}]${baseNotes ? ' ' + baseNotes : ''}`;

        const { approval_status: _omit, ...inputWithoutApproval } = input;
        const retryPayload = {
          ...inputWithoutApproval,
          notes: newNotes,
        };

        const { data: retryData, error: retryError } = await supabase
          .from('rsvp_guests')
          .update(retryPayload)
          .eq('id', id)
          .select()
          .single();

        if (!retryError && retryData) {
          return { data: sanitizeGuest(retryData), error: null };
        }
      }
    } catch (err) {
      console.warn('Supabase update failed:', err);
    }
  }

  // Local storage mode
  const localData = getLocalGuests();
  const index = localData.findIndex((g) => g.id === id);
  if (index === -1) {
    return { data: null, error: 'Data tamu tidak ditemukan' };
  }

  const updated: RsvpGuest = {
    ...localData[index],
    ...input,
    updated_at: new Date().toISOString(),
  };

  localData[index] = updated;
  saveLocalGuests(localData);
  return { data: updated, error: null };
};

export const deleteGuest = async (
  id: string
): Promise<{ success: boolean; error: string | null }> => {
  // MySQL API
  if (detectedDatabase === 'mysql') {
    try {
      const res = await fetch(`${apiUrl}/guests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        return { success: true, error: null };
      }
    } catch (err) {
      console.warn('MySQL delete failed:', err);
    }
  }

  // Supabase
  if (detectedDatabase === 'supabase' && supabase) {
    try {
      const { error } = await supabase.from('rsvp_guests').delete().eq('id', id);
      if (!error) {
        return { success: true, error: null };
      }
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }

  // Local storage mode
  const localData = getLocalGuests();
  const filtered = localData.filter((g) => g.id !== id);
  saveLocalGuests(filtered);
  return { success: true, error: null };
};

export const checkInGuest = async (
  id: string,
  isCheckedIn: boolean,
  checkedInBy: string = 'Panitia Restoran Gajah Mada'
): Promise<{ data: RsvpGuest | null; error: string | null }> => {
  // MySQL API
  if (detectedDatabase === 'mysql') {
    try {
      const res = await fetch(`${apiUrl}/guests/${id}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_checked_in: isCheckedIn,
          checked_in_by: checkedInBy,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const item = json.data;
        return {
          data: {
            ...item,
            needs_projector: Boolean(item.needs_projector),
            is_checked_in: Boolean(item.is_checked_in),
          },
          error: null,
        };
      }
    } catch (err) {
      console.warn('MySQL check-in failed:', err);
    }
  }

  const updatePayload: UpdateRsvpInput = {
    is_checked_in: isCheckedIn,
    checked_in_at: isCheckedIn ? new Date().toISOString() : null,
    checked_in_by: isCheckedIn ? checkedInBy : '',
  };

  return updateGuest(id, updatePayload);
};

export const setGuestApproval = async (
  id: string,
  approvalStatus: 'approved' | 'rejected'
): Promise<{ data: RsvpGuest | null; error: string | null }> => {
  return updateGuest(id, { approval_status: approvalStatus });
};
