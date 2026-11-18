import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  Utensils, 
  RefreshCw, 
  LogOut, 
  X, 
  AlertTriangle,
  FileSpreadsheet,
  MapPin,
  BookOpenCheck,
  LayoutDashboard,
  Globe,
  User,
  BarChart3,
  Sparkles,
  QrCode as QrIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { Guestbook } from './Guestbook';
import logoIcon from '../assets/logoicon.png';
import type { RsvpGuest, CreateRsvpInput, UpdateRsvpInput, AttendanceStatus, InstitutionCategory } from '../types';
import { SCHOOL_UNITS, YAYASAN_NAME, ITBSS_NAME, ALL_INSTITUTION_UNITS } from '../types';

interface AdminDashboardProps {
  guests: RsvpGuest[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateGuest: (data: CreateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
  onUpdateGuest: (id: string, data: UpdateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
  onDeleteGuest: (id: string) => Promise<{ success: boolean; error: string | null }>;
  onCheckInToggle: (id: string, checkedIn: boolean, staffName?: string) => Promise<void>;
  onApproveGuest?: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  onLogoutAdmin: () => void;
  onGoToPublicPage: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  guests,
  isLoading,
  onRefresh,
  onCreateGuest,
  onUpdateGuest,
  onDeleteGuest,
  onCheckInToggle,
  onApproveGuest,
  onLogoutAdmin,
  onGoToPublicPage,
}) => {
  const [adminTab, setAdminTab] = useState<'guestbook' | 'master' | 'rekap' | 'pending'>('guestbook');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [checkInFilter, setCheckInFilter] = useState<string>('all');

  const pendingGuests = useMemo(() => {
    return guests.filter((g) => g.approval_status === 'pending');
  }, [guests]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<RsvpGuest | null>(null);
  const [viewingGuest, setViewingGuest] = useState<RsvpGuest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<RsvpGuest | null>(null);
  const [qrModalGuest, setQrModalGuest] = useState<RsvpGuest | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string | null>(null);

  // Form states
  const [adminKey, setAdminKey] = useState<'sekolah' | 'yayasan' | 'itbss'>('sekolah');
  const [formData, setFormData] = useState<CreateRsvpInput>({
    institution_category: 'sekolah',
    university_name: SCHOOL_UNITS[0],
    pic_name: '',
    pic_position: '',
    pic_phone: '',
    pic_email: '',
    attendance_status: 'hadir',
    attendee_count: 1,
    additional_attendees: '',
    dietary_requirements: 'Halal',
    presentation_topic: '',
    needs_projector: false,
    notes: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleAdminCategoryChange = (key: 'sekolah' | 'yayasan' | 'itbss') => {
    setAdminKey(key);
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
      nextName = SCHOOL_UNITS[0];
    }

    setFormData((prev) => ({
      ...prev,
      institution_category: nextCategory,
      university_name: nextName,
    }));
  };

  // Filtered list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.pic_phone.includes(searchTerm) ||
        (g.pic_position && g.pic_position.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (categoryFilter !== 'all') {
        if (categoryFilter === 'sekolah' && g.institution_category !== 'sekolah') return false;
        if (categoryFilter === 'yayasan' && g.institution_category !== 'yayasan') return false;
        if (categoryFilter === 'itbss' && g.institution_category !== 'itbss') return false;
      }

      if (unitFilter !== 'all') {
        if (g.university_name !== unitFilter) return false;
      }

      if (statusFilter !== 'all' && g.attendance_status !== statusFilter) return false;
      if (checkInFilter === 'checked_in' && !g.is_checked_in) return false;
      if (checkInFilter === 'not_checked_in' && g.is_checked_in) return false;

      return true;
    });
  }, [guests, searchTerm, categoryFilter, unitFilter, statusFilter, checkInFilter]);

  // Key KPI metrics
  const kpis = useMemo(() => {
    const total = guests.length;
    const hadir = guests.filter((g) => g.attendance_status === 'hadir');
    const tidakHadir = guests.filter((g) => g.attendance_status === 'tidak_hadir');
    const checkedIn = guests.filter((g) => g.is_checked_in);
    const pending = guests.filter((g) => g.approval_status === 'pending');
    const totalPaxHadir = hadir.reduce((sum, g) => sum + (g.attendee_count || 1), 0);

    const sekolahGuests = guests.filter((g) => g.institution_category === 'sekolah');
    const yayasanGuests = guests.filter((g) => g.institution_category === 'yayasan');
    const itbssGuests = guests.filter((g) => g.institution_category === 'itbss');

    return {
      total,
      hadirCount: hadir.length,
      tidakHadirCount: tidakHadir.length,
      checkedInCount: checkedIn.length,
      pendingCount: pending.length,
      totalPaxHadir,
      sekolahCount: sekolahGuests.length,
      yayasanCount: yayasanGuests.length,
      itbssCount: itbssGuests.length,
    };
  }, [guests]);

  // Unit Breakdown statistics for 12 School Units + YGPKB + ITBSS
  const unitStats = useMemo(() => {
    return ALL_INSTITUTION_UNITS.map((unit) => {
      const unitGuests = guests.filter((g) => g.university_name === unit);
      const hadirGuests = unitGuests.filter((g) => g.attendance_status === 'hadir');
      const checkedInGuests = unitGuests.filter((g) => g.is_checked_in);
      const totalPax = hadirGuests.reduce((sum, g) => sum + (g.attendee_count || 1), 0);
      const checkInRate = hadirGuests.length > 0 
        ? Math.round((checkedInGuests.length / hadirGuests.length) * 100) 
        : 0;

      let category: 'sekolah' | 'yayasan' | 'itbss' = 'sekolah';
      if (unit === YAYASAN_NAME) category = 'yayasan';
      else if (unit === ITBSS_NAME) category = 'itbss';

      return {
        unit,
        category,
        totalRegistered: unitGuests.length,
        hadirCount: hadirGuests.length,
        checkedInCount: checkedInGuests.length,
        totalPax,
        checkInRate,
      };
    });
  }, [guests]);

  // Open QR modal
  const handleOpenQr = (guest: RsvpGuest) => {
    if (guest.approval_status === 'rejected') {
      alert(`⛔ Pendaftaran ${guest.pic_name} (${guest.university_name}) ditolak oleh panitia.`);
      return;
    }
    if (guest.approval_status === 'pending') {
      alert(`⏳ Pendaftaran ${guest.pic_name} (${guest.university_name}) masih PENDING.`);
      return;
    }
    setQrModalGuest(guest);
    const qrData = JSON.stringify({
      event: 'Perayaan Natal Bersama YGPKB',
      id: guest.id,
      name: guest.pic_name,
      unit: guest.university_name,
      cat: guest.institution_category,
      pax: guest.attendee_count,
    });
    QRCode.toDataURL(qrData, { width: 350, margin: 2 })
      .then((url) => setModalQrUrl(url))
      .catch((err) => console.error(err));
  };

  const handleOpenEdit = (guest: RsvpGuest) => {
    setEditingGuest(guest);
    if (guest.institution_category === 'yayasan') {
      setAdminKey('yayasan');
    } else if (guest.institution_category === 'itbss') {
      setAdminKey('itbss');
    } else {
      setAdminKey('sekolah');
    }

    setFormData({
      institution_category: guest.institution_category,
      university_name: guest.university_name,
      pic_name: guest.pic_name,
      pic_position: guest.pic_position || '',
      pic_phone: guest.pic_phone,
      pic_email: guest.pic_email || '',
      attendance_status: guest.attendance_status,
      attendee_count: guest.attendee_count,
      additional_attendees: guest.additional_attendees || '',
      dietary_requirements: guest.dietary_requirements || '',
      presentation_topic: guest.presentation_topic || '',
      needs_projector: Boolean(guest.needs_projector),
      notes: guest.notes || '',
    });
    setModalError(null);
  };

  const handleOpenCreate = () => {
    setEditingGuest(null);
    setAdminKey('sekolah');
    setFormData({
      institution_category: 'sekolah',
      university_name: SCHOOL_UNITS[0],
      pic_name: '',
      pic_position: '',
      pic_phone: '',
      pic_email: '',
      attendance_status: 'hadir',
      attendee_count: 1,
      additional_attendees: '',
      dietary_requirements: 'Halal',
      presentation_topic: '',
      needs_projector: false,
      notes: '',
    });
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.university_name.trim() || !formData.pic_name.trim() || !formData.pic_phone.trim()) {
      setModalError('Unit / Lembaga, nama peserta, dan no. WhatsApp wajib diisi.');
      return;
    }

    setIsProcessing(true);
    try {
      if (editingGuest) {
        const res = await onUpdateGuest(editingGuest.id, formData);
        if (res.error) {
          setModalError(res.error);
        } else {
          setEditingGuest(null);
        }
      } else {
        const res = await onCreateGuest(formData);
        if (res.error) {
          setModalError(res.error);
        } else {
          setIsCreateModalOpen(false);
        }
      }
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGuest) return;
    setIsProcessing(true);
    try {
      await onDeleteGuest(deletingGuest.id);
      setDeletingGuest(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (guests.length === 0) return;

    const headers = [
      'ID',
      'Kategori',
      'Unit / Lembaga',
      'Nama Peserta',
      'Jabatan / Peran',
      'No WhatsApp',
      'Email',
      'Status Kehadiran',
      'Jumlah Pax',
      'Catatan',
      'Presensi Kehadiran',
      'Waktu Presensi',
      'Dicatat Oleh',
      'Waktu Pendaftaran',
    ];

    const rows = guests.map((g) => [
      `"${g.id}"`,
      `"${g.institution_category}"`,
      `"${g.university_name.replace(/"/g, '""')}"`,
      `"${g.pic_name.replace(/"/g, '""')}"`,
      `"${(g.pic_position || '').replace(/"/g, '""')}"`,
      `"'${g.pic_phone}"`,
      `"${(g.pic_email || '').replace(/"/g, '""')}"`,
      `"${g.attendance_status}"`,
      g.attendee_count,
      `"${(g.notes || '').replace(/"/g, '""')}"`,
      g.is_checked_in ? 'Hadir' : 'Belum Hadir',
      g.checked_in_at ? `"${new Date(g.checked_in_at).toLocaleString('id-ID')}"` : '""',
      `"${(g.checked_in_by || '').replace(/"/g, '""')}"`,
      `"${new Date(g.created_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Presensi_Natal_Internal_YGPKB_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 text-left">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
            <img src={logoIcon} alt="Logo Perayaan Natal" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-900 text-emerald-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Admin Presensi Natal
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                Perayaan Natal Bersama
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Dashboard Presensi Perayaan Natal Internal
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
              12 Unit Sekolah • Yayasan YGPKB • ITBSS
            </p>
          </div>
        </div>

        {/* Actions bar (Grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Peserta Manual</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onGoToPublicPage}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all active:scale-[0.98]"
            title="Lihat formulir pendaftaran publik"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Form Publik</span>
          </button>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
            <button
              onClick={onRefresh}
              title="Muat ulang data"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.98] text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="sm:hidden">Refresh Data</span>
            </button>

            <button
              onClick={onLogoutAdmin}
              title="Keluar dari mode admin"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-200/60 p-1 sm:p-1.5 rounded-2xl mb-4 sm:mb-6 w-full sm:w-fit border border-slate-200">
        <button
          onClick={() => setAdminTab('guestbook')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'guestbook'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpenCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="hidden sm:inline">Presensi Meja Depan (Buku Tamu)</span>
          <span className="sm:hidden">Meja Depan</span>
        </button>

        <button
          onClick={() => setAdminTab('master')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'master'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="hidden sm:inline">Master Data Peserta</span>
          <span className="sm:hidden">Master Data</span>
        </button>

        <button
          onClick={() => setAdminTab('rekap')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'rekap'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="hidden sm:inline">Rekap Per Unit (14 Unit)</span>
          <span className="sm:hidden">Rekap Unit</span>
        </button>

        {pendingGuests.length > 0 && (
          <button
            onClick={() => setAdminTab('pending')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
              adminTab === 'pending'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Pending ({pendingGuests.length})</span>
          </button>
        )}
      </div>

      {adminTab === 'guestbook' ? (
        <Guestbook
          guests={guests}
          isLoading={isLoading}
          onCheckIn={onCheckInToggle}
          onAddWalkIn={onCreateGuest}
        />
      ) : adminTab === 'rekap' ? (
        /* REKAP KEHADIRAN PER UNIT */
        <div className="space-y-4 text-left">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Rekap Kehadiran Per Unit & Lembaga
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Distribusi kehadiran 12 Unit Sekolah, Yayasan Gereja Protestan Kampung Bali, dan ITBSS.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                Total Hadir: {kpis.checkedInCount} / {kpis.hadirCount} Peserta
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {unitStats.map((item) => (
              <div
                key={item.unit}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      item.category === 'yayasan'
                        ? 'bg-purple-100 text-purple-700'
                        : item.category === 'itbss'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.category === 'yayasan' ? 'Yayasan' : item.category === 'itbss' ? 'Perguruan Tinggi' : 'Unit Sekolah'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {item.checkInRate}% Tiba
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-tight mb-2">
                    {item.unit}
                  </h3>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.checkInRate >= 80 ? 'bg-emerald-500' : item.checkInRate >= 40 ? 'bg-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.checkInRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Terdaftar</span>
                    <span className="font-black text-slate-800 text-sm">{item.totalRegistered}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Bisa Hadir</span>
                    <span className="font-black text-slate-800 text-sm">{item.hadirCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase">Sudah Tiba</span>
                    <span className="font-black text-emerald-600 text-sm">{item.checkedInCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : adminTab === 'pending' ? (
        /* PENDING TAB */
        <div className="space-y-4 text-left">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="w-5 h-5" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Pendaftaran Menunggu Persetujuan
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Daftar pendaftaran yang memerlukan persetujuan panitia.
              </p>
            </div>
            <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 self-start sm:self-auto">
              Total Pending: {pendingGuests.length} Pendaftaran
            </div>
          </div>

          {pendingGuests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-sm">Tidak Ada Pendaftaran yang Menunggu Persetujuan</p>
              <p className="text-xs text-slate-400 mt-1">
                Semua peserta telah disetujui untuk perayaan Natal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {pendingGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="bg-white rounded-2xl border-2 border-amber-200 shadow-xs p-4 sm:p-5 space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      Menunggu Approval
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(guest.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {guest.university_name}
                    </h3>
                    <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{guest.pic_name}</span>
                      {guest.pic_position && <span className="text-slate-400 font-normal">({guest.pic_position})</span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <a
                        href={`https://wa.me/${guest.pic_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{guest.pic_phone}</span>
                      </a>
                    </div>
                  </div>

                  {guest.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                      <span className="font-bold not-italic text-slate-400 text-[10px] block uppercase mb-0.5">Catatan:</span>
                      "{guest.notes}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onApproveGuest && onApproveGuest(guest.id, 'approved')}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ Setujui (Approve)</span>
                    </button>

                    <button
                      onClick={() => onApproveGuest && onApproveGuest(guest.id, 'rejected')}
                      className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>✕ Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MASTER DATA TAB */
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-4 sm:mb-6">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Terdaftar</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.total}</span>
                <span className="text-[11px] sm:text-xs text-slate-400">Orang</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">12 Unit, Yayasan, ITBSS</p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bisa Hadir</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">{kpis.hadirCount}</span>
                <span className="text-[11px] sm:text-xs text-slate-400">Peserta</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" /> Terkonfirmasi Hadir
              </p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs bg-linear-to-br from-emerald-50/50 to-white">
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Pax Konsumsi</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">{kpis.totalPaxHadir}</span>
                <span className="text-[11px] sm:text-xs text-emerald-600">Porsi</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <Utensils className="w-3 h-3 shrink-0" /> Konsumsi Natal
              </p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sudah Tiba</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black text-teal-600">{kpis.checkedInCount}</span>
                <span className="text-[11px] sm:text-xs text-slate-400">/ {kpis.hadirCount}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-teal-600 font-medium mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" /> Presensi QR
              </p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Berhalangan</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black text-rose-500">{kpis.tidakHadirCount}</span>
                <span className="text-[11px] sm:text-xs text-slate-400">Orang</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Tidak dapat hadir</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari unit, nama peserta, WhatsApp..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full md:w-auto">
              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setUnitFilter('all');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="sekolah">Unit Sekolah (12 Unit)</option>
                <option value="yayasan">Yayasan YGPKB</option>
                <option value="itbss">ITBSS</option>
              </select>

              {/* Unit Specific Filter */}
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
              >
                <option value="all">Semua Unit</option>
                {categoryFilter === 'all' || categoryFilter === 'sekolah' ? (
                  <optgroup label="Unit Sekolah (12 Unit)">
                    {SCHOOL_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </optgroup>
                ) : null}
                {categoryFilter === 'all' || categoryFilter === 'yayasan' ? (
                  <optgroup label="Yayasan">
                    <option value={YAYASAN_NAME}>YGPKB</option>
                  </optgroup>
                ) : null}
                {categoryFilter === 'all' || categoryFilter === 'itbss' ? (
                  <optgroup label="Perguruan Tinggi">
                    <option value={ITBSS_NAME}>ITBSS</option>
                  </optgroup>
                ) : null}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="hadir">Bisa Hadir</option>
                <option value="tidak_hadir">Berhalangan</option>
              </select>

              {/* Check-In */}
              <select
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
              >
                <option value="all">Semua Presensi</option>
                <option value="checked_in">Sudah Check-In</option>
                <option value="not_checked_in">Belum Check-In</option>
              </select>
            </div>
          </div>

          {/* MOBILE VIEW: Card List (< md) */}
          <div className="block md:hidden space-y-3 mb-6">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs font-semibold">Memuat data peserta...</p>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <p className="text-sm font-semibold text-slate-600">Tidak ada data peserta yang cocok dengan filter.</p>
              </div>
            ) : (
              filteredGuests.map((guest) => {
                const isAttending = guest.attendance_status === 'hadir';
                return (
                  <div
                    key={guest.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 text-left transition-all"
                  >
                    {/* Header: Category Badge & Attendance Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${
                        guest.institution_category === 'yayasan'
                          ? 'bg-purple-100 text-purple-700'
                          : guest.institution_category === 'itbss'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {guest.institution_category === 'yayasan'
                          ? 'Yayasan YGPKB'
                          : guest.institution_category === 'itbss'
                          ? 'ITBSS'
                          : 'Unit Sekolah'}
                      </span>

                      {isAttending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          <XCircle className="w-3 h-3" /> Berhalangan
                        </span>
                      )}
                    </div>

                    {/* Unit & Peserta */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {guest.university_name}
                      </h3>
                      <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{guest.pic_name}</span>
                        {guest.pic_position && <span className="text-[11px] font-normal text-slate-400">({guest.pic_position})</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <a
                          href={`https://wa.me/${guest.pic_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold active:scale-95 transition-all"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{guest.pic_phone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Catatan jika ada */}
                    {guest.notes && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                        <span className="font-bold not-italic text-slate-400 text-[10px] block uppercase mb-0.5">Catatan:</span>
                        "{guest.notes}"
                      </div>
                    )}

                    {/* Presensi Check-In Button */}
                    {isAttending && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="text-[11px]">
                          <span className="text-slate-400">Presensi: </span>
                          {guest.is_checked_in ? (
                            <span className="font-bold text-teal-700">✓ Sudah Hadir</span>
                          ) : (
                            <span className="font-semibold text-slate-500">Belum Hadir</span>
                          )}
                        </div>
                        <button
                          onClick={() => onCheckInToggle(guest.id, !guest.is_checked_in)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            guest.is_checked_in
                              ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                          }`}
                        >
                          {guest.is_checked_in ? 'Batalkan Presensi' : '+ Catat Hadir'}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons Toolbar */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenQr(guest)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-[10px] font-bold active:scale-95 transition-all"
                      >
                        <QrIcon className="w-4 h-4 text-emerald-600" />
                        <span>QR Tiket</span>
                      </button>

                      <button
                        onClick={() => setViewingGuest(guest)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-[10px] font-bold active:scale-95 transition-all"
                      >
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span>Detail</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(guest)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-700 hover:text-amber-700 text-[10px] font-bold active:scale-95 transition-all"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingGuest(guest)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-[10px] font-bold active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP VIEW: Full Data Table (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Kategori & Unit</th>
                    <th className="px-4 py-3.5">Nama & Kontak</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Pax</th>
                    <th className="px-4 py-3.5">Catatan</th>
                    <th className="px-4 py-3.5 text-center">Presensi</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Memuat data peserta...
                      </td>
                    </tr>
                  ) : filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        Tidak ada data peserta yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest) => {
                      return (
                        <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Unit */}
                          <td className="px-4 py-3.5">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm inline-block mb-1 ${
                              guest.institution_category === 'yayasan'
                                ? 'bg-purple-100 text-purple-700'
                                : guest.institution_category === 'itbss'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {guest.institution_category === 'yayasan'
                                ? 'Yayasan'
                                : guest.institution_category === 'itbss'
                                ? 'ITBSS'
                                : 'Unit Sekolah'}
                            </span>
                            <p className="font-bold text-slate-900">{guest.university_name}</p>
                          </td>

                          {/* PIC */}
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-800">{guest.pic_name}</p>
                            {guest.pic_position && (
                              <p className="text-[11px] text-slate-400">{guest.pic_position}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <a
                                href={`https://wa.me/${guest.pic_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {guest.pic_phone}
                              </a>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {guest.attendance_status === 'hadir' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Hadir
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" /> Berhalangan
                              </span>
                            )}
                          </td>

                          {/* Pax */}
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                            {guest.attendance_status === 'tidak_hadir' ? '-' : `${guest.attendee_count} pax`}
                          </td>

                          {/* Catatan */}
                          <td className="px-4 py-3.5 max-w-xs">
                            {guest.notes ? (
                              <p className="text-xs text-slate-600 line-clamp-2">{guest.notes}</p>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>

                          {/* Presensi Check-In */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {guest.attendance_status === 'tidak_hadir' ? (
                              <span className="text-xs text-slate-400 italic">-</span>
                            ) : (
                              <button
                                onClick={() => onCheckInToggle(guest.id, !guest.is_checked_in)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                  guest.is_checked_in
                                    ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                }`}
                              >
                                {guest.is_checked_in ? '✓ Sudah Hadir' : '+ Catat Hadir'}
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenQr(guest)}
                                title="Lihat QR Code"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <QrIcon className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setViewingGuest(guest)}
                                title="Lihat Detail"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleOpenEdit(guest)}
                                title="Edit Data"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeletingGuest(guest)}
                                title="Hapus Data"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL: QR CODE */}
      {qrModalGuest && modalQrUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full p-5 sm:p-6 text-center relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setQrModalGuest(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
              E-Tiket Presensi Natal
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-2">{qrModalGuest.university_name}</h3>
            <p className="text-xs text-slate-500 mb-4">{qrModalGuest.pic_name}</p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-4">
              <img src={modalQrUrl} alt="QR Code" className="w-48 h-48 sm:w-52 sm:h-52 mx-auto" />
            </div>

            <p className="text-[11px] text-slate-400 mb-4">
              Tunjukkan QR Code ini ke petugas meja resepsionis untuk presensi otomatis 1 detik.
            </p>

            <button
              onClick={() => setQrModalGuest(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT */}
      {(isCreateModalOpen || editingGuest) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full p-5 sm:p-8 text-left relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingGuest(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                {editingGuest ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingGuest ? 'Edit Data Peserta' : 'Tambah Peserta Baru (Manual)'}
                </h2>
                <p className="text-xs text-slate-500">
                  Perayaan Natal Bersama • Unit Sekolah, YGPKB & ITBSS
                </p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Instansi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdminCategoryChange('sekolah')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      adminKey === 'sekolah'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏫 Unit Sekolah (12)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminCategoryChange('yayasan')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      adminKey === 'yayasan'
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⛪ Yayasan YGPKB
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminCategoryChange('itbss')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      adminKey === 'itbss'
                        ? 'border-amber-600 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🎓 ITBSS
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {adminKey === 'sekolah' ? 'Pilih Unit Sekolah *' : 'Nama Lembaga *'}
                </label>
                {adminKey === 'sekolah' ? (
                  <select
                    value={formData.university_name}
                    onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-bold text-slate-800 bg-white"
                  >
                    {SCHOOL_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.university_name}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 outline-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Peserta *</label>
                  <input
                    type="text"
                    value={formData.pic_name}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    placeholder="Nama Lengkap"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="tel"
                    value={formData.pic_phone}
                    onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                    placeholder="081234567890"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan / Peran</label>
                  <input
                    type="text"
                    value={formData.pic_position}
                    onChange={(e) => setFormData({ ...formData, pic_position: e.target.value })}
                    placeholder="Contoh: Guru, Staf, Kepala Sekolah"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kehadiran</label>
                  <select
                    value={formData.attendance_status}
                    onChange={(e) => setFormData({ ...formData, attendance_status: e.target.value as AttendanceStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                  >
                    <option value="hadir">Bisa Hadir</option>
                    <option value="tidak_hadir">Berhalangan Hadir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan khusus panitia"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                ></textarea>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingGuest(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-200 disabled:bg-emerald-400"
                >
                  {isProcessing ? 'Menyimpan...' : editingGuest ? 'Perbarui Data' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS */}
      {viewingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-8 text-left relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setViewingGuest(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Detail Peserta
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{viewingGuest.university_name}</h2>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Kategori</p>
                  <p className="font-semibold text-slate-800 capitalize">
                    {viewingGuest.institution_category === 'yayasan' ? 'Yayasan YGPKB' : viewingGuest.institution_category === 'itbss' ? 'ITBSS' : 'Unit Sekolah'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Status Kehadiran</p>
                  <p className="font-bold text-slate-800">{viewingGuest.attendance_status === 'hadir' ? 'Bisa Hadir' : 'Berhalangan'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Nama Peserta</p>
                  <p className="font-semibold text-slate-800">{viewingGuest.pic_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">No. WhatsApp</p>
                  <p className="font-semibold text-emerald-700">{viewingGuest.pic_phone}</p>
                </div>
              </div>

              {viewingGuest.pic_position && (
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Jabatan / Peran</p>
                  <p className="font-semibold text-slate-800">{viewingGuest.pic_position}</p>
                </div>
              )}

              {viewingGuest.notes && (
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Catatan</p>
                  <p className="bg-slate-50 p-2 rounded-xl text-slate-700 mt-1">{viewingGuest.notes}</p>
                </div>
              )}

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Status Presensi</p>
                <p className="mt-0.5">
                  {viewingGuest.is_checked_in ? (
                    <span className="text-emerald-700 font-bold">
                      ✓ Sudah Presensi ({viewingGuest.checked_in_at ? new Date(viewingGuest.checked_in_at).toLocaleTimeString('id-ID') : ''} WIB)
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Belum hadir di lokasi</span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-5">
              <button
                onClick={() => setViewingGuest(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE */}
      {deletingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-8 text-center relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900">Hapus Data Peserta?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Apakah Anda yakin ingin menghapus data peserta <strong className="text-slate-800">{deletingGuest.pic_name}</strong> dari <strong className="text-slate-800">{deletingGuest.university_name}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingGuest(null)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200 disabled:bg-rose-400"
              >
                {isProcessing ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};