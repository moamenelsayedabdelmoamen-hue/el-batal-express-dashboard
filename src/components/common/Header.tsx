import React from 'react';
import { Menu, Shield } from 'lucide-react';

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
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>لوحة الإدارة</span>
        </div>
      </div>
    </header>
  );
};
