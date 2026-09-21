import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2, 
  UserCheck, 
  UserPlus, 
  X, 
  Phone, 
  RotateCcw, 
  Sparkles, 
  MapPin,
  BadgeCheck,
  UserCheck2,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QrScannerModal } from './QrScannerModal';
import type { RsvpGuest, CreateRsvpInput, InstitutionCategory } from '../types';

interface GuestbookProps {
  guests: RsvpGuest[];
  isLoading: boolean;
  onCheckIn: (id: string, isCheckedIn: boolean, checkedInBy?: string) => Promise<void>;
  onAddWalkIn: (data: CreateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
}

export const Guestbook: React.FC<GuestbookProps> = ({
  guests,
  isLoading,
  onCheckIn,
  onAddWalkIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  
  // Staf yang bertugas di meja resepsionis
  const [receptionistStaff, setReceptionistStaff] = useState('Panitia Meja Depan');

  // Walk-in form state
  const [walkInData, setWalkInData] = useState({
    institution_category: 'universitas' as InstitutionCategory,
    university_name: '',
    pic_name: '',
    pic_phone: '',
    pic_position: '',
    attendee_count: 1,
    presentation_topic: '',
    notes: 'Pendaftaran Walk-in di Meja Resepsionis Restoran Gajah Mada',
  });
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Filter and search
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchSearch =
        guest.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.pic_phone.includes(searchTerm) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (categoryFilter !== 'all' && guest.institution_category !== categoryFilter) return false;

      if (filterTab === 'checked_in') return guest.is_checked_in;
      if (filterTab === 'pending') return !guest.is_checked_in && guest.attendance_status !== 'tidak_hadir';
      return true;
    });
  }, [guests, searchTerm, filterTab, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const attending = guests.filter((g) => g.attendance_status === 'hadir');
    const checkedIn = guests.filter((g) => g.is_checked_in);
    const totalPresentPax = checkedIn.reduce((sum, g) => sum + (g.attendee_count || 1), 0);
    const totalExpectedPax = attending.reduce((sum, g) => sum + (g.attendee_count || 1), 0);

    return {
      totalGuests: guests.length,
      checkedInCount: checkedIn.length,
      totalPresentPax,
      totalExpectedPax,
      percentage: attending.length > 0 ? Math.round((checkedIn.length / attending.length) * 100) : 0,
    };
  }, [guests]);

  const handleCheckInToggle = async (guest: RsvpGuest) => {
    const newStatus = !guest.is_checked_in;
    setCheckingInId(guest.id);
    try {
      await onCheckIn(guest.id, newStatus, receptionistStaff);
      if (newStatus) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#3b82f6', '#6366f1'],
        });
      }
    } finally {
      setCheckingInId(null);
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError(null);

    if (!walkInData.university_name.trim() || !walkInData.pic_name.trim() || !walkInData.pic_phone.trim()) {
      setWalkInError('Nama instansi/universitas, nama PIC, dan no. WhatsApp wajib diisi.');
      return;
    }

    setIsSubmittingWalkIn(true);
    try {
      const res = await onAddWalkIn({
        institution_category: walkInData.institution_category,
        university_name: walkInData.university_name,
        pic_name: walkInData.pic_name,
        pic_phone: walkInData.pic_phone,
        pic_position: walkInData.pic_position,
        attendance_status: 'hadir',
        attendee_count: walkInData.attendee_count,
        presentation_topic: walkInData.presentation_topic,
        needs_projector: false,
        notes: walkInData.notes,
      });

      if (res.error) {
        setWalkInError(res.error);
      } else if (res.data) {
        await onCheckIn(res.data.id, true, receptionistStaff);
        setIsWalkInModalOpen(false);
        setWalkInData({
          institution_category: 'universitas',
          university_name: '',
          pic_name: '',
          pic_phone: '',
          pic_position: '',
          attendee_count: 1,
          presentation_topic: '',
          notes: 'Pendaftaran Walk-in di Meja Resepsionis Restoran Gajah Mada',
        });
      }
    } catch (err: unknown) {
      setWalkInError(err instanceof Error ? err.message : 'Gagal menyimpan tamu walk-in.');
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return '';
    }
  };

  return (
    <div className="text-left space-y-6">
      
      {/* Top Desk Banner & Staf Input */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Meja Resepsionis
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Restoran Gajah Mada Pontianak
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white">
            Buku Tamu & Presensi Delegasi
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Verifikasi kehadiran delegasi Universitas, Panitia Sekolah, & Yayasan saat tiba di lokasi.
          </p>
        </div>

        {/* Input Staf Resepsionis & Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 w-full md:w-auto">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-black/20 rounded-xl flex-1 sm:flex-none">
            <UserCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Staf Meja:</p>
              <input
                type="text"
                value={receptionistStaff}
                onChange={(e) => setReceptionistStaff(e.target.value)}
                placeholder="Nama Staf"
                className="bg-transparent text-xs font-bold text-white border-b border-white/20 focus:border-emerald-400 outline-none w-24 sm:w-32 py-0.5"
              />
            </div>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-md shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 text-emerald-100" />
            <span>Scan QR Presensi</span>
          </button>

          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Walk-In</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delegasi Tiba</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{stats.checkedInCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">/ {stats.totalGuests}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Hadir</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-indigo-600">{stats.totalPresentPax}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Pax / Orang</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Restoran Gajah Mada</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Belum Tiba</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-500">
              {Math.max(0, guests.filter(g => g.attendance_status === 'hadir' && !g.is_checked_in).length)}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">Instansi</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Ditunggu kedatangan</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Persentase</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-slate-800">{stats.percentage}%</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Live Check-In
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kampus, PIC, no. HP, ID..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="universitas">Universitas</option>
            <option value="sekolah">Sekolah</option>
            <option value="yayasan">Yayasan</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Semua ({guests.length})
            </button>
            <button
              onClick={() => setFilterTab('checked_in')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'checked_in' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Tiba ({guests.filter(g => g.is_checked_in).length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Belum ({guests.filter(g => g.attendance_status === 'hadir' && !g.is_checked_in).length})
            </button>
          </div>
        </div>
      </div>

      {/* Guest Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Memuat data buku tamu...</p>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">Tidak ada data tamu yang cocok</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? `Pencarian "${searchTerm}" tidak ditemukan.` : 'Belum ada data pada filter ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuests.map((guest) => {
            const isAttending = guest.attendance_status === 'hadir';
            const isCurrentChecking = checkingInId === guest.id;

            return (
              <div
                key={guest.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  guest.is_checked_in
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : !isAttending
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  {/* Category badge & Status */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block mb-1 ${
                        guest.institution_category === 'yayasan'
                          ? 'bg-purple-100 text-purple-700'
                          : guest.institution_category === 'sekolah'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {guest.institution_category === 'yayasan'
                          ? 'Yayasan Gereja'
                          : guest.institution_category === 'sekolah'
                          ? 'Panitia Sekolah'
                          : 'Universitas Mitra'}
                      </span>

                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {guest.university_name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {guest.pic_name} {guest.pic_position ? `(${guest.pic_position})` : ''}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {guest.is_checked_in ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Tiba
                      </span>
                    ) : isAttending ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Bisa Hadir
                      </span>
                    ) : (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                        Berhalangan
                      </span>
                    )}
                  </div>

                  {/* Details strip */}
                  {isAttending && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          {guest.attendee_count} Pax
                        </span>
                        {guest.dietary_requirements && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] text-slate-600">
                            {guest.dietary_requirements}
                          </span>
                        )}
                      </div>

                      {guest.pic_phone && (
                        <a
                          href={`https://wa.me/${guest.pic_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                        >
                          <Phone className="w-3 h-3" />
                          {guest.pic_phone}
                        </a>
                      )}
                    </div>
                  )}

                  {guest.notes && (
                    <p className="text-xs text-slate-500 italic mt-2">
                      Catatan: {guest.notes}
                    </p>
                  )}
                </div>

                {/* Check-In Action Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {guest.is_checked_in ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs text-emerald-800 font-semibold space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tiba pukul {formatTime(guest.checked_in_at)}</span>
                        </div>
                        {guest.checked_in_by && (
                          <p className="text-[10px] text-slate-400 pl-5">
                            Diverifikasi oleh: <span className="text-slate-600 font-bold">{guest.checked_in_by}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCheckInToggle(guest)}
                        disabled={isCurrentChecking}
                        className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors flex items-center gap-1"
                        title="Batalkan check-in jika salah klik"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Batal</span>
                      </button>
                    </div>
                  ) : !isAttending ? (
                    <span className="text-xs text-slate-400 italic">Konfirmasi tidak hadir</span>
                  ) : (
                    <button
                      onClick={() => handleCheckInToggle(guest)}
                      disabled={isCurrentChecking}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                        isCurrentChecking
                          ? 'bg-emerald-400 text-white cursor-wait'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                      }`}
                    >
                      {isCurrentChecking ? (
                        <span>Mencatat Presensi...</span>
                      ) : (
                        <>
                          <BadgeCheck className="w-4 h-4" />
                          <span>Check-In Tamu (Tiba di Restoran Gajah Mada)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* WALK-IN MODAL */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-left relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsWalkInModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registrasi Tamu Walk-In</h3>
                <p className="text-xs text-slate-500">Resepsionis Restoran Gajah Mada Pontianak</p>
              </div>
            </div>

            {walkInError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Instansi</label>
                <select
                  value={walkInData.institution_category}
                  onChange={(e) => setWalkInData({ ...walkInData, institution_category: e.target.value as InstitutionCategory })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none bg-white text-xs font-semibold"
                >
                  <option value="universitas">Universitas Mitra</option>
                  <option value="sekolah">Panitia Sekolah</option>
                  <option value="yayasan">Yayasan Gereja Protestan Kampung Bali</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Universitas / Lembaga *</label>
                <input
                  type="text"
                  value={walkInData.university_name}
                  onChange={(e) => setWalkInData({ ...walkInData, university_name: e.target.value })}
                  placeholder="Contoh: Universitas Tanjungpura"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC *</label>
                  <input
                    type="text"
                    value={walkInData.pic_name}
                    onChange={(e) => setWalkInData({ ...walkInData, pic_name: e.target.value })}
                    placeholder="Nama Lengkap"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={walkInData.pic_position}
                    onChange={(e) => setWalkInData({ ...walkInData, pic_position: e.target.value })}
                    placeholder="Admisi / Dosen"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="tel"
                    value={walkInData.pic_phone}
                    onChange={(e) => setWalkInData({ ...walkInData, pic_phone: e.target.value })}
                    placeholder="081234567890"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Pax</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={walkInData.attendee_count}
                    onChange={(e) =>
                      setWalkInData({ ...walkInData, attendee_count: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 disabled:bg-emerald-400"
                >
                  {isSubmittingWalkIn ? 'Mendaftarkan...' : 'Simpan & Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL - ABSENSI OTOMATIS */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        guests={guests}
        receptionistStaff={receptionistStaff}
        onCheckIn={onCheckIn}
      />

    </div>
  );
};
