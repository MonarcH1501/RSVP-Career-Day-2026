import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Briefcase, 
  Phone, 
  Mail, 
  Utensils, 
  Presentation, 
  MessageSquare, 
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
  School,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import type { CreateRsvpInput, AttendanceStatus, InstitutionCategory, RsvpGuest } from '../types';

const VENUE_NAME = 'Restoran Gajah Mada Pontianak';
const VENUE_ADDRESS = 'Jl. Gajah Mada No.202, RW.65, Benua Melayu Darat, Kec. Pontianak Sel., Kota Pontianak, Kalimantan Barat 78243';
const VENUE_MAPS_URL = 'https://www.google.com/maps/place/Restaurant+Gajah+Mada/@-0.0374499,109.3432347,17z/data=!3m1!4b1!4m6!3m5!1s0x2e1d58553a624eab:0xb1dc104ddd5dad9c!8m2!3d-0.0374499!4d109.3432347!16s%2Fg%2F1ptyc_4_2?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D';
const VENUE_IMAGE_URL = '/restoran-gajahmada.jpg';

interface RsvpFormProps {
  onSubmitRsvp: (data: CreateRsvpInput) => Promise<{ data: RsvpGuest | null; error: string | null }>;
}

export const RsvpForm: React.FC<RsvpFormProps> = ({ onSubmitRsvp }) => {
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

  // Generate QR code saat form berhasil disubmit
  useEffect(() => {
    if (submittedGuest) {
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

  const handleCategorySelect = (category: InstitutionCategory) => {
    setFormData((prev) => {
      let defaultName = prev.university_name;
      if (category === 'yayasan' && (!prev.university_name || prev.university_name.includes('Universitas'))) {
        defaultName = 'Yayasan Gereja Protestan Kampung Bali';
      } else if (category === 'sekolah' && (!prev.university_name || prev.university_name.includes('Yayasan'))) {
        defaultName = 'Panitia Career Day Sekolah';
      }
      return {
        ...prev,
        institution_category: category,
        university_name: defaultName,
      };
    });
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

    setIsSubmitting(true);
    try {
      const res = await onSubmitRsvp({
        ...formData,
        attendee_count: 1, // 1 orang unik
      });

      if (res.error) {
        setErrorMessage(`Terjadi kendala: ${res.error}`);
      } else if (res.data) {
        setSubmittedGuest(res.data);
        if (formData.attendance_status === 'hadir') {
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

  // SUCCESS / TICKET VIEW DENGAN QR CODE PRIBADI
  if (submittedGuest) {
    const isAttending = submittedGuest.attendance_status === 'hadir';

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-left">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header Tiket Pribadi */}
          <div className={`p-8 text-white relative ${
            isAttending
              ? 'bg-linear-to-r from-indigo-700 via-blue-700 to-indigo-900'
              : 'bg-linear-to-r from-slate-700 to-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full">
                {isAttending ? 'E-Tiket Presensi Pribadi' : 'Konfirmasi Berhalangan'}
              </span>
              <span className="text-xs text-indigo-100 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Data Unik Tersimpan
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
              {submittedGuest.pic_name}
            </h2>
            <p className="text-indigo-100 text-sm font-semibold mt-0.5">
              {submittedGuest.university_name} {submittedGuest.pic_position ? `• ${submittedGuest.pic_position}` : ''}
            </p>

            <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center gap-5 text-xs sm:text-sm text-indigo-100">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{VENUE_NAME}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-indigo-200 shrink-0" />
                <span>Kamis Sore</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-indigo-200 shrink-0" />
                <span>17.00 WIB - Selesai</span>
              </div>
            </div>
          </div>

          {/* Body Tiket & QR Code */}
          <div className="p-8 space-y-6">
            
            {/* QR Code Khusus jika Hadir */}
            {isAttending && qrCodeUrl && (
              <div className="bg-indigo-50/70 border-2 border-dashed border-indigo-300 p-6 rounded-3xl flex flex-col items-center text-center">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-indigo-100 mb-3">
                  <img src={qrCodeUrl} alt="QR Code Presensi Pribadi" className="w-48 h-48 sm:w-56 sm:h-56" />
                </div>
                
                <div className="space-y-1 max-w-sm">
                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    Scan QR Presensi Cepat
                  </span>
                  <p className="text-xs text-slate-600 pt-1">
                    Silakan simpan atau tunjukkan QR Code ini ke <strong>Staf Resepsionis</strong> di pintu masuk {VENUE_NAME} untuk absensi instan 1 detik.
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 pt-1">
                    Kode Tiket: {submittedGuest.id}
                  </p>
                </div>
              </div>
            )}

            {/* Ringkasan Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100 text-xs sm:text-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Peserta</p>
                <p className="font-bold text-slate-900 mt-0.5">{submittedGuest.pic_name}</p>
                {submittedGuest.pic_position && (
                  <p className="text-xs text-slate-500">{submittedGuest.pic_position}</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Asal Instansi</p>
                <p className="font-bold text-slate-900 mt-0.5">{submittedGuest.university_name}</p>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase">
                  {submittedGuest.institution_category === 'yayasan'
                    ? 'Yayasan Gereja Protestan'
                    : submittedGuest.institution_category === 'sekolah'
                    ? 'Panitia Sekolah'
                    : 'Universitas Mitra'}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Kehadiran</p>
                <div className="mt-1">
                  {isAttending ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Bisa Hadir di {VENUE_NAME}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Berhalangan Hadir
                    </span>
                  )}
                </div>
              </div>

              {isAttending && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Porsi Konsumsi</p>
                  <p className="font-bold text-slate-900 mt-0.5">1 Porsi (Personal)</p>
                  {submittedGuest.dietary_requirements && (
                    <p className="text-xs text-slate-500">Diet: {submittedGuest.dietary_requirements}</p>
                  )}
                </div>
              )}
            </div>

            {/* Detail Lokasi Info dengan Foto & Link Petunjuk Arah */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs text-slate-600">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img 
                  src={VENUE_IMAGE_URL} 
                  alt={VENUE_NAME} 
                  className="w-full sm:w-32 h-24 sm:h-24 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0" 
                />
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    {VENUE_NAME}
                  </p>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {VENUE_ADDRESS}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <a
                      href={VENUE_MAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Petunjuk Arah Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan E-Tiket
              </button>
              
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 text-left">
      
      {/* Event Header Banner: Restoran Gajah Mada Pontianak */}
      <div className="bg-linear-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-6 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden mb-8">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Konfirmasi Kehadiran Individu (1 Orang = 1 E-Tiket QR)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Malam Keakraban (Makrab) <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 via-indigo-200 to-teal-200">
              Career Day 2026
            </span>
          </h1>

          <p className="mt-3 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Sebagai bentuk persiapan pameran Career Day bagi siswa-siswi sekolah kami, kami mengundang hangat perwakilan 
            <strong> Perguruan Tinggi Mitra</strong>, <strong>Panitia Sekolah</strong>, dan <strong>Yayasan Gereja Protestan Kampung Bali</strong> untuk hadir dalam ramah tamah dan makan malam bersama.
          </p>

          <p className="text-[11px] text-indigo-300 bg-white/10 p-2.5 rounded-xl border border-white/10 mt-3 inline-block">
            ℹ️ Setiap peserta mengisi 1 formulir terpisah agar mendapatkan <strong>QR Code tiket pribadi</strong> untuk absensi di lokasi.
          </p>

          {/* Details Bar */}
          <div className="mt-6 pt-5 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TEMPAT KUMPUL</p>
                <p className="font-bold text-white">{VENUE_NAME}</p>
                <p className="text-[11px] text-slate-300">Kota Pontianak</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HARI & TANGGAL</p>
                <p className="font-bold text-white">Kamis Sore</p>
                <p className="text-[11px] text-slate-300">Pekan Career Day</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WAKTU ACARA</p>
                <p className="font-bold text-white">17.00 WIB - Selesai</p>
                <p className="text-[11px] text-slate-300">Mulai Pukul 17.00 (Jam 5 Sore)</p>
              </div>
            </div>
          </div>

          {/* Featured Venue & Map Card with Photo */}
          <div className="mt-6 pt-5 border-t border-slate-700/80 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative group w-full sm:w-48 h-32 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md">
                <img
                  src={VENUE_IMAGE_URL}
                  alt={VENUE_NAME}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-[10px] text-white px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                  Foto Lokasi
                </span>
              </div>

              <div className="space-y-1.5 text-left w-full">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                    Lokasi Temu
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {VENUE_NAME}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {VENUE_ADDRESS}
                </p>

                <div className="pt-1.5">
                  <a
                    href={VENUE_MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-950" />
                    <span>Petunjuk Arah Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-900" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 sm:p-10 space-y-7">
        
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mohon Lengkapi Data</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: Status Kehadiran (Bisa Hadir / Berhalangan) */}
        <div>
          <label className="block text-sm font-extrabold text-slate-800 mb-1.5">
            Konfirmasi Kehadiran Bapak/Ibu <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-4">
            Apakah Bapak/Ibu dapat hadir secara pribadi di {VENUE_NAME} pada Kamis sore (17.00 WIB)?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Bisa Hadir */}
            <div
              onClick={() => handleStatusSelect('hadir')}
              className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                formData.attendance_status === 'hadir'
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.attendance_status === 'hadir' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">Bisa Hadir</p>
                  <p className="text-xs text-slate-500">Dapatkan QR Code Tiket Masuk</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.attendance_status === 'hadir' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
              }`}>
                {formData.attendance_status === 'hadir' && <div className="w-2 h-2 rounded-full bg-white"></div>}
              </div>
            </div>

            {/* Berhalangan */}
            <div
              onClick={() => handleStatusSelect('tidak_hadir')}
              className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                formData.attendance_status === 'tidak_hadir'
                  ? 'border-rose-400 bg-rose-50/70 shadow-xs ring-2 ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.attendance_status === 'tidak_hadir' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                }`}>
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">Berhalangan</p>
                  <p className="text-xs text-slate-500">Belum dapat hadir di acara</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.attendance_status === 'tidak_hadir' ? 'border-rose-500 bg-rose-500' : 'border-slate-300'
              }`}>
                {formData.attendance_status === 'tidak_hadir' && <div className="w-2 h-2 rounded-full bg-white"></div>}
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: Kategori Asal Delegasi */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Kategori Asal Delegasi / Undangan <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <button
              type="button"
              onClick={() => handleCategorySelect('universitas')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                formData.institution_category === 'universitas'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs">Universitas Mitra</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('sekolah')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                formData.institution_category === 'sekolah'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <School className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs">Panitia Sekolah</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect('yayasan')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                formData.institution_category === 'yayasan'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Church className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs">Yayasan Gereja Protestan</span>
            </button>

          </div>
        </div>

        {/* SECTION 3: Identitas Personal Peserta */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nama Univ / Instansi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formData.institution_category === 'universitas'
                  ? 'Nama Perguruan Tinggi / Universitas'
                  : formData.institution_category === 'yayasan'
                  ? 'Nama Lembaga / Yayasan'
                  : 'Unit / Panitia Sekolah'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="university_name"
                  value={formData.university_name}
                  onChange={handleChange}
                  placeholder={
                    formData.institution_category === 'yayasan'
                      ? 'Yayasan Gereja Protestan Kampung Bali'
                      : formData.institution_category === 'sekolah'
                      ? 'Panitia Career Day Sekolah'
                      : 'Contoh: Universitas Tanjungpura / UMN / Binus'
                  }
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Nama Lengkap Peserta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Anda <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="pic_name"
                  value={formData.pic_name}
                  onChange={handleChange}
                  placeholder="Nama Lengkap & Gelar"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* No WhatsApp Pribadi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  name="pic_phone"
                  value={formData.pic_phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Jabatan (Hanya jika Hadir) */}
            {isAttending && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Posisi di Kampus
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="pic_position"
                    value={formData.pic_position}
                    onChange={handleChange}
                    placeholder="Contoh: Tim Admisi / Dosen / Humas"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email (Hanya jika Hadir) */}
            {isAttending && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="pic_email"
                    value={formData.pic_email}
                    onChange={handleChange}
                    placeholder="nama@kampus.ac.id"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* JIKA BERHALANGAN: CUKUP PESAN SINGKAT */}
        {!isAttending && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pesan / Alasan Singkat (Opsional)
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Pesan untuk panitia sekolah dan yayasan..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 outline-none transition-all"
              ></textarea>
            </div>
          </div>
        )}

        {/* JIKA HADIR: PREFERENSI MAKANAN & MATERI */}
        {isAttending && (
          <>
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Preferensi Diet Personal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferensi Makanan / Alergi Anda
                  </label>
                  <div className="relative">
                    <Utensils className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="dietary_requirements"
                      value={formData.dietary_requirements}
                      onChange={handleChange}
                      placeholder="Halal, Vegetarian, Alergi Udang, dll."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Disiapkan 1 porsi makan malam personal di {VENUE_NAME}.</p>
                </div>

                {/* Topik Presentasi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Materi Promosi Kampus yang Dibagikan ke Siswa
                  </label>
                  <div className="relative">
                    <Presentation className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="presentation_topic"
                      value={formData.presentation_topic}
                      onChange={handleChange}
                      placeholder="Contoh: Beasiswa 2026 / Jalur Prestasi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Checkbox Fasilitas */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="needs_projector"
                    checked={formData.needs_projector}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Membutuhkan Layar LCD Proyektor di {VENUE_NAME} untuk presentasi singkat
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan untuk Panitia (Opsional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Catatan kebutuhan meja display, standing banner, dll."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 outline-none transition-all"
                ></textarea>
              </div>
            </div>
          </>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
              isSubmitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : isAttending
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-[0.99]'
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-300 active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Menyimpan Konfirmasi...</span>
              </div>
            ) : isAttending ? (
              <>
                <Send className="w-5 h-5" />
                <span>Kirim Konfirmasi & Dapatkan QR Code Tiket Pribadi</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Kirim Konfirmasi Berhalangan</span>
              </>
            )}
          </button>
          
          <p className="text-center text-[11px] text-slate-400 mt-2">
            {VENUE_NAME} • Kamis Pukul 17.00 WIB (Jam 5 Sore)
          </p>
        </div>

      </form>
    </div>
  );
};
