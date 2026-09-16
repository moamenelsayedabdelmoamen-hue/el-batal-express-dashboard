import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  UserPlus,
  KeyRound,
  User,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import appLogo from '../../assets/images/elbatal_logo_1789202744301.jpg';
import { AdminProfileModal } from './AdminProfileModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'لوحة التحكم الرئيسية', icon: LayoutDashboard },
    { to: '/send-order', label: 'إرسال طلب لكابتن', icon: Send },
    { to: '/restaurants', label: 'المطاعم', icon: UtensilsCrossed },
    { to: '/captains', label: 'الكباتن', icon: Bike },
    { to: '/orders', label: 'الطلبات', icon: ShoppingBag },
    { to: '/subscriptions', label: 'الاشتراكات', icon: CreditCard },
    { to: '/payments', label: 'المدفوعات', icon: Receipt },
    { to: '/sheets', label: 'تصدير وجداول البيانات', icon: FileSpreadsheet },
    { to: '/admins', label: 'إضافة مسؤول', icon: UserPlus },
    { to: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 w-72 bg-[#0d1017] border-l border-zinc-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-black border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10 p-0.5">
              <img
                src={appLogo}
                alt="شعار البطل إكسبريس"
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wide text-zinc-100">
                  El Batal Express
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-400">
                البطل إكسبريس • لوحة الإدارة
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/60"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            القائمة الرئيسية
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive
                          ? 'text-zinc-950'
                          : 'text-zinc-400 group-hover:text-amber-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User info & Logout */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#090b10]">
          {/* Admin Profile Button */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full text-right mb-3 p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-amber-500/40 transition-all cursor-pointer group"
            title="الملف التعريفي لمسؤول النظام (تعديل كلمة السر)"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 group-hover:border-amber-400 transition-colors">
                {user?.displayName ? user.displayName.charAt(0) : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                    {user?.displayName || 'مدير النظام'}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                    الملف التعريفي
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 tracking-wide truncate">
                    {user?.email || 'admin@elbatalexpress.com'}
                  </span>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
