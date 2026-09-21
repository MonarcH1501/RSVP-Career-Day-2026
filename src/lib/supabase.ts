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
      const sanitized = (json.data || []).map((g: any) => ({
        ...g,
        institution_category: g.institution_category || 'universitas',
        needs_projector: Boolean(g.needs_projector),
        is_checked_in: Boolean(g.is_checked_in),
      }));
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
        return { data: data as RsvpGuest[], error: null, databaseType: 'supabase' };
      }
    } catch (_supabaseErr) {}
  }

  // 3. Fallback ke Local Storage
  detectedDatabase = 'local';
  return { data: getLocalGuests(), error: null, databaseType: 'local' };
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
          data: {
            ...item,
            needs_projector: Boolean(item.needs_projector),
            is_checked_in: Boolean(item.is_checked_in),
          },
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
      const { data, error } = await supabase
        .from('rsvp_guests')
        .insert([{ ...newGuestBase, is_checked_in: false, checked_in_at: null, checked_in_by: '' }])
        .select()
        .single();

      if (!error && data) {
        return { data: data as RsvpGuest, error: null };
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
          data: {
            ...item,
            needs_projector: Boolean(item.needs_projector),
            is_checked_in: Boolean(item.is_checked_in),
          },
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
        return { data: data as RsvpGuest, error: null };
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
