import React from 'react';
import { Menu, Database, Shield } from 'lucide-react';
import { isFirebaseConfigured, firebaseConfig } from '../../firebase/config';

interface HeaderProps {
  title: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenMobileMenu }) => {
  return (
    <header className="sticky top-0 z-20 bg-[#0d1017]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800/60 transition-colors"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-black text-zinc-100">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Firebase project badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] text-zinc-400">المشروع:</span>
          <span className="font-mono text-amber-400 font-bold text-[11px]">{firebaseConfig.projectId}</span>
          <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Access</span>
        </div>
      </div>
    </header>
  );
};
