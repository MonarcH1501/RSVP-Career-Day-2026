import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock, 
  ArrowRight,
  Search,
  Sparkles,
  Check,
  SwitchCamera
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import type { RsvpGuest } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: RsvpGuest[];
  receptionistStaff: string;
  onCheckIn: (id: string, isCheckedIn: boolean, checkedInBy?: string) => Promise<void>;
}

type ScanStatus = 'idle' | 'success' | 'already_checked_in' | 'not_found' | 'error';

interface ScanResult {
  status: ScanStatus;
  guest?: RsvpGuest;
  rawText?: string;
  message?: string;
  timestamp?: string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  guests,
  receptionistStaff,
  onCheckIn,
}) => {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScannerStarting, setIsScannerStarting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const guestsRef = useRef<RsvpGuest[]>(guests);

  // Sync latest guests list to ref so scanner callback always sees current data
  useEffect(() => {
    guestsRef.current = guests;
  }, [guests]);

  // Audio synthesizer feedback using Web Audio API (100% reliable, zero network dependency)
  const playFeedbackSound = (type: 'success' | 'warning' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        // High harmonic chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
      } else if (type === 'warning') {
        // Double alert tone
        [440, 440].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.12);
        });
      } else {
        // Low buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio playback restricted by browser policy before first interaction
    }
  };

  // Helper to extract guest id from QR code payload
  const parsePayload = (text: string): string => {
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.id) {
        return String(parsed.id).trim();
      }
    } catch {
      // Raw string
    }
    return text.trim();
  };

  // Process a scanned ID
  const processAttendanceCheckIn = async (rawCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    isPausedRef.current = true;

    const targetId = parsePayload(rawCode);
    const allGuests = guestsRef.current;

    // Search by ID exact or contains
    const foundGuest = allGuests.find(
      (g) =>
        g.id.toLowerCase() === targetId.toLowerCase() ||
        g.id.toLowerCase().includes(targetId.toLowerCase()) ||
        rawCode.toLowerCase().includes(g.id.toLowerCase())
    );

    if (!foundGuest) {
      playFeedbackSound('error');
      setScanResult({
        status: 'not_found',
        rawText: rawCode,
        message: 'QR Code tidak dikenali atau bukan tiket sah Career Day 2026.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      setIsProcessing(false);
      return;
    }

    // Jika sudah pernah check-in sebelumnya
    if (foundGuest.is_checked_in) {
      playFeedbackSound('warning');
      setScanResult({
        status: 'already_checked_in',
        guest: foundGuest,
        message: `Tamu ini sudah pernah melakukan Check-In sebelumnya.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      setIsProcessing(false);
      return;
    }

    // OTOMATIS CATAT KEHADIRAN (Presensi 1 detik)
    try {
      await onCheckIn(foundGuest.id, true, receptionistStaff);
      playFeedbackSound('success');
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
        });
      } catch {}

      setScanResult({
        status: 'success',
        guest: {
          ...foundGuest,
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: receptionistStaff,
        },
        message: `Presensi berhasil dicatat otomatis! Selamat datang di Restoran Gajah Mada.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err: unknown) {
      playFeedbackSound('error');
      setScanResult({
        status: 'error',
        guest: foundGuest,
        message: err instanceof Error ? err.message : 'Terjadi kendala saat update presensi ke server.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Resume scanning for next attendee
  const handleScanNext = () => {
    setScanResult(null);
    setManualCodeInput('');
    isPausedRef.current = false;
  };

  // Initialize and start camera
  useEffect(() => {
    if (!isOpen) {
      // Clean up when modal closes
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          });
        } else {
          html5QrCodeRef.current.clear();
          html5QrCodeRef.current = null;
        }
      }
      setScanResult(null);
      setScannerError(null);
      isPausedRef.current = false;
      return;
    }

    let isMounted = true;
    setIsScannerStarting(true);
    setScannerError(null);

    const initCamera = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available (label contains back/rear/environment)
          const backCam = devices.find((d) => /back|rear|belakang|environment/i.test(d.label));
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
          startScannerWithCamera(chosenId);
        } else {
          setScannerError('Tidak ada kamera yang terdeteksi pada perangkat ini.');
          setIsScannerStarting(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setScannerError(
          err instanceof Error
            ? `Izin kamera ditolak atau belum aktif: ${err.message}`
            : 'Gagal mengakses kamera. Mohon izinkan akses kamera pada browser.'
        );
        setIsScannerStarting(false);
      }
    };

    // Small delay to ensure modal DOM container is fully mounted
    const timeout = setTimeout(initCamera, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          });
        } else {
          html5QrCodeRef.current.clear();
          html5QrCodeRef.current = null;
        }
      }
    };
  }, [isOpen]);

  const startScannerWithCamera = async (cameraId: string) => {
    setIsScannerStarting(true);
    setScannerError(null);

    // Stop existing scanner if running
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {}
    }

    try {
      const scanner = new Html5Qrcode('qr-reader-viewport');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!isPausedRef.current) {
            processAttendanceCheckIn(decodedText);
          }
        },
        () => {
          // Frame scan failures are normal between frames, silence them
        }
      );
    } catch (err: unknown) {
      setScannerError(
        err instanceof Error
          ? `Gagal memulai video stream: ${err.message}`
          : 'Gagal menyalakan scanner.'
      );
    } finally {
      setIsScannerStarting(false);
    }
  };

  const handleSwitchCamera = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    await startScannerWithCamera(cameraId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    processAttendanceCheckIn(manualCodeInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-left relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white truncate">
                  Scan QR Presensi
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-900 shrink-0">
                  Auto Check-In
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                Arahkan kamera ke tiket tamu untuk absensi instan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Staf & Camera Selector Toolbar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-bold text-slate-700">Staf Meja Depan:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-indigo-700">
              {receptionistStaff}
            </span>
          </div>

          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <SwitchCamera className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCameraId}
                onChange={(e) => handleSwitchCamera(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${cam.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          
          {/* CAMERA VIEWFINDER CONTAINER */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
            
            {/* HTML5-QRCODE TARGET VIEWPORT */}
            <div id="qr-reader-viewport" className="w-full max-w-[360px] overflow-hidden" />

            {/* Target Reticle Overlay */}
            {!scanResult && !isScannerStarting && !scannerError && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-60 h-60 border-2 border-emerald-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {/* Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Animated laser line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#10b981]" />
                </div>
              </div>
            )}

            {/* Starting Indicator */}
            {isScannerStarting && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-6 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-sm font-bold">Mengaktifkan Kamera...</p>
                <p className="text-xs text-slate-400 mt-1">Mohon izinkan akses kamera di browser Anda</p>
              </div>
            )}

            {/* Error Message Container */}
            {scannerError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-6 text-center">
                <XCircle className="w-10 h-10 text-rose-400 mb-3" />
                <p className="text-sm font-bold text-rose-300">Kamera Tidak Dapat Digunakan</p>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">{scannerError}</p>
                <p className="text-[11px] text-amber-300 mt-3">
                  💡 Anda tetap dapat melakukan absensi dengan mengetikkan ID Tiket pada kolom di bawah.
                </p>
              </div>
            )}

            {/* Scanning processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                <p className="text-sm font-black tracking-wide">Mencatat Presensi...</p>
                <p className="text-xs text-slate-300 mt-0.5">Sinkronisasi kehadiran dengan database</p>
              </div>
            )}

            {/* SCAN RESULT CARD OVERLAY */}
            {scanResult && !isProcessing && (
              <div className="absolute inset-0 z-30 p-5 flex items-center justify-center animate-in zoom-in-95 fade-in duration-200">
                
                {/* 1. SUCCESS: PRESENSI BERHASIL */}
                {scanResult.status === 'success' && scanResult.guest && (
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border-2 border-emerald-500 shadow-2xl w-full text-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                        ✅ Presensi Berhasil
                      </span>
                      <h4 className="text-lg font-black text-slate-900 mt-1.5">
                        {scanResult.guest.pic_name}
                      </h4>
                      <p className="text-xs font-bold text-indigo-700">
                        {scanResult.guest.university_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        Tiba pukul {scanResult.timestamp || 'Baru saja'} • {scanResult.guest.attendee_count} Pax
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-2.5 text-[11px] text-emerald-800 font-semibold border border-emerald-200">
                      Kehadiran otomatis dicatat oleh <span className="font-bold">{receptionistStaff}</span>.
                    </div>

                    <button
                      onClick={handleScanNext}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <span>Scan Tamu Berikutnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 2. WARNING: SUDAH CHECK-IN */}
                {scanResult.status === 'already_checked_in' && scanResult.guest && (
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border-2 border-amber-400 shadow-2xl w-full text-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                      <AlertTriangle className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
                        ⚠️ Sudah Pernah Check-In
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1.5">
                        {scanResult.guest.pic_name}
                      </h4>
                      <p className="text-xs font-bold text-slate-600">
                        {scanResult.guest.university_name}
                      </p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Tamu ini sudah diverifikasi sebelumnya di meja resepsionis.
                      </p>
                    </div>

                    <button
                      onClick={handleScanNext}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <span>Lanjut Scan Tamu Lain</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 3. ERROR / NOT FOUND */}
                {(scanResult.status === 'not_found' || scanResult.status === 'error') && (
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border-2 border-rose-500 shadow-2xl w-full text-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                      <XCircle className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500 text-white">
                        Tiket Tidak Dikenali
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1.5">
                        {scanResult.message}
                      </h4>
                      {scanResult.rawText && (
                        <p className="text-[10px] font-mono text-slate-400 mt-1 break-all bg-slate-100 p-1.5 rounded-lg">
                          Kode: {scanResult.rawText.slice(0, 45)}...
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleScanNext}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Coba Scan Ulang</span>
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* MANUAL ID / KODE INPUT AS BACKUP */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Opsi Cadangan: Masukkan ID Tiket / Kode Manual</span>
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="Contoh: rsvp_172689... atau tempel teks QR"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualCodeInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:bg-indigo-300 transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Absen</span>
              </button>
            </form>
          </div>

          {/* Petunjuk Panitia */}
          <div className="flex items-start gap-2.5 text-[11px] text-slate-500 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-900">Tips Presensi Meja Depan:</p>
              <p className="text-slate-600">
                Pastikan tamu memperlihatkan QR Code dari HP mereka dengan kecerahan layar cukup. Sistem otomatis mendeteksi tiket dan mencatat kehadiran seketika.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
