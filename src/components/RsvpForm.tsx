import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Send, 
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Printer,
  RotateCcw,
  Church,
  ExternalLink,
  Download,
  BookOpen,
  Users,
  Search,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import type { CreateRsvpInput, AttendanceStatus, InstitutionCategory, RsvpGuest } from '../types';
import restoranImg from '../assets/restoran-gajahmada.jpg';
import { UniversityCombobox } from './UniversityCombobox';

export type CategoryOptionKey = 'universitas' | 'guru' | 'panitia' | 'yayasan';

const VENUE_NAME = 'Restoran Gajah Mada Pontianak';
const VENUE_ADDRESS = 'Jl. Gajah Mada No.202, RW.65, Benua Melayu Darat, Kec. Pontianak Sel., Kota Pontianak, Kalimantan Barat 78243';
const VENUE_MAPS_URL = 'https://www.google.com/maps/place/Restaurant+Gajah+Mada/@-0.0374499,109.3432347,17z/data=!3m1!4b1!4m6!3m5!1s0x2e1d58553a624eab:0xb1dc104ddd5dad9c!8m2!3d-0.0374499!4d109.3432347!16s%2Fg%2F1ptyc_4_2?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D';
const VENUE_IMAGE_URL = restoranImg;

interface RsvpFormProps {
  guests?: RsvpGuest[];
  onSubmitRsvp: (data: CreateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
}

export const RsvpForm: React.FC<RsvpFormProps> = ({ guests = [], onSubmitRsvp }) => {
  const [formData, setFormData] = useState<CreateRsvpInput>({
    institution_category: 'universitas',
    university_name: '',
    pic_name: '',
    pic_position: '',
    pic_phone: '',
    pic_email: '',
    attendance_status: 'hadir',
    attendee_count: 1, // 1 orang per formulir
    dietary_requirements: 'Halal',
    presentation_topic: '',
    needs_projector: false,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedGuest, setSubmittedGuest] = useState<RsvpGuest | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [lastSelectedUniv, setLastSelectedUniv] = useState<string>('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryOptionKey>('universitas');
  
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
    const savedId = localStorage.getItem('career_day_my_guest_id');
    if (savedId) {
      const match = guests.find((g) => g.id === savedId);
      if (match) {
        setRememberedGuest(match);
      }
    }
  }, [guests]);

  // Hitung jumlah perwakilan terdaftar untuk universitas yang sedang dipilih (Maksimal 2 orang)
  const existingUnivAttendees = useMemo(() => {
    if (formData.institution_category !== 'universitas' || !formData.university_name.trim() || !guests) {
      return [];
    }
    const target = formData.university_name.toLowerCase().trim();
    return guests.filter((g) => 
      g.institution_category === 'universitas' &&
      g.university_name.toLowerCase().trim() === target &&
      g.attendance_status === 'hadir' &&
      g.approval_status !== 'rejected'
    );
  }, [formData.institution_category, formData.university_name, guests]);

  const isUnivQuotaExceeded = formData.institution_category === 'universitas' && existingUnivAttendees.length >= 2;

  // Generate QR code saat form berhasil disubmit khusus jika hadir
  useEffect(() => {
    if (submittedGuest && submittedGuest.attendance_status === 'hadir') {
      // QR Code memuat identifier unik yang akan dibaca oleh scanner resepsionis
      const qrPayload = JSON.stringify({
        careerDay2026: true,
        id: submittedGuest.id,
        name: submittedGuest.pic_name,
        inst: submittedGuest.university_name,
        cat: submittedGuest.institution_category,
      });

      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR code', err));
    }
  }, [submittedGuest]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusSelect = (status: AttendanceStatus) => {
    setFormData((prev) => ({ ...prev, attendance_status: status }));
  };

  const handleCategoryOptionSelect = (key: CategoryOptionKey) => {
    setSelectedCategoryKey(key);
    setFormData((prev) => {
      let nextCategory: InstitutionCategory = 'universitas';
      let nextName = '';

      if (key === 'universitas') {
        nextCategory = 'universitas';
        nextName = lastSelectedUniv || '';
      } else if (key === 'guru') {
        nextCategory = 'sekolah';
        nextName = 'Guru Sekolah';
      } else if (key === 'panitia') {
        nextCategory = 'sekolah';
        nextName = 'Panitia Career Day Sekolah';
      } else if (key === 'yayasan') {
        nextCategory = 'yayasan';
        nextName = 'Yayasan Gereja Protestan Kampung Bali';
      }

      return {
        ...prev,
        institution_category: nextCategory,
        university_name: nextName,
      };
    });
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
      setSearchFeedback('Data tamu belum selesai dimuat. Silakan tunggu sebentar.');
      return;
    }

    const matches = guests.filter((g) => g.pic_phone.replace(/\D/g, '').includes(clean));
    if (matches.length === 0) {
      setSearchFeedback(`Tidak ditemukan data pendaftaran dengan nomor WhatsApp "${searchQuery}".`);
      return;
    }

    const found = matches[0];
    setSubmittedGuest(found);
    localStorage.setItem('career_day_my_guest_id', found.id);
    const newUrl = `${window.location.pathname}?ticket=${found.id}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validasi input
    if (!formData.university_name.trim()) {
      setErrorMessage('Mohon isi nama universitas / lembaga / asal instansi Anda.');
      return;
    }
    if (!formData.pic_name.trim()) {
      setErrorMessage('Mohon isi nama lengkap Anda (1 orang per formulir).');
      return;
    }
    if (!formData.pic_phone.trim()) {
      setErrorMessage('Mohon cantumkan no. WhatsApp aktif untuk pengiriman QR code & informasi acara.');
      return;
    }

    const willBePending = isUnivQuotaExceeded && formData.attendance_status === 'hadir';

    setIsSubmitting(true);
    try {
      const res = await onSubmitRsvp({
        ...formData,
        attendee_count: 1, // 1 orang unik
        approval_status: willBePending ? 'pending' : 'approved',
      });

      if (res.error) {
        setErrorMessage(`Terjadi kendala: ${res.error}`);
      } else if (res.data) {
        setSubmittedGuest(res.data);
        localStorage.setItem('career_day_my_guest_id', res.data.id);

        const newUrl = `${window.location.pathname}?ticket=${res.data.id}`;
        window.history.replaceState({}, '', newUrl);

        if (formData.attendance_status === 'hadir' && res.data.approval_status !== 'pending') {
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b'],
            });
          } catch (_) {}
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengirim konfirmasi RSVP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedGuest(null);
    setQrCodeUrl(null);
    setLastSelectedUniv('');
    setSelectedCategoryKey('universitas');
    window.history.replaceState({}, '', window.location.pathname);
    setFormData({
      institution_category: 'universitas',
      university_name: '',
      pic_name: '',
      pic_position: '',
      pic_phone: '',
      pic_email: '',
      attendance_status: 'hadir',
      attendee_count: 1,
      dietary_requirements: 'Halal',
      presentation_topic: '',
      needs_projector: false,
      notes: '',
    });
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl || !submittedGuest) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `QR_Tiket_${submittedGuest.pic_name.replace(/\s+/g, '_')}_CareerDay2026.png`;
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
            {/* Icon Banner */}
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
              <strong className="text-slate-900">{submittedGuest.university_name}</strong>.
            </p>

            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
              Konfirmasi bahwa Bapak/Ibu <strong>berhalangan hadir</strong> pada acara <strong>Malam Keakraban Career Day 2026</strong> telah kami catat dengan baik. Panitia sekolah dan yayasan sangat mengapresiasi waktu dan perhatian Bapak/Ibu.
            </p>

            {/* Ringkasan Konfirmasi Singkat */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Asal Lembaga:</span>
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
                  <span className="text-slate-400 font-medium block mb-1">Pesan / Alasan:</span>
                  <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    "{submittedGuest.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={resetForm}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Isi Formulir untuk Rekan Lain</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // JIKA STATUS MENUNGGU PERSETUJUAN (PENDING KUOTA > 2 ORANG)
    if (submittedGuest.approval_status === 'pending') {
      const waMsg = `Halo Panitia Career Day 2026, saya ${submittedGuest.pic_name} dari ${submittedGuest.university_name} ingin konfirmasi pendaftaran delegasi tambahan (status pending). Mohon bantuannya untuk persetujuan kehadiran. Terima kasih!`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;

      return (
        <div className="max-w-lg mx-auto py-6 sm:py-12 px-3 sm:px-4 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-amber-300 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Icon Banner */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full inline-block">
              Status: Menunggu Persetujuan Panitia
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Pendaftaran Delegasi Tambahan Diterima
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              Yth. Bapak/Ibu <strong className="text-slate-900">{submittedGuest.pic_name}</strong> dari{' '}
              <strong className="text-slate-900">{submittedGuest.university_name}</strong>.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-2 text-xs text-amber-900">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Kuota Resmi Telah Terisi (Maksimal 2 Orang)
              </p>
              <p className="leading-relaxed">
                Setiap universitas mitra dibatasi maksimal 2 perwakilan resmi. Karena universitas Anda telah mencapai batas kuota tersebut, pendaftaran Anda saat ini tercatat dalam status <strong>Menunggu Persetujuan (Pending)</strong>.
              </p>
              <p className="leading-relaxed text-[11px] text-amber-800 font-medium">
                ℹ️ E-Tiket & QR Code kehadiran akan aktif secara otomatis setelah panitia menyetujui permohonan kuota tambahan ini.
              </p>
            </div>

            {/* Ringkasan Data Tamu */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Universitas:</span>
                <span className="font-bold text-slate-800 text-right">{submittedGuest.university_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Nama PIC:</span>
                <span className="font-bold text-slate-800">{submittedGuest.pic_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">No. WhatsApp:</span>
                <span className="font-bold text-indigo-600">{submittedGuest.pic_phone}</span>
              </div>
            </div>

            {/* Action Buttons: Hubungi Panitia via WhatsApp */}
            <div className="mt-6 space-y-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Panitia via WhatsApp untuk Approval</span>
              </a>

              <button
                type="button"
                onClick={resetForm}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Utama</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // JIKA BISA HADIR & SUDAH APPROVED: TAMPILKAN E-TIKET RESMI & QR CODE PRESENSI
    return (
      <div className="max-w-xl mx-auto py-4 sm:py-8 px-3 sm:px-4 text-left">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header Tiket Pribadi */}
          <div className="p-4 sm:p-7 text-white relative bg-linear-to-r from-indigo-700 via-blue-700 to-indigo-900">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full">
                E-Tiket Presensi Pribadi
              </span>
              <span className="text-[11px] sm:text-xs text-indigo-100 flex items-center gap-1 font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Data Tersimpan
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black mt-2.5 tracking-tight">
              {submittedGuest.pic_name}
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-semibold mt-0.5">
              {submittedGuest.university_name}
            </p>

            <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-indigo-100">
              <div className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{VENUE_NAME}</span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                <span>Kamis Sore</span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                <span>17.00 WIB</span>
              </div>
            </div>
          </div>

          {/* Body Tiket & QR Code */}
          <div className="p-4 sm:p-7 space-y-4 sm:space-y-6">
            
            {/* QR Code Khusus jika Hadir */}
            {isAttending && qrCodeUrl && (
              <div className="bg-linear-to-b from-indigo-50/80 to-blue-50/40 border-2 border-dashed border-indigo-300 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center text-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-md border border-indigo-100 mb-2.5">
                  <img src={qrCodeUrl} alt="QR Code Presensi Pribadi" className="w-44 h-44 sm:w-56 sm:h-56" />
                </div>
                
                <div className="space-y-1 max-w-sm">
                  <span className="text-[10px] sm:text-[11px] font-black text-indigo-700 bg-indigo-100 px-3 py-0.5 rounded-full uppercase tracking-wider inline-block">
                    Scan QR Presensi Cepat
                  </span>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    Tunjukkan QR Code ini ke <strong>Staf Resepsionis</strong> di pintu masuk {VENUE_NAME} untuk absensi instan 1 detik.
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 pt-0.5">
                    ID: {submittedGuest.id}
                  </p>
                </div>

                {/* Tombol Simpan QR ke Galeri HP & Kirim ke WA */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleDownloadQr}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Halo, ini link E-Tiket QR Career Day 2026 saya (${submittedGuest.pic_name} - ${submittedGuest.university_name}): ${window.location.origin}${window.location.pathname}?ticket=${submittedGuest.id}`)}`}
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

            {/* Banner Pengingat Screenshot */}
            <div className="bg-amber-50 border border-amber-200 p-3 sm:p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Tips:</strong> Screenshot QR Code di atas atau simpan link tiket ini agar mudah dibuka kembali saat tiba di Restoran Gajah Mada!
              </p>
            </div>

            {/* Ringkasan Data (Grid 2 Kolom Compact di HP) */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Peserta</p>
                <p className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">{submittedGuest.pic_name}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asal Instansi</p>
                <p className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">{submittedGuest.university_name}</p>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase">
                  {submittedGuest.institution_category === 'yayasan'
                    ? 'YGPKB'
                    : submittedGuest.institution_category === 'sekolah'
                    ? (submittedGuest.university_name.toLowerCase().includes('guru') ? 'Guru Sekolah' : 'Panitia Sekolah')
                    : 'Universitas Mitra'}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Porsi Konsumsi</p>
                <p className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">1 Porsi (Personal)</p>
              </div>
            </div>

            {/* Detail Lokasi Info dengan Foto & Link Petunjuk Arah */}
            <div className="bg-slate-50 p-3.5 sm:p-5 rounded-2xl border border-slate-200 text-xs text-slate-600">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                <img 
                  src={VENUE_IMAGE_URL} 
                  alt={VENUE_NAME} 
                  className="w-full sm:w-32 h-28 sm:h-24 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0" 
                />
                <div className="space-y-1.5 flex-1 w-full">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    {VENUE_NAME}
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                    {VENUE_ADDRESS}
                  </p>
                  <div className="pt-1">
                    <a
                      href={VENUE_MAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Petunjuk Arah Google Maps</span>
                    </a>
                  </div>
                </div>
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Isi Konfirmasi untuk Rekan Lain
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const isAttending = formData.attendance_status === 'hadir';

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6 text-left">
      
      {/* Event Header Banner: Restoran Gajah Mada Pontianak */}
      <div className="bg-linear-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden mb-6 sm:mb-8">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-semibold text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>1 Formulir = 1 E-Tiket QR Pribadi</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Malam Keakraban (Makrab) <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 via-indigo-200 to-teal-200">
              Career Day 2026
            </span>
          </h1>

          <p className="mt-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Persiapan pameran Career Day siswa-siswi sekolah bersama perwakilan 
            <strong> Perguruan Tinggi Mitra</strong>, <strong>Bapak/Ibu Guru & Panitia Sekolah</strong>, serta <strong>Yayasan Gereja Protestan Kampung Bali</strong>.
          </p>

          <p className="text-[11px] text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 mt-3 inline-block">
            ℹ️ Setiap peserta mengisi 1 formulir agar mendapatkan <strong>QR Code tiket pribadi</strong> untuk absensi di lokasi.
          </p>

          {/* Details Bar: 3 Pills / Grid */}
          <div className="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2.5 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">LOKASI ACARA</p>
                <p className="font-bold text-white text-xs truncate">{VENUE_NAME}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-400/20 text-indigo-300 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">HARI & TANGGAL</p>
                <p className="font-bold text-white text-xs">Kamis Sore</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <div className="w-8 h-8 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">WAKTU</p>
                <p className="font-bold text-white text-xs">17.00 WIB - Selesai</p>
              </div>
            </div>
          </div>

          {/* Featured Venue & Map Card with Photo */}
          <div className="mt-4 pt-4 border-t border-slate-700/80 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
              <div className="relative group w-full sm:w-44 h-32 sm:h-24 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md">
                <img
                  src={VENUE_IMAGE_URL}
                  alt={VENUE_NAME}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-[10px] text-white px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                  Foto Lokasi
                </span>
              </div>

              <div className="space-y-1 text-left w-full">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                    Tempat Kumpul
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {VENUE_NAME}
                  </h3>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  {VENUE_ADDRESS}
                </p>

                <div className="pt-1">
                  <a
                    href={VENUE_MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                    <span>Petunjuk Arah Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-900 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTO-RESTORE BANNER (Jika pernah mendaftar di HP ini) */}
      {rememberedGuest && (
        <div className="mb-4 sm:mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs sm:text-sm">
                Halo, {rememberedGuest.pic_name}!
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                Anda sudah terdaftar dari <strong>{rememberedGuest.university_name}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSubmittedGuest(rememberedGuest)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition-all active:scale-95"
            >
              Buka E-Tiket Saya
            </button>
            <button
              type="button"
              onClick={() => {
                setRememberedGuest(null);
                localStorage.removeItem('career_day_my_guest_id');
              }}
              title="Tutup & daftar sebagai delegasi baru"
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
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Sudah Pernah Mendaftar?</p>
              <p className="text-[10px] text-slate-400">Cek / ambil kembali E-Tiket & QR Code Anda</p>
            </div>
          </div>

          <form onSubmit={handleSearchTicket} className="flex items-center gap-2 mt-1 sm:mt-0">
            <input
              type="tel"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="No. WhatsApp Anda..."
              className="flex-1 sm:w-56 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-xs"
            >
              Cek Tiket
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

        {/* SECTION 1: Status Kehadiran (2 Kolom berdampingan di HP) */}
        <div>
          <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1">
            Konfirmasi Kehadiran Anda <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] sm:text-xs text-slate-500 mb-3">
            Apakah Bapak/Ibu dapat hadir di {VENUE_NAME} Kamis sore (17.00 WIB)?
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            
            {/* Bisa Hadir */}
            <div
              onClick={() => handleStatusSelect('hadir')}
              className={`cursor-pointer p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col justify-between ${
                formData.attendance_status === 'hadir'
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                  formData.attendance_status === 'hadir' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  formData.attendance_status === 'hadir' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                }`}>
                  {formData.attendance_status === 'hadir' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Bisa Hadir</p>
                <p className="text-[10px] sm:text-xs text-emerald-700 font-semibold mt-0.5">Dapat QR Tiket</p>
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

        {/* SECTION 2: Kategori Asal Delegasi (4 Kolom Grid di Desktop, 2 Kolom di HP) */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Kategori Asal Delegasi <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            
            <button
              type="button"
              onClick={() => handleCategoryOptionSelect('universitas')}
              className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'universitas'
                  ? 'bg-indigo-50/90 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight font-semibold">Universitas Mitra</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryOptionSelect('guru')}
              className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'guru'
                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-400/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight font-semibold">Guru Sekolah</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryOptionSelect('panitia')}
              className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'panitia'
                  ? 'bg-amber-50/90 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-400/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight font-semibold">Panitia Sekolah</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryOptionSelect('yayasan')}
              className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedCategoryKey === 'yayasan'
                  ? 'bg-purple-50/90 border-purple-500 text-purple-900 font-bold ring-2 ring-purple-400/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Church className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight font-semibold">YGPKB</span>
            </button>

          </div>
        </div>

        {/* SECTION 3: Identitas Personal Peserta */}
        <div className="space-y-3.5 sm:space-y-4 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            
            {/* Nama Univ / Instansi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {selectedCategoryKey === 'universitas'
                  ? 'Pilih atau Cari Perguruan Tinggi Mitra'
                  : selectedCategoryKey === 'guru'
                  ? 'Keterangan / Bidang Guru Sekolah'
                  : selectedCategoryKey === 'panitia'
                  ? 'Divisi / Unit Panitia Sekolah'
                  : 'Nama Lembaga / YGPKB'} <span className="text-rose-500">*</span>
              </label>
              
              {selectedCategoryKey === 'universitas' ? (
                <UniversityCombobox
                  value={formData.university_name}
                  onChange={(val) => {
                    setLastSelectedUniv(val);
                    setFormData((prev) => ({ ...prev, university_name: val }));
                  }}
                  placeholder="Ketik untuk mencari atau klik untuk memilih kampus..."
                />
              ) : (
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="university_name"
                    value={formData.university_name}
                    onChange={handleChange}
                    placeholder={
                      selectedCategoryKey === 'guru'
                        ? 'Guru Sekolah / Guru BK / Guru Mata Pelajaran'
                        : selectedCategoryKey === 'panitia'
                        ? 'Panitia Career Day Sekolah'
                        : 'Yayasan Gereja Protestan Kampung Bali'
                    }
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                  />
                </div>
              )}

              {/* Banner Peringatan Kuota Universitas Penuh (Maks. 2 Orang) */}
              {isUnivQuotaExceeded && (
                <div className="mt-2.5 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Kuota Resmi Delegasi Universitas Penuh (Maks. 2 Orang)</span>
                  </div>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    <strong>{formData.university_name}</strong> saat ini telah memiliki {existingUnivAttendees.length} perwakilan terdaftar ({existingUnivAttendees.map((g) => g.pic_name).join(', ')}).
                  </p>
                  <p className="text-amber-700 text-[11px] leading-relaxed">
                    ℹ️ Formulir ini tetap dapat Anda kirimkan sebagai <strong>pendaftaran delegasi tambahan</strong>. Status kehadiran akan dicatat sebagai <strong>Menunggu Persetujuan (Pending)</strong> dan memerlukan konfirmasi panitia sebelum e-tiket diterbitkan.
                  </p>
                </div>
              )}
            </div>

            {/* Nama Lengkap Peserta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Anda <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="pic_name"
                  value={formData.pic_name}
                  onChange={handleChange}
                  placeholder="Nama Lengkap & Gelar"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* No WhatsApp Pribadi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="pic_phone"
                  value={formData.pic_phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email (Opsional) */}
            <div className={isAttending ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="pic_email"
                  value={formData.pic_email}
                  onChange={handleChange}
                  placeholder="nama@kampus.ac.id"
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

          </div>
        </div>

        {/* CATATAN TAMBAHAN (OPSIONAL) */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAttending ? 'Catatan / Pesan Tambahan (Opsional)' : 'Pesan / Alasan Singkat (Opsional)'}
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder={isAttending ? 'Pesan untuk panitia sekolah dan yayasan...' : 'Alasan belum dapat hadir...'}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 outline-none transition-all"
            ></textarea>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-4 rounded-xl sm:rounded-2xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
              isSubmitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : isAttending && isUnivQuotaExceeded
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-300'
                : isAttending
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-300'
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-300'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Menyimpan Konfirmasi...</span>
              </div>
            ) : isAttending && isUnivQuotaExceeded ? (
              <>
                <Send className="w-4 h-4" />
                <span>Ajukan Pendaftaran Tambahan (Status Pending)</span>
              </>
            ) : isAttending ? (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim & Ambil Tiket QR Pribadi</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Konfirmasi Berhalangan</span>
              </>
            )}
          </button>
          
          <p className="text-center text-[10px] sm:text-[11px] text-slate-400 mt-2">
            {VENUE_NAME} • Kamis, 17.00 WIB
          </p>
        </div>

      </form>
    </div>
  );
};
