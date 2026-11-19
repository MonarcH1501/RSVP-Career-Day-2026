import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  UserCheck, 
  UserPlus, 
  X, 
  Phone, 
  RotateCcw, 
  Sparkles, 
  BadgeCheck, 
  Camera,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QrScannerModal } from './QrScannerModal';
import { 
  SCHOOL_UNITS, 
  YAYASAN_NAME, 
  ITBSS_NAME, 
  ENABLE_QR_SCAN,
  type SchoolUnit,
  type RsvpGuest, 
  type CreateRsvpInput, 
  type InstitutionCategory 
} from '../types';

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
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  
  // Staf yang bertugas di meja resepsionis
  const [receptionistStaff, setReceptionistStaff] = useState('Panitia Meja Depan');

  // Walk-in form state
  const [walkInKey, setWalkInKey] = useState<'sekolah' | 'yayasan' | 'itbss'>('sekolah');
  const [walkInSchoolUnit, setWalkInSchoolUnit] = useState<SchoolUnit>('TK 1');
  const [walkInData, setWalkInData] = useState({
    institution_category: 'sekolah' as InstitutionCategory,
    university_name: 'TK 1',
    pic_name: '',
    pic_phone: '',
    pic_position: '',
    attendee_count: 1,
    notes: 'Presensi Walk-in di Meja Penerima Tamu Natal',
  });
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  const handleWalkInCategoryChange = (key: 'sekolah' | 'yayasan' | 'itbss') => {
    setWalkInKey(key);
    let nextCategory: InstitutionCategory = 'sekolah';
    let nextName = '';

    if (key === 'yayasan') {
      nextCategory = 'yayasan';
      nextName = YAYASAN_NAME;
    } else if (key === 'itbss') {
      nextCategory = 'itbss';
      nextName = ITBSS_NAME;
    } else {
      nextCategory = 'sekolah';
      nextName = walkInSchoolUnit || 'TK 1';
    }

    setWalkInData((prev) => ({
      ...prev,
      institution_category: nextCategory,
      university_name: nextName,
    }));
  };

  const handleWalkInSchoolUnitChange = (unit: SchoolUnit) => {
    setWalkInSchoolUnit(unit);
    setWalkInData((prev) => ({
      ...prev,
      institution_category: 'sekolah',
      university_name: unit,
    }));
  };

  // Filter and search
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchSearch =
        guest.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.pic_phone.includes(searchTerm) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'sekolah' && guest.institution_category !== 'sekolah') return false;
        if (categoryFilter === 'yayasan' && guest.institution_category !== 'yayasan') return false;
        if (categoryFilter === 'itbss' && guest.institution_category !== 'itbss') return false;
      }

      // Unit filter
      if (unitFilter !== 'all') {
        if (guest.university_name.toLowerCase() !== unitFilter.toLowerCase()) return false;
      }

      if (filterTab === 'checked_in') return guest.is_checked_in;
      if (filterTab === 'pending') return !guest.is_checked_in && guest.attendance_status !== 'tidak_hadir';
      return true;
    });
  }, [guests, searchTerm, filterTab, categoryFilter, unitFilter]);

  // Statistics
  const stats = useMemo(() => {
    const attending = guests.filter((g) => g.attendance_status === 'hadir');
    const checkedIn = guests.filter((g) => g.is_checked_in);
    const sekolahCount = guests.filter((g) => g.institution_category === 'sekolah');
    const yayasanCount = guests.filter((g) => g.institution_category === 'yayasan');
    const itbssCount = guests.filter((g) => g.institution_category === 'itbss');

    return {
      totalGuests: guests.length,
      checkedInCount: checkedIn.length,
      sekolahCount: sekolahCount.length,
      yayasanCount: yayasanCount.length,
      itbssCount: itbssCount.length,
      percentage: attending.length > 0 ? Math.round((checkedIn.length / attending.length) * 100) : 0,
    };
  }, [guests]);

  const handleCheckInToggle = async (guest: RsvpGuest) => {
    if (guest.approval_status === 'rejected') {
      alert(`⛔ Presensi Ditolak: Pendaftaran tamu ini (${guest.pic_name} - ${guest.university_name}) dinonaktifkan oleh panitia.`);
      return;
    }

    const newStatus = !guest.is_checked_in;
    setCheckingInId(guest.id);
    try {
      await onCheckIn(guest.id, newStatus, receptionistStaff);
      if (newStatus) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#059669', '#10b981', '#3b82f6', '#f59e0b'],
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
      setWalkInError('Unit/instansi, nama peserta, dan no. WhatsApp wajib diisi.');
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
        attendee_count: 1,
        notes: walkInData.notes,
        approval_status: 'approved',
      });

      if (res.error) {
        setWalkInError(res.error);
      } else if (res.data) {
        await onCheckIn(res.data.id, true, receptionistStaff);
        setIsWalkInModalOpen(false);
        setWalkInData({
          institution_category: 'sekolah',
          university_name: 'TK 1',
          pic_name: '',
          pic_phone: '',
          pic_position: '',
          attendee_count: 1,
          notes: 'Presensi Walk-in di Meja Penerima Tamu Natal',
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
    <div className="space-y-4 sm:space-y-6">
      
      {/* Banner Meja Resepsionis */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Meja Penerima Tamu Natal
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Presensi Acara Perayaan Natal
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            {ENABLE_QR_SCAN
              ? 'Scan QR Code tiket digital peserta atau klik tombol check-in untuk mencatat kehadiran seketika.'
              : 'Kelola dan catat kehadiran peserta dari daftar pendaftaran formulir online.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Buka Kamera Scanner QR */}
          {ENABLE_QR_SCAN && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all active:scale-[0.98] border border-emerald-400/30 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-100" />
              <span>Scan QR Presensi</span>
            </button>
          )}

          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Walk-In</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sudah Hadir</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{stats.checkedInCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">/ {stats.totalGuests} Orang</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKI</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-teal-700">{stats.sekolahCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Peserta</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Sekolah Kristen Immanuel</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yayasan YGPKB</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-purple-700">{stats.yayasanCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Peserta</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Gereja & Pengurus</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">ITBSS</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-blue-700">{stats.itbssCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Peserta</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Institut Sabda Setia</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, unit, no. HP..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-emerald-600 outline-none"
          />
        </div>

        {/* Filter Dropdowns & Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setUnitFilter('all');
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
          >
            <option value="all">Semua Instansi</option>
            <option value="sekolah">SKI</option>
            <option value="yayasan">Yayasan YGPKB</option>
            <option value="itbss">ITBSS</option>
          </select>

          {/* Unit Filter (12 Unit) */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none max-w-[150px]"
          >
            <option value="all">Semua Unit</option>
            {SCHOOL_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
            <option value={YAYASAN_NAME}>YGPKB</option>
            <option value={ITBSS_NAME}>ITBSS</option>
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
              Sudah Hadir ({stats.checkedInCount})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Belum Hadir ({Math.max(0, stats.totalGuests - stats.checkedInCount)})
            </button>
          </div>
        </div>
      </div>

      {/* Receptionist Staf Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <span>Staf Resepsionis Aktif:</span>
          <input
            type="text"
            value={receptionistStaff}
            onChange={(e) => setReceptionistStaff(e.target.value)}
            className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-emerald-600 outline-none px-1"
          />
        </div>
        <span>Menampilkan {filteredGuests.length} dari {guests.length} peserta</span>
      </div>

      {/* Guest Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat data absensi...</p>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-sm">Tidak ada peserta ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter unit di atas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGuests.map((guest) => {
            const isAttending = guest.attendance_status === 'hadir';
            const isCurrentChecking = checkingInId === guest.id;

            return (
              <div
                key={guest.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  guest.is_checked_in
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                    : !isAttending
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  {/* Category badge & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block mb-1 ${
                        guest.institution_category === 'yayasan'
                          ? 'bg-purple-100 text-purple-700'
                          : guest.institution_category === 'itbss'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {guest.institution_category === 'yayasan'
                          ? 'YGPKB'
                          : guest.institution_category === 'itbss'
                          ? 'ITBSS'
                          : 'Unit Sekolah'}
                      </span>

                      <h3 className="font-black text-slate-900 text-base leading-snug">
                        {guest.university_name}
                      </h3>
                      <p className="text-xs text-slate-800 mt-1 flex items-center gap-1 font-bold">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {guest.pic_name}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {guest.is_checked_in ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
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
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      {guest.pic_phone && (
                        <a
                          href={`https://wa.me/${guest.pic_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3" />
                          {guest.pic_phone}
                        </a>
                      )}
                    </div>
                  )}

                  {guest.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg">
                      "{guest.notes}"
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
                          <span>Tiba {formatTime(guest.checked_in_at)}</span>
                        </div>
                        {guest.checked_in_by && (
                          <p className="text-[10px] text-slate-400 pl-5">
                            Petugas: <span className="text-slate-600 font-bold">{guest.checked_in_by}</span>
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
                  ) : guest.approval_status === 'rejected' ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                      <span className="text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        Pendaftaran Dinonaktifkan
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckInToggle(guest)}
                      disabled={isCurrentChecking}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                        isCurrentChecking
                          ? 'bg-emerald-400 text-white cursor-wait'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-[0.98]'
                      }`}
                    >
                      {isCurrentChecking ? (
                        <span>Mencatat Presensi...</span>
                      ) : (
                        <>
                          <BadgeCheck className="w-4 h-4" />
                          <span>Check-In Peserta (Tiba di Lokasi)</span>
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
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registrasi Presensi Walk-In</h3>
                <p className="text-xs text-slate-500">Meja Penerima Tamu Perayaan Natal</p>
              </div>
            </div>

            {walkInError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Bagian</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleWalkInCategoryChange('sekolah')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center ${
                      walkInKey === 'sekolah' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Unit Sekolah
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWalkInCategoryChange('yayasan')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center ${
                      walkInKey === 'yayasan' ? 'bg-purple-50 border-purple-600 text-purple-900' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    YGPKB
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWalkInCategoryChange('itbss')}
                    className={`p-2 rounded-xl border text-xs font-bold text-center ${
                      walkInKey === 'itbss' ? 'bg-blue-50 border-blue-600 text-blue-900' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    ITBSS
                  </button>
                </div>
              </div>

              {walkInKey === 'sekolah' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Unit SKI *</label>
                  <select
                    value={walkInSchoolUnit}
                    onChange={(e) => handleWalkInSchoolUnitChange(e.target.value as SchoolUnit)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-600 outline-none bg-white"
                  >
                    {SCHOOL_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              )}

              {walkInKey === 'yayasan' && (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-semibold">
                  {YAYASAN_NAME}
                </div>
              )}

              {walkInKey === 'itbss' && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold">
                  {ITBSS_NAME}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Peserta *</label>
                <input
                  type="text"
                  value={walkInData.pic_name}
                  onChange={(e) => setWalkInData({ ...walkInData, pic_name: e.target.value })}
                  placeholder="Nama Peserta / Guru / Staf"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp *</label>
                <input
                  type="tel"
                  value={walkInData.pic_phone}
                  onChange={(e) => setWalkInData({ ...walkInData, pic_phone: e.target.value })}
                  placeholder="0812xxxxxxxx"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                />
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-200 disabled:bg-emerald-400 cursor-pointer"
                >
                  {isSubmittingWalkIn ? 'Mendaftarkan...' : 'Simpan & Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {ENABLE_QR_SCAN && (
        <QrScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          guests={guests}
          receptionistStaff={receptionistStaff}
          onCheckIn={onCheckIn}
        />
      )}

    </div>
  );
};
