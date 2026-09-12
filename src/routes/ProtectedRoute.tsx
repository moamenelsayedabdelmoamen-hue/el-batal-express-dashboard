import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b10] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 font-semibold text-sm">جاري التحقق من هوية وصلاحيات المسؤول...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but lacks Admin Role (Custom Claims role !== 'admin')
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center p-6 text-zinc-100" dir="rtl">
        <div className="w-full max-w-lg bg-[#11141c] border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">الدخول مقيد (غير مصرح)</h2>
          <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
            تم تسجيل الدخول بنجاح بحساب <span className="font-mono text-amber-400 font-bold">{user.email}</span>، ولكن هذا الحساب لا يملك صلاحية مدير النظام (<span className="font-mono text-rose-400">role = admin</span>).
          </p>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-right mb-6 text-xs text-zinc-400 space-y-2">
            <p className="font-bold text-zinc-200">تعليمات أمان النظام:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>تتطلب لوحة تحكم El Batal Express وجود Custom Claim بالدور: <code className="text-amber-400 bg-zinc-800 px-1 py-0.5 rounded">role: 'admin'</code></li>
              <li>يتم تعيين الصلاحية عبر Firebase Admin SDK أو Cloud Functions الآمنة.</li>
              <li>لا يسمح للمطاعم أو الكباتن أو المستخدمين العاديين بفتح لوحة الإدارة.</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة التحقق</span>
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج والتبديل</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
