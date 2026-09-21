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
  QrCode as QrIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { Guestbook } from './Guestbook';
import { UniversityCombobox } from './UniversityCombobox';
import logoIcon from '../assets/logoicon.png';
import type { RsvpGuest, CreateRsvpInput, UpdateRsvpInput, AttendanceStatus, InstitutionCategory } from '../types';

interface AdminDashboardProps {
  guests: RsvpGuest[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateGuest: (data: CreateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
  onUpdateGuest: (id: string, data: UpdateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
  onDeleteGuest: (id: string) => Promise<{ success: boolean; error: string | null }>;
  onCheckInToggle: (id: string, checkedIn: boolean, staffName?: string) => Promise<void>;
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
  onLogoutAdmin,
  onGoToPublicPage,
}) => {
  const [adminTab, setAdminTab] = useState<'guestbook' | 'master'>('guestbook');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [checkInFilter, setCheckInFilter] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<RsvpGuest | null>(null);
  const [viewingGuest, setViewingGuest] = useState<RsvpGuest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<RsvpGuest | null>(null);
  const [qrModalGuest, setQrModalGuest] = useState<RsvpGuest | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateRsvpInput>({
    institution_category: 'universitas',
    university_name: '',
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

  // Filtered list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.pic_phone.includes(searchTerm) ||
        (g.presentation_topic && g.presentation_topic.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (categoryFilter !== 'all' && g.institution_category !== categoryFilter) return false;
      if (statusFilter !== 'all' && g.attendance_status !== statusFilter) return false;
      if (checkInFilter === 'checked_in' && !g.is_checked_in) return false;
      if (checkInFilter === 'not_checked_in' && g.is_checked_in) return false;

      return true;
    });
  }, [guests, searchTerm, categoryFilter, statusFilter, checkInFilter]);

  // Key KPI metrics
  const kpis = useMemo(() => {
    const total = guests.length;
    const hadir = guests.filter((g) => g.attendance_status === 'hadir');
    const tidakHadir = guests.filter((g) => g.attendance_status === 'tidak_hadir');
    const checkedIn = guests.filter((g) => g.is_checked_in);
    const totalPaxHadir = hadir.reduce((sum, g) => sum + (g.attendee_count || 1), 0);
    const projectorCount = hadir.filter((g) => g.needs_projector).length;

    return {
      total,
      hadirCount: hadir.length,
      tidakHadirCount: tidakHadir.length,
      checkedInCount: checkedIn.length,
      totalPaxHadir,
      projectorCount,
    };
  }, [guests]);

  // Open QR modal
  const handleOpenQr = (guest: RsvpGuest) => {
    setQrModalGuest(guest);
    const qrData = JSON.stringify({
      event: 'Makrab Career Day 2026',
      venue: 'Restoran Gajah Mada Pontianak',
      id: guest.id,
      name: guest.pic_name,
      inst: guest.university_name,
      cat: guest.institution_category,
      pax: guest.attendee_count,
    });
    QRCode.toDataURL(qrData, { width: 350, margin: 2 })
      .then((url) => setModalQrUrl(url))
      .catch((err) => console.error(err));
  };

  const handleOpenEdit = (guest: RsvpGuest) => {
    setEditingGuest(guest);
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
    setFormData({
      institution_category: 'universitas',
      university_name: '',
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
      setModalError('Nama universitas/lembaga, nama PIC, dan no. WhatsApp wajib diisi.');
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
      'Nama Universitas / Lembaga',
      'Nama PIC',
      'Jabatan',
      'No WhatsApp',
      'Email',
      'Status Kehadiran',
      'Jumlah Pax',
      'Rekan Pendamping',
      'Dietary / Konsumsi',
      'Topik Presentasi',
      'Butuh Proyektor',
      'Catatan',
      'Sudah Check In (Restoran Gajah Mada)',
      'Waktu Check In',
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
      `"${(g.additional_attendees || '').replace(/"/g, '""')}"`,
      `"${(g.dietary_requirements || '').replace(/"/g, '""')}"`,
      `"${(g.presentation_topic || '').replace(/"/g, '""')}"`,
      g.needs_projector ? 'Ya' : 'Tidak',
      `"${(g.notes || '').replace(/"/g, '""')}"`,
      g.is_checked_in ? 'Ya' : 'Tidak',
      g.checked_in_at ? `"${new Date(g.checked_in_at).toLocaleString('id-ID')}"` : '""',
      `"${new Date(g.created_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Makrab_Career_Day_Restoran_Gajah_Mada_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 text-left">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
            <img src={logoIcon} alt="Logo Career Day" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-900 text-indigo-100">
                Admin Portal
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Restoran Gajah Mada Pontianak
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Pengelolaan Tamu Makrab 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manajemen kehadiran Delegasi Universitas, Panitia Sekolah, & Yayasan Gereja Protestan Kampung Bali.
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGoToPublicPage}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all active:scale-[0.98]"
            title="Lihat formulir RSVP publik"
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Web Publik</span>
          </button>

          <button
            onClick={onRefresh}
            title="Muat ulang data"
            className="p-1.5 sm:p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tamu Manual</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            title="Keluar dari mode admin"
            className="flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Subtab Switcher (Responsive: 2 tombol sejajar di HP) */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-200/60 p-1 sm:p-1.5 rounded-2xl mb-4 sm:mb-6 w-full sm:w-fit border border-slate-200">
        <button
          onClick={() => setAdminTab('guestbook')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'guestbook'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpenCheck className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Presensi Buku Tamu (Meja Resepsionis)</span>
          <span className="sm:hidden">Buku Tamu (Presensi)</span>
        </button>

        <button
          onClick={() => setAdminTab('master')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'master'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Master Data & Rekap Konsumsi</span>
          <span className="sm:hidden">Master Data (CRUD)</span>
        </button>
      </div>

      {adminTab === 'guestbook' ? (
        <Guestbook
          guests={guests}
          isLoading={isLoading}
          onCheckIn={onCheckInToggle}
          onAddWalkIn={onCreateGuest}
        />
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-4 sm:mb-6">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Undangan</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.total}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Instansi</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Univ, Sekolah, Yayasan</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bisa Hadir</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{kpis.hadirCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Lembaga</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> Terkonfirmasi
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs bg-linear-to-br from-indigo-50/50 to-white">
          <p className="text-[10px] sm:text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Pax Konsumsi</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-indigo-700">{kpis.totalPaxHadir}</span>
            <span className="text-[11px] sm:text-xs text-indigo-500">Porsi</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
            <Utensils className="w-3 h-3 shrink-0" /> Restoran Gajah Mada
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Di Restoran</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-teal-600">{kpis.checkedInCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">/ {kpis.hadirCount}</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-teal-600 font-medium mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" /> Sudah Check-In
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Berhalangan</p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-rose-500">{kpis.tidakHadirCount}</span>
            <span className="text-[11px] sm:text-xs text-slate-400">Instansi</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">Tidak dapat hadir</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kampus, PIC, no HP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
          >
            <option value="all">Semua Kategori Asal</option>
            <option value="universitas">Universitas Mitra</option>
            <option value="sekolah">Panitia Sekolah</option>
            <option value="yayasan">Yayasan Gereja</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Bisa Hadir</option>
            <option value="tidak_hadir">Berhalangan</option>
          </select>

          {/* Check-In */}
          <select
            value={checkInFilter}
            onChange={(e) => setCheckInFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none"
          >
            <option value="all">Semua Presensi</option>
            <option value="checked_in">Sudah Check-In</option>
            <option value="not_checked_in">Belum Check-In</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Kategori & Lembaga</th>
                <th className="px-4 py-3.5">PIC & Kontak</th>
                <th className="px-4 py-3.5 text-center">Kehadiran</th>
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
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data tamu yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  return (
                    <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Lembaga */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm inline-block mb-1 ${
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
                            : 'Universitas'}
                        </span>
                        <p className="font-bold text-slate-900">{guest.university_name}</p>
                      </td>

                      {/* PIC */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{guest.pic_name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <a
                            href={`https://wa.me/${guest.pic_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Phone className="w-3 h-3" />
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

                      {/* Check-In */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {guest.attendance_status === 'tidak_hadir' ? (
                          <span className="text-xs text-slate-400 italic">-</span>
                        ) : (
                          <button
                            onClick={() => onCheckInToggle(guest.id, !guest.is_checked_in)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              guest.is_checked_in
                                ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-teal-600 hover:text-white hover:border-teal-600'
                            }`}
                          >
                            {guest.is_checked_in ? '✓ Sudah Tiba' : '+ Check-In'}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenQr(guest)}
                            title="Lihat QR Code Tamu"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <QrIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewingGuest(guest)}
                            title="Lihat Detail"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setQrModalGuest(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              QR Code Delegasi
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-2">{qrModalGuest.university_name}</h3>
            <p className="text-xs text-slate-500 mb-4">{qrModalGuest.pic_name}</p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-4">
              <img src={modalQrUrl} alt="QR Code" className="w-52 h-52 mx-auto" />
            </div>

            <p className="text-[11px] text-slate-400 mb-4">
              Tamu dapat menunjukkan QR code ini kepada panitia resepsionis Restoran Gajah Mada.
            </p>

            <button
              onClick={() => setQrModalGuest(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT */}
      {(isCreateModalOpen || editingGuest) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 text-left relative my-8 animate-in fade-in zoom-in-95 duration-200">
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
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {editingGuest ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingGuest ? 'Edit Data Delegasi' : 'Tambah Delegasi Baru (Manual)'}
                </h2>
                <p className="text-xs text-slate-500">
                  Restoran Gajah Mada Pontianak • Makrab Career Day 2026
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
                <select
                  value={formData.institution_category}
                  onChange={(e) => setFormData({ ...formData, institution_category: e.target.value as InstitutionCategory })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                >
                  <option value="universitas">Universitas Mitra</option>
                  <option value="sekolah">Panitia Sekolah</option>
                  <option value="yayasan">Yayasan Gereja Protestan Kampung Bali</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Universitas / Lembaga *</label>
                {formData.institution_category === 'universitas' ? (
                  <UniversityCombobox
                    value={formData.university_name}
                    onChange={(val) => setFormData({ ...formData, university_name: val })}
                    placeholder="Ketik untuk mencari atau pilih universitas..."
                  />
                ) : (
                  <input
                    type="text"
                    value={formData.university_name}
                    onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                    placeholder="Contoh: Yayasan / Panitia Sekolah"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC *</label>
                  <input
                    type="text"
                    value={formData.pic_name}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    placeholder="Nama Lengkap"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.pic_email}
                    onChange={(e) => setFormData({ ...formData, pic_email: e.target.value })}
                    placeholder="kontak@univ.ac.id"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Pax Hadir</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.attendee_count}
                    onChange={(e) =>
                      setFormData({ ...formData, attendee_count: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rekan Pendamping</label>
                  <input
                    type="text"
                    value={formData.additional_attendees}
                    onChange={(e) => setFormData({ ...formData, additional_attendees: e.target.value })}
                    placeholder="Nama staf/rekan lain"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan khusus panitia"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
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
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 disabled:bg-indigo-400"
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-left relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setViewingGuest(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Detail Delegasi
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{viewingGuest.university_name}</h2>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Kategori</p>
                  <p className="font-semibold text-slate-800 capitalize">{viewingGuest.institution_category}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Status Kehadiran</p>
                  <p className="font-bold text-slate-800">{viewingGuest.attendance_status === 'hadir' ? 'Bisa Hadir' : 'Berhalangan'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Nama PIC</p>
                  <p className="font-semibold text-slate-800">{viewingGuest.pic_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">No. WhatsApp</p>
                  <p className="font-semibold text-indigo-600">{viewingGuest.pic_phone}</p>
                </div>
              </div>

              {viewingGuest.attendance_status === 'hadir' && (
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Pax Konsumsi</p>
                  <p className="font-semibold text-slate-800">{viewingGuest.attendee_count} Orang (Restoran Gajah Mada)</p>
                </div>
              )}

              {viewingGuest.notes && (
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Catatan / Pesan</p>
                  <p className="bg-slate-50 p-2 rounded-xl text-slate-700 mt-1">{viewingGuest.notes}</p>
                </div>
              )}

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Status Presensi (Restoran Gajah Mada)</p>
                <p className="mt-0.5">
                  {viewingGuest.is_checked_in ? (
                    <span className="text-emerald-700 font-bold">
                      ✓ Sudah Check-In ({viewingGuest.checked_in_at ? new Date(viewingGuest.checked_in_at).toLocaleTimeString('id-ID') : ''} WIB)
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Belum tiba di lokasi</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900">Hapus Data Tamu?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Apakah Anda yakin ingin menghapus data delegasi <strong className="text-slate-800">{deletingGuest.university_name}</strong>?
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
