import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';

interface ExportButtonProps {
  onExportExcel: () => void;
  onExportCsv: () => void;
  label?: string;
  count?: number;
  className?: string;
  compact?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExportExcel,
  onExportCsv,
  label = 'تصدير البيانات',
  count,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-right ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
        title="تصدير فوري بدون تسجيل دخول (Excel أو CSV)"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
        <span>{label}</span>
        {count !== undefined && (
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            {count}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 rounded-2xl bg-[#121620] border border-zinc-800 shadow-2xl z-50 py-2 divide-y divide-zinc-800/80 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2">
            <p className="text-[11px] font-bold text-zinc-300">تصدير فوري دون تسجيل دخول</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">جاهز للفتح في Excel أو Google Sheets</p>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportExcel();
              }}
              className="w-full text-right px-3.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-emerald-500/15 flex items-center justify-between group transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-300 group-hover:text-emerald-200">ملف Excel (.xlsx)</div>
                  <div className="text-[10px] text-zinc-400">تنسيق جداول متقدم + ألوان عربية</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportCsv();
              }}
              className="w-full text-right px-3.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-cyan-500/15 flex items-center justify-between group transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-cyan-300 group-hover:text-cyan-200">ملف CSV (.csv)</div>
                  <div className="text-[10px] text-zinc-400">متوافق مع كل البرامج (UTF-8)</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
