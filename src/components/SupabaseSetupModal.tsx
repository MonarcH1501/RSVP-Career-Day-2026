import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, X, ShieldCheck, Terminal } from 'lucide-react';
import type { DatabaseType } from '../lib/supabase';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  databaseType: DatabaseType;
}

export const SupabaseSetupModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  databaseType,
}) => {
  const [activeTab, setActiveTab] = useState<'mysql' | 'supabase'>('mysql');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const mysqlSchemaCode = `-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS career_day_2026;
USE career_day_2026;

-- 2. Buat Tabel rsvp_guests
CREATE TABLE IF NOT EXISTS rsvp_guests (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    university_name VARCHAR(255) NOT NULL,
    pic_name VARCHAR(255) NOT NULL,
    pic_position VARCHAR(255) DEFAULT '',
    pic_phone VARCHAR(50) NOT NULL,
    pic_email VARCHAR(255) DEFAULT '',
    attendance_status ENUM('hadir', 'tidak_hadir', 'ragu_ragu') NOT NULL DEFAULT 'hadir',
    attendee_count INT NOT NULL DEFAULT 1,
    additional_attendees TEXT,
    dietary_requirements VARCHAR(255) DEFAULT '',
    presentation_topic TEXT,
    needs_projector TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT,
    is_checked_in TINYINT(1) NOT NULL DEFAULT 0,
    checked_in_at DATETIME NULL DEFAULT NULL,
    checked_in_by VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Index Pencarian Cepat
CREATE INDEX idx_univ ON rsvp_guests (university_name);
CREATE INDEX idx_status ON rsvp_guests (attendance_status);`;

  const mysqlCrudCode = `-- A. Ambil Semua Tamu
SELECT * FROM rsvp_guests ORDER BY created_at DESC;

-- B. Rekap Total Hadir & Porsi Konsumsi (Pax)
SELECT 
    COUNT(*) AS total_univ,
    SUM(CASE WHEN attendance_status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
    SUM(CASE WHEN attendance_status = 'hadir' THEN attendee_count ELSE 0 END) AS total_porsi_konsumsi
FROM rsvp_guests;

-- C. Check-In Tamu Hari-H
UPDATE rsvp_guests 
SET is_checked_in = 1, checked_in_at = NOW(), checked_in_by = 'Panitia'
WHERE id = 'ID_TAMU';`;

  const supabaseSqlSample = `-- Buat Tabel rsvp_guests di Supabase
CREATE TABLE IF NOT EXISTS public.rsvp_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    university_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    pic_position TEXT DEFAULT '',
    pic_phone TEXT NOT NULL,
    pic_email TEXT DEFAULT '',
    attendance_status TEXT NOT NULL DEFAULT 'hadir',
    attendee_count INTEGER NOT NULL DEFAULT 1,
    additional_attendees TEXT DEFAULT '',
    dietary_requirements TEXT DEFAULT '',
    presentation_topic TEXT DEFAULT '',
    needs_projector BOOLEAN DEFAULT false,
    notes TEXT DEFAULT '',
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by TEXT DEFAULT ''
);

ALTER TABLE public.rsvp_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON public.rsvp_guests FOR ALL USING (true);`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 text-left relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manajemen Database & Query SQL</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${
                databaseType === 'mysql' ? 'bg-blue-500' : databaseType === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
              <span className="text-xs font-semibold text-slate-600">
                Status Saat Ini:{' '}
                {databaseType === 'mysql'
                  ? '🔵 Terhubung ke MySQL Server'
                  : databaseType === 'supabase'
                  ? '🟢 Terhubung ke Supabase Cloud'
                  : '🟡 Penyimpanan Browser Lokal (Demo Mode)'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher: MySQL vs Supabase */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('mysql')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'mysql'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🐬 MySQL Database (Lokal / XAMPP / Cloud)</span>
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⚡ Supabase Cloud (PostgreSQL)</span>
          </button>
        </div>

        {/* TAB 1: MYSQL */}
        {activeTab === 'mysql' && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl text-blue-900 text-xs">
              <p className="font-bold flex items-center gap-1 text-blue-800">
                <ShieldCheck className="w-4 h-4" /> Menggunakan MySQL
              </p>
              <p className="mt-0.5">
                Aplikasi telah dilengkapi Express backend API di folder <code>server/</code> yang langsung terhubung ke database MySQL (XAMPP, Laragon, phpMyAdmin, atau MySQL Workbench).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800">1. Skrip Pembuatan Tabel MySQL (`schema_mysql.sql`):</label>
                <button
                  onClick={() => handleCopy(mysqlSchemaCode, 'mysql_schema')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedType === 'mysql_schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'mysql_schema' ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto">
                <pre>{mysqlSchemaCode}</pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800">2. Contoh Query CRUD & Laporan Konsumsi:</label>
                <button
                  onClick={() => handleCopy(mysqlCrudCode, 'mysql_crud')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedType === 'mysql_crud' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'mysql_crud' ? 'Tersalin!' : 'Salin Query'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-h-28 overflow-y-auto">
                <pre>{mysqlCrudCode}</pre>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" /> Cara Menjalankan Backend MySQL:
              </p>
              <p>1. Pastikan MySQL di XAMPP / service MySQL aktif.</p>
              <p>2. Impor atau jalankan query di atas di phpMyAdmin / MySQL.</p>
              <p>3. Buka terminal baru dan jalankan: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-indigo-700">npm run server</code></p>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE */}
        {activeTab === 'supabase' && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl text-emerald-900 text-xs">
              <p className="font-bold flex items-center gap-1 text-emerald-800">
                <ShieldCheck className="w-4 h-4" /> Supabase Cloud Database
              </p>
              <p className="mt-0.5">
                Database cloud gratis bertenaga PostgreSQL, dapat diakses dari mana saja tanpa perlu menyalakan server lokal.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800">Skrip SQL Supabase (`schema.sql`):</label>
                <button
                  onClick={() => handleCopy(supabaseSqlSample, 'supabase_schema')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedType === 'supabase_schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'supabase_schema' ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto">
                <pre>{supabaseSqlSample}</pre>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                1. Kunjungi{' '}
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">
                  supabase.com <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                dan buat Project baru.
              </p>
              <p>2. Salin query di atas ke menu <strong>SQL Editor</strong> di Supabase dan klik <strong>Run</strong>.</p>
              <p>3. Salin <code>Project URL</code> dan <code>anon key</code> ke file <code>.env</code>.</p>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
