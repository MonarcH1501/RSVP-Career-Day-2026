import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RsvpForm } from './components/RsvpForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { 
  fetchGuests, 
  createGuest, 
  updateGuest, 
  deleteGuest, 
  checkInGuest,
  type DatabaseType
} from './lib/supabase';
import type { RsvpGuest, CreateRsvpInput, UpdateRsvpInput } from './types';
import { GraduationCap, CheckCircle2 } from 'lucide-react';

export function App() {
  const checkIsAdminRoute = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.startsWith('/adminpage') ||
      hash.includes('adminpage') ||
      search.includes('adminpage')
    );
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [guests, setGuests] = useState<RsvpGuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseType, setDatabaseType] = useState<DatabaseType>('local');
  
  // Admin auth state (Username: admin, Password: @Qwerty123)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('career_day_admin_auth') === 'true';
  });
  
  const [isDatabaseGuideOpen, setIsDatabaseGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync route on popstate and hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load guests data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchGuests();
      setGuests(res.data);
      setDatabaseType(res.databaseType);
    } catch (err) {
      console.error('Failed to load guest data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler: Create RSVP
  const handleCreateRsvp = async (input: CreateRsvpInput) => {
    const res = await createGuest(input);
    if (res.data) {
      setGuests((prev) => [res.data!, ...prev.filter((g) => g.id !== res.data!.id)]);
      showToast(`Konfirmasi untuk ${res.data.university_name} berhasil disimpan!`);
    }
    return res;
  };

  // Handler: Update Guest
  const handleUpdateGuest = async (id: string, input: UpdateRsvpInput) => {
    const res = await updateGuest(id, input);
    if (res.data) {
      setGuests((prev) => prev.map((g) => (g.id === id ? res.data! : g)));
      showToast(`Data ${res.data.university_name} berhasil diperbarui.`);
    }
    return res;
  };

  // Handler: Delete Guest
  const handleDeleteGuest = async (id: string) => {
    const res = await deleteGuest(id);
    if (res.success) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
      showToast('Data tamu berhasil dihapus.');
    }
    return res;
  };

  // Handler: Check-In Toggle
  const handleCheckInToggle = async (id: string, isCheckedIn: boolean) => {
    const res = await checkInGuest(id, isCheckedIn);
    if (res.data) {
      setGuests((prev) => prev.map((g) => (g.id === id ? res.data! : g)));
      showToast(
        isCheckedIn
          ? `✅ ${res.data.university_name} berhasil Check-In di Restoran Gajah Mada!`
          : `Check-in ${res.data.university_name} dibatalkan.`
      );
    }
  };

  // Navigation handlers
  const handleGoToAdmin = () => {
    window.history.pushState({}, '', '/adminpage');
    setIsAdminRoute(true);
  };

  const handleBackToPublic = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminLoggedIn(true);
    showToast('Selamat datang di Dashboard Admin Career Day 2026!');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('career_day_admin_auth');
    setIsAdminLoggedIn(false);
    handleBackToPublic();
    showToast('Anda telah keluar dari mode Admin.');
  };

  // 1. JIKA DIAKSES MELALUI ROUTE /adminpage
  if (isAdminRoute) {
    if (!isAdminLoggedIn) {
      return (
        <AdminLoginPage
          onLoginSuccess={handleAdminAuthSuccess}
          onBackToHome={handleBackToPublic}
        />
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        <AdminDashboard
          guests={guests}
          isLoading={isLoading}
          onRefresh={loadData}
          onCreateGuest={handleCreateRsvp}
          onUpdateGuest={handleUpdateGuest}
          onDeleteGuest={handleDeleteGuest}
          onCheckInToggle={handleCheckInToggle}
          onLogoutAdmin={handleAdminLogout}
          onGoToPublicPage={handleBackToPublic}
        />

        <SupabaseSetupModal
          isOpen={isDatabaseGuideOpen}
          onClose={() => setIsDatabaseGuideOpen(false)}
          databaseType={databaseType}
        />
      </div>
    );
  }

  // 2. HALAMAN PUBLIK (Formulir RSVP Delegasi Universitas, Sekolah, & Yayasan)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
      
      {/* Navigation Header Bersih */}
      <Navbar
        databaseType={databaseType}
        onOpenDatabaseGuide={() => setIsDatabaseGuideOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area: Formulir RSVP Publik & E-Tiket QR */}
      <main className="flex-1">
        <RsvpForm onSubmitRsvp={handleCreateRsvp} />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700">Career Day 2026</span>
            <span>•</span>
            <span>Restoran Gajah Mada Pontianak</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Universitas Mitra • Panitia Sekolah • Yayasan Gereja Protestan Kampung Bali</span>
            <span>•</span>
            <button
              onClick={() => setIsDatabaseGuideOpen(true)}
              className="text-indigo-600 hover:underline font-medium"
            >
              Info Database
            </button>
            <span>•</span>
            <button
              onClick={handleGoToAdmin}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Akses Panitia"
            >
              Portal Panitia
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseSetupModal
        isOpen={isDatabaseGuideOpen}
        onClose={() => setIsDatabaseGuideOpen(false)}
        databaseType={databaseType}
      />

    </div>
  );
}

export default App;
