import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Mail,
  Lock,
  User,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Clock,
  Send,
  AlertCircle,
  Users,
} from 'lucide-react';
import { AdminService, ROLE_DEFINITIONS } from '../services/adminService';
import { AdminAccount, AdminRolePermission } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

export const AdminsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRoles, setSelectedRoles] = useState<AdminRolePermission[]>([
    'manage_orders',
  ]);

  // Last action feedback banner
  const [lastActionStatus, setLastActionStatus] = useState<{
    email: string;
    verifiedSent: boolean;
  } | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAll();
      setAdmins(res.data);
    } catch (err) {
      console.error('Failed to load admins:', err);
      toastError('فشل تحميل قائمة المسؤولين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const toggleRole = (roleId: AdminRolePermission) => {
    if (selectedRoles.includes(roleId)) {
      // Prevent deselecting all roles
      if (selectedRoles.length === 1) {
        toastError('يجب اختيار دور واحد على الأقل للمسؤول');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError('يرجى إدخال اسم المسؤول');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toastError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (!password || password.length < 6) {
      toastError('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }
    if (selectedRoles.length === 0) {
      toastError('يرجى تحديد دور واحد على الأقل');
      return;
    }

    setSubmitting(true);
    try {
      const result = await AdminService.createAdmin({
        name: name.trim(),
        email: email.trim(),
        password: password,
        roles: selectedRoles,
        addedBy: user?.displayName || user?.email || 'مدير النظام',
      });

      setLastActionStatus({
        email: email.trim(),
        verifiedSent: result.emailVerificationSent,
      });

      success('تم حفظ المسؤول في Firestore وإرسال بريد تفعيل الحساب بنجاح!');
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setSelectedRoles(['manage_orders']);

      // Refresh admins list
      await fetchAdmins();
    } catch (err: any) {
      console.error('Error creating admin:', err);
      toastError(err.message || 'حدث خطأ أثناء إضافة المسؤول وحفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId: string, adminName: string) => {
    if (adminId === user?.uid) {
      toastError('لا يمكنك حذف حسابك الحالي');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف المسؤول "${adminName}" من النظام؟`)) {
      return;
    }

    try {
      await AdminService.deleteAdmin(adminId);
      setAdmins((prev) => prev.filter((a) => a.id !== adminId && a.uid !== adminId));
      success('تم حذف المسؤول من قاعدة البيانات بنجاح');
    } catch (err) {
      toastError('فشل حذف المسؤول');
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              إضافة وإدارة المسؤولين (Admins)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            إنشاء حسابات مسؤولي النظام وتحديد أدوارهم وصلاحياتهم وإرسال رابط تفعيل البريد الإلكتروني
          </p>
        </div>

        <button
          onClick={fetchAdmins}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>تحديث المسؤولين</span>
        </button>
      </div>

      {/* Success Notification Banner when an admin is created */}
      {lastActionStatus && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-emerald-200">
              تم تسجيل المسؤول الجديد بنجاح في قاعدة بيانات Firestore (`admins`)
            </p>
            <p className="text-xs text-emerald-300/80">
              تم إرسال رسالة بريد إلكتروني تلقائية إلى <strong className="text-white font-mono">{lastActionStatus.email}</strong> تحتوي على رابط التحقق وتفعيل الحساب.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Card: Add Admin */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#121622] to-[#0e111a] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">إضافة مسؤول جديد</h3>
              <p className="text-xs text-zinc-400">إدخال البيانات والصلاحيات وتأكيد الحساب</p>
            </div>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم المسؤول الكامل <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمد مصطفى"
                  className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                  required
                />
                <User className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                البريد الإلكتروني <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@elbatalexpress.com"
                  dir="ltr"
                  className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 text-left focus:outline-hidden focus:border-amber-400 transition-colors font-mono"
                  required
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                سيتم إرسال بريد التأكيد والتفعيل لهذا العنوان مباشرة فور الحفظ.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                كلمة السر <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 text-left focus:outline-hidden focus:border-amber-400 transition-colors font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-zinc-400 hover:text-zinc-200 p-0.5"
                  aria-label="إظهار أو إخفاء كلمة المرور"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                لا تقل عن 6 خانات لحماية الحساب.
              </p>
            </div>

            {/* Roles Selection (Checkboxes with Checkmarks) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-zinc-200 mb-2">
                دور وصلاحيات المسؤول (يمكن اختيار أكثر من دور): <span className="text-rose-400">*</span>
              </label>

              <div className="space-y-2.5">
                {ROLE_DEFINITIONS.map((role) => {
                  const isChecked = selectedRoles.includes(role.id);
                  return (
                    <div
                      key={role.id}
                      onClick={() => toggleRole(role.id)}
                      className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-xs'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-zinc-950 font-bold shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-zinc-600 bg-zinc-800/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isChecked ? 'text-amber-300' : 'text-zinc-200'}`}>
                            {role.label}
                          </span>
                          {isChecked && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300">
                              مفعّل ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري حفظ المسؤول وإرسال بريد التفعيل...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 -rotate-45" />
                    <span>حفظ البيانات وإضافة مسؤول</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Admins List Table / Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">المسؤولين المسجلين في Firestore (`admins`)</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 font-mono font-bold">
                {admins.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-zinc-900/60 border border-zinc-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : admins.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="لا يوجد مسؤولين مسجلين"
              description="قم بإضافة أول مسؤول للنظام باستخدام النموذج الجانبي"
            />
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => {
                const isCurrent = admin.uid === user?.uid || admin.email === user?.email;
                return (
                  <div
                    key={admin.id || admin.uid}
                    className="p-4 rounded-2xl bg-[#10131d] border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                        {admin.name?.charAt(0) || 'A'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{admin.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              أنت (الحساب الحالي)
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              admin.status === 'active' || admin.emailVerified
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {admin.status === 'active' || admin.emailVerified ? 'حساب مفعّل' : 'بانتظار تأكيد البريد'}
                          </span>
                        </div>

                        <p className="text-xs font-mono text-zinc-400" dir="ltr">
                          {admin.email}
                        </p>

                        {/* Badges for roles */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {admin.roles && admin.roles.length > 0 ? (
                            admin.roles.map((r) => {
                              const match = ROLE_DEFINITIONS.find((d) => d.id === r);
                              return (
                                <span
                                  key={r}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/90 text-amber-300 font-semibold border border-zinc-700/60"
                                >
                                  ✓ {match ? match.label : r}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                              صلاحية عامة (Admin)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                      {!isCurrent && (
                        <button
                          onClick={() => handleDelete(admin.id || admin.uid || '', admin.name)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                          title="حذف المسؤول"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
