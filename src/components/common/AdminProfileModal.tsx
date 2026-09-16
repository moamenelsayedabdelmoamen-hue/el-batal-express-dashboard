import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, changePassword } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toastError('يرجى إدخال كلمة السر الجديدة');
      return;
    }

    if (newPassword.length < 6) {
      toastError('كلمة السر يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('كلمة السر وتأكيد كلمة السر غير متطابقين');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(newPassword);
      if (res.resetEmailSent) {
        info('تم إرسال رابط تأكيد تحديث كلمة السر إلى بريدك الإلكتروني بنجاح.');
      } else {
        success('تم تحديث كلمة السر لمسؤول النظام بنجاح!');
      }
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toastError(err.message || 'حدث خطأ أثناء محاولة تحديث كلمة السر');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div
        className="w-full max-w-lg bg-[#0e111a] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                الملف التعريفي لمسؤول النظام
              </h3>
              <p className="text-xs text-zinc-400">
                بيانات الحساب الأساسية وتغيير كلمة المرور
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only Information: Name & Email */}
        <div className="space-y-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60">
          {/* Admin Name (Read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>اسم المسؤول</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                للعرض فقط
              </span>
            </div>
            <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 font-bold">
              {user?.displayName || 'مدير النظام'}
            </div>
          </div>

          {/* Admin Email (Read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>البريد الإلكتروني</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                للعرض فقط
              </span>
            </div>
            <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-300 font-mono text-left" dir="ltr">
              {user?.email || 'admin@elbatalexpress.com'}
            </div>
          </div>

          {/* Admin Role Status */}
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">نوع الصلاحية:</span>
            <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin (role = admin)</span>
            </span>
          </div>
        </div>

        {/* Change Password Section (Editable) */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <KeyRound className="w-4 h-4" />
            <span>تعديل كلمة السر (الحقل المسموح بتعديله):</span>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              كلمة السر الجديدة <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة السر الجديدة (6 خانات فأكثر)"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pr-10 pl-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                dir="ltr"
                required
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              تأكيد كلمة السر الجديدة <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة السر الجديدة للتأكيد"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                dir="ltr"
                required
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التحديث...' : 'تحديث كلمة السر'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
