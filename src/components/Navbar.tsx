import React from 'react';
import { 
  Sparkles,
  Church
} from 'lucide-react';
import logoIcon from '../assets/logoicon.png';

interface NavbarProps {
  onOpenDatabaseGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18">
          
          {/* Brand Logo & Event Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-xs border border-rose-200/60 shrink-0">
              <img src={logoIcon} alt="Logo YGPKB" className="w-full h-full object-cover" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate">
                  Perayaan Natal Bersama
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  YGPKB
                </span>
              </div>
              
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                <span className="text-emerald-700 font-semibold truncate flex items-center gap-1">
                  <Church className="w-3 h-3 text-emerald-600 shrink-0 inline" />
                  <span>SKI • Yayasan YGPKB • ITBSS</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Badge Status Pendataan */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Pendataan Online Aktif</span>
              <span className="sm:hidden text-[11px]">Form Online</span>
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};
