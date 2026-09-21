import React from 'react';
import { 
  GraduationCap, 
  Database,
  MapPin,
  Calendar
} from 'lucide-react';
import type { DatabaseType } from '../lib/supabase';

interface NavbarProps {
  databaseType: DatabaseType;
  onOpenDatabaseGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  databaseType,
  onOpenDatabaseGuide,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Event Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-linear-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Career Day 2026</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Makrab
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <a 
                  href="https://www.google.com/maps/place/Restaurant+Gajah+Mada/@-0.0374499,109.3432347,17z/data=!3m1!4b1!4m6!3m5!1s0x2e1d58553a624eab:0xb1dc104ddd5dad9c!8m2!3d-0.0374499!4d109.3432347!16s%2Fg%2F1ptyc_4_2?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                  title="Buka Lokasi di Google Maps"
                >
                  <MapPin className="w-3 h-3 text-rose-500 inline" />
                  Restoran Gajah Mada Pontianak
                </a>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-slate-500">
                  <Calendar className="w-3 h-3 inline text-slate-400" />
                  Kamis, 17.00 WIB
                </span>
              </p>
            </div>
          </div>

          {/* Right Action: Database Status Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDatabaseGuide}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                databaseType === 'mysql'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : databaseType === 'supabase'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Klik untuk panduan setup Database MySQL & Supabase"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  databaseType === 'mysql'
                    ? 'bg-blue-400'
                    : databaseType === 'supabase'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  databaseType === 'mysql'
                    ? 'bg-blue-600'
                    : databaseType === 'supabase'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}></span>
              </span>
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">
                {databaseType === 'mysql'
                  ? 'MySQL Online'
                  : databaseType === 'supabase'
                  ? 'Supabase Online'
                  : 'Mode Demo (Lokal)'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
