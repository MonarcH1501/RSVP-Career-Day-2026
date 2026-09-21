import React from 'react';
import { 
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import logoIcon from '../assets/logoicon.png';

interface NavbarProps {
  onOpenDatabaseGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18">
          
          {/* Brand Logo & Event Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
              <img src={logoIcon} alt="Logo Career Day 2026" className="w-full h-full object-contain" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate">Career Day 2026</span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  Makrab
                </span>
              </div>
              
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                <a 
                  href="https://www.google.com/maps/place/Restaurant+Gajah+Mada/@-0.0374499,109.3432347,17z/data=!3m1!4b1!4m6!3m5!1s0x2e1d58553a624eab:0xb1dc104ddd5dad9c!8m2!3d-0.0374499!4d109.3432347!16s%2Fg%2F1ptyc_4_2?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-0.5 truncate"
                  title="Buka Lokasi di Google Maps"
                >
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0 inline" />
                  <span className="truncate">Restoran Gajah Mada</span>
                </a>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 inline" />
                  <span>17.00 WIB</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Lokasi Google Maps */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="https://www.google.com/maps/place/Restaurant+Gajah+Mada/@-0.0374499,109.3432347,17z/data=!3m1!4b1!4m6!3m5!1s0x2e1d58553a624eab:0xb1dc104ddd5dad9c!8m2!3d-0.0374499!4d109.3432347!16s%2Fg%2F1ptyc_4_2?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="hidden sm:inline">Petunjuk Arah Maps</span>
              <span className="sm:hidden text-[11px]">Peta Lokasi</span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 hidden sm:inline" />
            </a>
          </div>

        </div>
      </div>
    </header>
  );
};
