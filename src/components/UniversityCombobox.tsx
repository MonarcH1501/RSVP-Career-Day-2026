import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, ChevronDown, Check, X, Search } from 'lucide-react';
import { UNIVERSITY_LIST } from '../data/universities';

interface UniversityComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const UniversityCombobox: React.FC<UniversityComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Ketik untuk cari atau pilih universitas...',
  required = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search term with external value when not focused
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filtered universities based on search term
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) {
      return UNIVERSITY_LIST;
    }
    const clean = searchTerm.toLowerCase().trim();
    return UNIVERSITY_LIST.filter((item) =>
      item.toLowerCase().includes(clean)
    );
  }, [searchTerm]);

  const handleSelect = (univName: string) => {
    onChange(univName);
    setSearchTerm(univName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setSearchTerm(newText);
    onChange(newText);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    inputRef.current?.focus();
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field with Icons */}
      <div className="relative">
        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full pl-10 pr-20 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white font-medium text-slate-900 placeholder:text-slate-400"
        />

        {/* Right buttons: Clear & Chevron */}
        <div className="absolute right-2 top-2 sm:top-2.5 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Hapus"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Buka pilihan"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Bar: Status Info */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Search className="w-3 h-3 text-indigo-500" />
              {searchTerm.trim() ? (
                <>Ditemukan <strong className="text-indigo-600">{filteredList.length}</strong> pilihan</>
              ) : (
                <>Pilih dari <strong className="text-slate-700">{UNIVERSITY_LIST.length}</strong> Universitas Mitra</>
              )}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Ketik untuk mencari</span>
          </div>

          {/* Scrollable list */}
          <div className="max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain divide-y divide-slate-50">
            {filteredList.length > 0 ? (
              filteredList.map((univ) => {
                const isSelected = value.trim().toLowerCase() === univ.toLowerCase();
                return (
                  <button
                    key={univ}
                    type="button"
                    onClick={() => handleSelect(univ)}
                    className={`w-full text-left px-4 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-indigo-50/50'
                    }`}
                  >
                    <span className="truncate">{univ}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Tidak ditemukan nama <em>"{searchTerm}"</em> dalam daftar mitra.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
                >
                  Gunakan nama "{searchTerm}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
