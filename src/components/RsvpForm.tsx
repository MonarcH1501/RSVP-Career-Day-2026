import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Send, 
  Sparkles,
  Calendar,
  Printer,
  RotateCcw,
  Church,
  Download,
  School,
  GraduationCap,
  Search,
  Copy,
  Check,
  Share2,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { 
  SCHOOL_UNITS, 
  YAYASAN_NAME, 
  ITBSS_NAME, 
  ENABLE_QR_SCAN,
  type SchoolUnit,
  type CreateRsvpInput, 
  type AttendanceStatus, 
  type InstitutionCategory, 
  type RsvpGuest 
} from '../types';

export type ChristmasCategoryKey = 'sekolah' | 'yayasan' | 'itbss';

interface RsvpFormProps {
  guests?: RsvpGuest[];
  onSubmitRsvp: (data: CreateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
}

export const RsvpForm: React.FC<RsvpFormProps> = ({ guests = [], onSubmitRsvp }) => {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<ChristmasCategoryKey>('sekolah');
  const [selectedUnit, setSelectedUnit] = useState<SchoolUnit>('TK 1');

  const [formData, setFormData] = useState<CreateRsvpInput>({
    institution_category: 'sekolah',
    university_name: 'TK 1',
    pic_name: '',
    pic_position: '',
    pic_phone: '',
    pic_email: '',
    attendance_status: 'hadir',
    attendee_count: 1,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedGuest, setSubmittedGuest] = useState<RsvpGuest | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Fitur Cek Tiket & Anti-Hilang
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [rememberedGuest, setRememberedGuest] = useState<RsvpGuest | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync ticket from URL (?ticket=ID) or localStorage on load
  useEffect(() => {
    if (!guests || guests.length === 0) return;

    // 1. Cek query parameter ?ticket=...
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticket');
    if (ticketId) {
      const match = guests.find((g) => g.id === ticketId);
      if (match) {
        setSubmittedGuest(match);
        return;
      }
    }

    // 2. Cek memori browser HP (localStorage)
    const savedId = localStorage.getItem('natal_ygpkb_my_guest_id') || localStorage.getItem('career_day_my_guest_id');
    if (savedId) {
      const match = guests.find((g) => g.id === savedId);
      if (match) {
        setRememberedGuest(match);
      }
    }
  }, [guests]);

  // Generate QR code saat form berhasil disubmit
  useEffect(() => {
    if (
      submittedGuest && 
      submittedGuest.attendance_status === 'hadir' &&
      submittedGuest.approval_status !== 'rejected'
    ) {
      const qrPayload = JSON.stringify({
        natalYGPKB: true,
        id: submittedGuest.id,
        name: submittedGuest.pic_name,
        unit: submittedGuest.university_name,
        cat: submittedGuest.institution_category,
      });

      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR code', err));
    } else {
      setQrCodeUrl(null);
    }
  }, [submittedGuest]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusSelect = (status: AttendanceStatus) => {
    setFormData((prev) => ({ ...prev, attendance_status: status }));
  };

  const handleCategorySelect = (key: ChristmasCategoryKey) => {
    setSelectedCategoryKey(key);
    let nextCategory: InstitutionCategory = 'sekolah';
    let nextName = '';

    if (key === 'sekolah') {
      nextCategory = 'sekolah';
      nextName = selectedUnit || 'TK 1';
    } else if (key === 'yayasan') {
      nextCategory = 'yayasan';
      nextName = YAYASAN_NAME;
    } else if (key === 'itbss') {
      nextCategory = 'itbss';
      nextName = ITBSS_NAME;
    }

    setFormData((prev) => ({
      ...prev,
      institution_category: nextCategory,
      university_name: nextName,
    }));
  };

  const handleUnitSelect = (unit: SchoolUnit) => {
    setSelectedUnit(unit);
    setFormData((prev) => ({
      ...prev,
      institution_category: 'sekolah',
      university_name: unit,
    }));
  };

  const handleCopyTicketLink = () => {
    if (!submittedGuest) return;
    const ticketUrl = `${window.location.origin}${window.location.pathname}?ticket=${submittedGuest.id}`;
    navigator.clipboard.writeText(ticketUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFeedback(null);
    const clean = searchQuery.replace(/\D/g, '');
    if (!clean || clean.length < 4) {
      setSearchFeedback('Mohon masukkan minimal 4 digit nomor WhatsApp.');
      return;
    }

    if (!guests || guests.length === 0) {
      setSearchFeedback('Data absensi sedang dimuat. Silakan tunggu sebentar.');
      return;
    }

    const matches = guests.filter((g) => g.pic_phone.replace(/\D/g, '').includes(clean));
    if (matches.length === 0) {
      setSearchFeedback(`Tidak ditemukan data pendaftaran dengan nomor WhatsApp "${searchQuery}".`);
      return;
    }

    const found = matches[0];
    setSubmittedGuest(found);
    localStorage.setItem('natal_ygpkb_my_guest_id', found.id);
    const newUrl = `${window.location.pathname}?ticket=${found.id}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.university_name.trim()) {
      setErrorMessage('Mohon pilih unit sekolah atau asal lembaga Anda.');
      return;
    }
    if (!formData.pic_name.trim()) {
      setErrorMessage('Nama lengkap peserta wajib diisi.');
      return;
    }
    if (!formData.pic_phone.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmitRsvp({
        ...formData,
        attendee_count: 1,
        approval_status: 'approved',
      });

      if (res.error) {
        setErrorMessage(`Terjadi kendala: ${res.error}`);
      } else if (res.data) {
        setSubmittedGuest(res.data);
        localStorage.setItem('natal_ygpkb_my_guest_id', res.data.id);

        const newUrl = `${window.location.pathname}?ticket=${res.data.id}`;
        window.history.replaceState({}, '', newUrl);

        if (formData.attendance_status === 'hadir') {
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#059669', '#dc2626', '#f59e0b', '#ffffff'],
            });
          } catch (_) {}
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengirim konfirmasi presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedGuest(null);
    setQrCodeUrl(null);
    window.history.replaceState({}, '', window.location.pathname);
    setFormData({
      institution_category: 'sekolah',
      university_name: selectedUnit || 'TK 1',
      pic_name: '',
      pic_position: '',
      pic_phone: '',
      pic_email: '',
      attendance_status: 'hadir',
      attendee_count: 1,
      notes: '',
    });
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl || !submittedGuest) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `QR_Natal_${submittedGuest.pic_name.replace(/\s+/g, '_')}_${submittedGuest.university_name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // SUCCESS / CONFIRMATION VIEW
  if (submittedGuest) {
    const isAttending = submittedGuest.attendance_status === 'hadir';

    // JIKA BERHALANGAN: CUKUP TAMPILKAN UCAPAN TERIMA KASIH (TANPA TIKET & TANPA QR)
    if (!isAttending) {
      return (
        <div className="max-w-lg mx-auto py-6 sm:py-12 px-3 sm:px-4 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
              Konfirmasi Diterima
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Terima Kasih atas Konfirmasinya
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              Yth. Bapak/Ibu <strong className="text-slate-900">{submittedGuest.pic_name}</strong> dari{' '}
              <strong className="text-emerald-700">{submittedGuest.university_name}</strong>.
            </p>

            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
              Konfirmasi bahwa Bapak/Ibu <strong>berhalangan hadir</strong> pada acara <strong>Perayaan Natal Bersama</strong> telah kami catat dengan baik. Panitia dan pengurus sangat mengapresiasi perhatian Bapak/Ibu. Selamat menyambut Natal!
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Asal Unit / Lembaga:</span>
                <span className="font-bold text-slate-800 text-right">{submittedGuest.university_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Status Kehadiran:</span>
                <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                  <XCircle className="w-3 h-3" />
                  Berhalangan Hadir
                </span>
              </div>
              {submittedGuest.notes && (
                <div className="pt-1">
                  <span className="text-slate-400 font-medium block mb-1">Pesan / Ucapan:</span>
                  <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    "{submittedGuest.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={resetForm}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Isi Formulir untuk Rekan Lain</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // JIKA STATUS DITOLAK (REJECTED)
    if (submittedGuest.approval_status === 'rejected') {
      return (
        <div className="max-w-lg mx-auto py-6 sm:py-12 px-3 sm:px-4 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-rose-200 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full inline-block">
              Status: Tidak Aktif
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Pendaftaran Tidak Aktif
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              Yth. Bapak/Ibu <strong className="text-slate-900">{submittedGuest.pic_name}</strong> dari{' '}
              <strong className="text-slate-900">{submittedGuest.university_name}</strong>.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-left space-y-2 text-xs text-rose-900">
              <p className="font-bold flex items-center gap-1.5 text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Informasi Panitia
              </p>
              <p className="leading-relaxed">
                Pendaftaran tiket ini dinonaktifkan oleh panitia acara. Silakan hubungi panitia jika membutuhkan bantuan.
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={resetForm}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kembali ke Halaman Utama</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // JIKA BISA HADIR & APPROVED: TAMPILKAN E-TIKET RESMI PERAYAAN NATAL & QR CODE
    return (
      <div className="max-w-xl mx-auto py-4 sm:py-8 px-3 sm:px-4 text-left">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-emerald-900/15 overflow-hidden">
          
          {/* Header Tiket Pribadi (Christmas Theme) */}
          <div className="p-4 sm:p-7 text-white relative bg-linear-to-r from-emerald-800 via-teal-800 to-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {ENABLE_QR_SCAN ? 'E-Tiket Presensi Natal' : 'Bukti Pendaftaran Natal'}
              </span>
              <span className="text-[11px] sm:text-xs text-emerald-100 flex items-center gap-1 font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Terdaftar
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black mt-2.5 tracking-tight text-white">
              {submittedGuest.pic_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black">
                {submittedGuest.university_name}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-emerald-100">
              <div className="flex items-center gap-1 font-medium">
                <Church className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Perayaan Natal Bersama YGPKB</span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <span>Acara Natal Internal</span>
              </div>
            </div>
          </div>

          {/* Body Tiket & QR Code */}
          <div className="p-4 sm:p-7 space-y-4 sm:space-y-6">
            
            {/* QR Code Khusus Presensi (Hanya jika fitur QR diaktifkan) */}
            {isAttending && ENABLE_QR_SCAN && qrCodeUrl && (
              <div className="bg-linear-to-b from-emerald-50/80 to-teal-50/40 border-2 border-dashed border-emerald-300 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center text-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-md border border-emerald-100 mb-2.5">
                  <img src={qrCodeUrl} alt="QR Code Presensi Pribadi" className="w-44 h-44 sm:w-56 sm:h-56" />
                </div>
                
                <div className="space-y-1 max-w-sm">
                  <span className="text-[10px] sm:text-[11px] font-black text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full uppercase tracking-wider inline-block">
                    Scan QR Presensi Cepat
                  </span>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    Tunjukkan QR Code ini kepada <strong>Petugas Resepsionis / Penerima Tamu</strong> di pintu masuk untuk absensi instan 1 detik.
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 pt-0.5">
                    ID: {submittedGuest.id}
                  </p>
                </div>

                {/* Tombol Simpan QR ke Galeri HP & Kirim ke WA */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleDownloadQr}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Shalom! Ini link E-Tiket QR Perayaan Natal Bersama saya (${submittedGuest.pic_name} - ${submittedGuest.university_name}): ${window.location.origin}${window.location.pathname}?ticket=${submittedGuest.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kirim ke WhatsApp Saya</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyTicketLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Konfirmasi Pendaftaran (Tampilan Bersih saat QR dinonaktifkan) */}
            {isAttending && !ENABLE_QR_SCAN && (
              <div className="bg-linear-to-b from-emerald-50/90 to-teal-50/50 border border-emerald-200/80 p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                    Pendaftaran Berhasil
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">
                    Data Kehadiran Anda Telah Tercatat
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                    Terima kasih Bapak/Ibu <strong>{submittedGuest.pic_name}</strong> dari <strong>{submittedGuest.university_name}</strong>. Konfirmasi kehadiran Anda pada Perayaan Natal Bersama telah berhasil masuk ke dalam database panitia.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2 justify-center">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Shalom! Konfirmasi kehadiran Perayaan Natal Bersama atas nama ${submittedGuest.pic_name} (${submittedGuest.university_name}) sudah berhasil terdaftar.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kirim Bukti ke WhatsApp Saya</span>
                  </a>
                </div>
              </div>
            )}

            {/* Banner Pengingat */}
            {ENABLE_QR_SCAN ? (
              <div className="bg-amber-50 border border-amber-200 p-3 sm:p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Tips:</strong> Screenshot QR Code di atas atau simpan link tiket ini agar mudah dibuka kembali saat tiba di lokasi perayaan!
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Data Anda sudah tersimpan di sistem. Tidak perlu cetak tiket fisik atau bawa QR code, panitia akan mendata kehadiran Anda secara langsung.
                </p>
              </div>
            )}

            {/* Ringkasan Data (Grid 2 Kolom) */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Peserta</p>
                <p className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">{submittedGuest.pic_name}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asal Unit / Lembaga</p>
                <p className="font-bold text-emerald-800 mt-0.5 text-xs sm:text-sm">{submittedGuest.university_name}</p>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">
                  {submittedGuest.institution_category === 'yayasan'
                    ? 'Yayasan YGPKB'
                    : submittedGuest.institution_category === 'itbss'
                    ? 'Institut Sabda Setia'
                    : 'Unit Persekolahan'}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Kehadiran</p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Bisa Hadir
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. WhatsApp</p>
                <p className="font-bold text-slate-800 mt-0.5 text-xs">{submittedGuest.pic_phone}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / Simpan Tiket
              </button>
              
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Isi Presensi untuk Rekan Lain
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6 text-left">
      
      {/* Event Header Banner (Christmas Theme) */}
      <div className="bg-linear-to-br from-emerald-950 via-teal-900 to-slate-900 text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden mb-6 sm:mb-8 border border-emerald-800/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-semibold text-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Presensi Kehadiran Internal Acara Natal</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Perayaan Natal Bersama <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-emerald-200 to-teal-200">
              YGPKB, SKI & ITBSS
            </span>
          </h1>

          <p className="mt-2.5 text-slate-200 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {ENABLE_QR_SCAN
              ? 'Sistem konfirmasi kehadiran dan e-tiket QR Code internal untuk Bapak/Ibu Guru, Dosen, Tenaga Kependidikan, Staf, serta Pengurus Yayasan.'
              : 'Sistem formulir pendataan dan konfirmasi kehadiran untuk Bapak/Ibu Guru, Dosen, Tenaga Kependidikan, Staf, serta Pengurus Yayasan.'}
          </p>

          <p className="text-[11px] text-emerald-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 mt-3 inline-block">
            {ENABLE_QR_SCAN
              ? 'ℹ️ Setiap peserta mengisi 1 formulir untuk mendapatkan QR Code tiket presensi pribadi yang akan discan saat tiba di lokasi.'
              : 'ℹ️ Silakan mengisi formulir di bawah ini untuk konfirmasi kehadiran Anda pada acara Perayaan Natal Bersama.'}
          </p>

          {/* Details Bar */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2.5 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Church className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">LEMBAGA PENYELENGGARA</p>
                <p className="font-bold text-white text-xs truncate">Yayasan Gereja Protestan Kampung Bali (YGPKB)</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <School className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">UNIT PARTISIPAN</p>
                <p className="font-bold text-white text-xs">SKI & Kampus ITBSS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTO-RESTORE BANNER (Jika pernah mendaftar di HP ini) */}
      {rememberedGuest && (
        <div className="mb-4 sm:mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs sm:text-sm">
                Halo, {rememberedGuest.pic_name}!
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                E-Tiket Anda untuk unit <strong>{rememberedGuest.university_name}</strong> tersimpan di perangkat ini.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSubmittedGuest(rememberedGuest)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-xs transition-all active:scale-95"
            >
              Buka E-Tiket Saya
            </button>
            <button
              type="button"
              onClick={() => {
                setRememberedGuest(null);
                localStorage.removeItem('natal_ygpkb_my_guest_id');
              }}
              title="Tutup & daftar peserta baru"
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all active:scale-95"
            >
              Daftar Baru
            </button>
          </div>
        </div>
      )}

      {/* FORM PENCARIAN E-TIKET VIA WHATSAPP (Anti-Hilang) */}
      <div className="mb-4 sm:mb-6 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {ENABLE_QR_SCAN ? 'Cari E-Tiket Saya' : 'Cari Data Pendaftaran Saya'}
              </p>
              <p className="text-[10px] text-slate-400">
                {ENABLE_QR_SCAN ? 'Masukkan nomor WhatsApp Anda untuk menampilkan kembali tiket QR' : 'Masukkan nomor WhatsApp Anda untuk mengecek status pendaftaran'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchTicket} className="flex items-center gap-2 mt-1 sm:mt-0">
            <input
              type="tel"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="0812xxxxxxx..."
              className="flex-1 sm:w-56 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-xs"
            >
              {ENABLE_QR_SCAN ? 'Cek Tiket' : 'Cek Data'}
            </button>
          </form>
        </div>

        {searchFeedback && (
          <p className="mt-2.5 text-xs font-medium text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-in fade-in duration-200">
            {searchFeedback}
          </p>
        )}
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-8 space-y-5 sm:space-y-6">
        
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mohon Lengkapi Data</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: Status Kehadiran */}
        <div>
          <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1">
            Konfirmasi Kehadiran Anda <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] sm:text-xs text-slate-500 mb-3">
            Apakah Bapak/Ibu dapat hadir pada Perayaan Natal Bersama?
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            
            {/* Bisa Hadir */}
            <div
              onClick={() => handleStatusSelect('hadir')}
              className={`cursor-pointer p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col justify-between ${
                formData.attendance_status === 'hadir'
                  ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                  formData.attendance_status === 'hadir' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  formData.attendance_status === 'hadir' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                }`}>
                  {formData.attendance_status === 'hadir' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Bisa Hadir</p>
                <p className="text-[10px] sm:text-xs text-emerald-700 font-semibold mt-0.5">{ENABLE_QR_SCAN ? 'Dapatkan QR Tiket' : 'Konfirmasi Hadir'}</p>
              </div>
            </div>

            {/* Berhalangan */}
            <div
              onClick={() => handleStatusSelect('tidak_hadir')}
              className={`cursor-pointer p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col justify-between ${
                formData.attendance_status === 'tidak_hadir'
                  ? 'border-rose-400 bg-rose-50/80 shadow-xs ring-2 ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                  formData.attendance_status === 'tidak_hadir' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  formData.attendance_status === 'tidak_hadir' ? 'border-rose-500 bg-rose-500' : 'border-slate-300'
                }`}>
                  {formData.attendance_status === 'tidak_hadir' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Berhalangan</p>
                <p className="text-[10px] sm:text-xs text-rose-600 font-semibold mt-0.5">Belum bisa hadir</p>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: Kategori Asal Lembaga / Bagian */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Asal Instansi / Bagian <span className="text-rose-500">*</span>
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-4">
            
            {/* 1. Unit Sekolah (SKI) */}
            <button
              type="button"
              onClick={() => handleCategorySelect('sekolah')}
              className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'sekolah'
                  ? 'bg-emerald-50/90 border-emerald-600 text-emerald-900 font-extrabold ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <School className="w-5 h-5 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold">SKI</span>
              <span className="text-[10px] text-emerald-600 font-semibold">12 Unit Persekolahan</span>
            </button>

            {/* 2. Yayasan YGPKB */}
            <button
              type="button"
              onClick={() => handleCategorySelect('yayasan')}
              className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'yayasan'
                  ? 'bg-purple-50/90 border-purple-600 text-purple-900 font-extrabold ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Church className="w-5 h-5 text-purple-700 shrink-0" />
              <span className="text-xs font-bold">Yayasan (YGPKB)</span>
              <span className="text-[10px] text-purple-600 font-semibold">Gereja & Pengurus</span>
            </button>

            {/* 3. ITBSS */}
            <button
              type="button"
              onClick={() => handleCategorySelect('itbss')}
              className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'itbss'
                  ? 'bg-blue-50/90 border-blue-600 text-blue-900 font-extrabold ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-5 h-5 text-blue-700 shrink-0" />
              <span className="text-xs font-bold">ITBSS</span>
              <span className="text-[10px] text-blue-600 font-semibold">Institut Sabda Setia</span>
            </button>

          </div>

          {/* SUB-SELEKSI KHUSUS UNIT SEKOLAH: 12 UNIT */}
          {selectedCategoryKey === 'sekolah' && (
            <div className="bg-emerald-50/60 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-emerald-950 mb-2 flex items-center justify-between">
                <span>Pilih Unit SKI Anda (12 Unit):</span>
                <span className="text-[11px] font-extrabold text-emerald-700">Terpilih: {selectedUnit}</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {SCHOOL_UNITS.map((unit) => {
                  const isSelected = selectedUnit === unit;
                  return (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleUnitSelect(unit)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs scale-[1.02]'
                          : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                      }`}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PREVIEW TERPILIH UNTUK YAYASAN */}
          {selectedCategoryKey === 'yayasan' && (
            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 flex items-center gap-3 animate-in fade-in duration-200">
              <Church className="w-6 h-6 text-purple-700 shrink-0" />
              <div>
                <p className="font-extrabold text-purple-950 text-xs sm:text-sm">{YAYASAN_NAME}</p>
                <p className="text-[11px] text-purple-700">Pengurus, Majelis, Staf & Keluarga Besar Yayasan</p>
              </div>
            </div>
          )}

          {/* PREVIEW TERPILIH UNTUK ITBSS */}
          {selectedCategoryKey === 'itbss' && (
            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 flex items-center gap-3 animate-in fade-in duration-200">
              <GraduationCap className="w-6 h-6 text-blue-700 shrink-0" />
              <div>
                <p className="font-extrabold text-blue-950 text-xs sm:text-sm">{ITBSS_NAME}</p>
                <p className="text-[11px] text-blue-700">Dosen, Tenaga Pendidik, Staf & Manajemen Institut</p>
              </div>
            </div>
          )}

        </div>

        {/* SECTION 3: Identitas Personal Peserta */}
        <div className="space-y-3.5 sm:space-y-4 pt-3 border-t border-slate-100">
          
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Peserta <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                name="pic_name"
                value={formData.pic_name}
                onChange={handleChange}
                placeholder="Contoh: Bpk. Yohanes / Ibu Maria, S.Pd"
                required
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white font-medium"
              />
            </div>
          </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  name="pic_phone"
                  value={formData.pic_phone}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white font-medium"
                />
              </div>
            </div>

          {/* Catatan / Ucapan Natal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pesan / Ucapan Natal <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Tuliskan ucapan Natal atau pesan khusus untuk panitia..."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
            ></textarea>
          </div>

        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl sm:rounded-2xl text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.98] bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan Presensi...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{ENABLE_QR_SCAN ? 'Kirim Konfirmasi & Dapatkan E-Tiket QR' : 'Kirim Konfirmasi Pendaftaran'}</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
