import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/live-map')) return 'الخريطة المباشرة والمواقع الحية';
    if (pathname.includes('/send-order')) return 'إرسال طلب إلى كابتن التوصيل';
    if (pathname.includes('/restaurants')) return 'إدارة المطاعم';
    if (pathname.includes('/captains')) return 'إدارة الكباتن';
    if (pathname.includes('/orders')) return 'إدارة الطلبات';
    if (pathname.includes('/subscriptions')) return 'إدارة الاشتراكات';
    if (pathname.includes('/payments')) return 'المدفوعات والمعاملات';
    if (pathname.includes('/sheets')) return 'تكامل وجداول Google Sheets';
    if (pathname.includes('/admins')) return 'إضافة وإدارة المسؤولين';
    if (pathname.includes('/settings')) return 'إعدادات النظام والشركة';
    return 'لوحة التحكم الرئيسية';
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 flex flex-row-reverse" dir="rtl">
      {/* Sidebar on right in RTL */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col lg:mr-72 transition-all duration-300">
        <Header
          title={getPageTitle(location.pathname)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
