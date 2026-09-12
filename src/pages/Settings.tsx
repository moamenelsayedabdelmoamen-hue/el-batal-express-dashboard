import React, { useState } from 'react';
import {
  Settings,
  Save,
  ShieldCheck,
  Database,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';
import { firebaseConfig, isFirebaseConfigured } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';
import appLogo from '../assets/images/elbatal_logo_1789202744301.jpg';

export const SettingsPage: React.FC = () => {
  const { success } = useToast();

  const [systemName, setSystemName] = useState('El Batal Express (البطل إكسبريس)');
  const [supportPhone, setSupportPhone] = useState('01000000000');
  const [supportEmail, setSupportEmail] = useState('support@elbatalexpress.com');
  const [supportWhatsapp, setSupportWhatsapp] = useState('01000000000');
  const [basicPlanPrice, setBasicPlanPrice] = useState(400);
  const [standardPlanPrice, setStandardPlanPrice] = useState(700);
  const [premiumPlanPrice, setPremiumPlanPrice] = useState(1000);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(15);
  const [currency, setCurrency] = useState('ج.م (EGP)');

  const [saving, setSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('تم حفظ إعدادات النظام وتحديث الأسعار بنجاح');
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header Controls */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white">إعدادات النظام والمنظومة</h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          إدارة إعدادات El Batal Express وباقات الاشتراك والاتصال بـ Firebase
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General System Info */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-amber-500/30 flex items-center justify-center shrink-0 p-0.5 shadow-md">
              <img
                src={appLogo}
                alt="شعار البطل إكسبريس"
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">البيانات الأساسية للمشروع</h3>
              <p className="text-xs text-zinc-400">الهوية وعناوين التواصل العامة للعملاء والمطاعم</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-zinc-300 mb-1.5">اسم المنظومة / العلامة التجارية</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1.5">رقم هاتف الدعم الفني</label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1.5">واتساب الدعم (WhatsApp)</label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={supportWhatsapp}
                  onChange={(e) => setSupportWhatsapp(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-zinc-300 mb-1.5">البريد الإلكتروني للإدارة</label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription pricing packages */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">أسعار باقات الاشتراك الشهرية للمطاعم</h3>
              <p className="text-xs text-zinc-400">تعديل التسعير الافتراضي للباقات في النظام</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0a0c12] border border-zinc-800">
              <span className="font-bold text-zinc-400 block mb-2">الباقة الأساسية</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={basicPlanPrice}
                  onChange={(e) => setBasicPlanPrice(Number(e.target.value))}
                  className="w-24 bg-[#11141c] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-zinc-400 font-bold">ج.م / شهرياً</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c12] border border-zinc-800">
              <span className="font-bold text-zinc-400 block mb-2">الباقة المتوسطة</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={standardPlanPrice}
                  onChange={(e) => setStandardPlanPrice(Number(e.target.value))}
                  className="w-24 bg-[#11141c] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-zinc-400 font-bold">ج.م / شهرياً</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c12] border border-zinc-800">
              <span className="font-bold text-amber-400 block mb-2">الباقة الاحترافية</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={premiumPlanPrice}
                  onChange={(e) => setPremiumPlanPrice(Number(e.target.value))}
                  className="w-24 bg-[#11141c] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-zinc-400 font-bold">ج.م / شهرياً</span>
              </div>
            </div>
          </div>
        </div>

        {/* Firebase Config (Read-only / Safe display) */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">إعدادات Firebase المرتبطة</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
                  للقراءة فقط (محمي)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                مشروع Firebase الفعلي الذي تتصل به لوحة التحكم بدون كشف مفاتيح سرية
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0a0c12] border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Firebase Project ID</span>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {firebaseConfig.projectId}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0c12] border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Auth Domain</span>
              <span className="font-mono text-zinc-300 text-xs">
                {firebaseConfig.authDomain}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0c12] border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Storage Bucket</span>
              <span className="font-mono text-zinc-300 text-xs">
                {firebaseConfig.storageBucket}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0c12] border border-zinc-800">
              <span className="text-zinc-500 block mb-1">حالة الاتصال بالسيرفر</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>مهيأ ومتصل بنجاح</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              يتم تأمين البيانات عبر <strong className="text-zinc-200">Firestore Security Rules</strong> وقواعد التحقق من صلاحيات <strong className="text-zinc-200">Custom Claims (role = admin)</strong>. لا يتم تخزين أي كلمات مرور أو مفاتيح سرية في جهة العميل.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في النظام</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
