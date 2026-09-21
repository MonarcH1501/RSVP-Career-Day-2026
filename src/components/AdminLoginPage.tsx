import React, { useState } from 'react';
import { User, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import logoIcon from '../assets/logoicon.png';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // Validasi kredensial admin default
      if (username.trim() === 'admin' && password === '@Qwerty123') {
        sessionStorage.setItem('career_day_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setError('Username atau Password salah. (Default: admin / @Qwerty123)');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full">
        
        {/* Brand */}
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center border border-white/20">
            <img src={logoIcon} alt="Logo Career Day 2026" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Portal Admin Panitia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Makrab Career Day 2026 • Restoran Gajah Mada Pontianak
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 sm:mt-8 bg-white/95 backdrop-blur-md py-6 px-4 sm:py-8 sm:px-10 shadow-2xl rounded-2xl sm:rounded-3xl border border-white/20 text-left">
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Username Admin
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">Kredensial Default:</p>
              <p>Username: <code className="text-indigo-600 font-bold">admin</code></p>
              <p>Password: <code className="text-indigo-600 font-bold">@Qwerty123</code></p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:bg-indigo-400"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1"
            >
              ← Kembali ke Form RSVP
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
