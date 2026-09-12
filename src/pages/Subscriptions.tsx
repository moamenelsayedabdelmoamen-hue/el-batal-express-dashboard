import React, { useEffect, useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  Calendar,
  CheckCircle,
  PauseCircle,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../types';
import { SubscriptionService } from '../services/subscriptionService';
import { RestaurantService } from '../services/restaurantService';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

type PlanName = 'Basic (400)' | 'Standard (700)' | 'Premium (1000)' | 'Custom';

export const SubscriptionsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [renewingSub, setRenewingSub] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    restaurantId: '',
    restaurantName: '',
    plan: 'Basic (400)' as PlanName,
    price: 400,
    status: 'Active' as SubscriptionStatus,
  });

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const [subRes, restRes] = await Promise.all([
        SubscriptionService.getAll(),
        RestaurantService.getAll(),
      ]);
      setSubscriptions(subRes.data);
      setRestaurants(restRes.data.map((r) => ({ id: r.id, name: r.name })));
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      toastError('فشل تحميل الاشتراكات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        sub.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.plan.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchQuery, statusFilter]);

  const handlePlanChange = (plan: PlanName) => {
    let price = 400;
    if (plan === 'Standard (700)') price = 700;
    if (plan === 'Premium (1000)') price = 1000;
    if (plan === 'Custom') price = 500;
    setFormData({ ...formData, plan, price });
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurantName) {
      toastError('يرجى اختيار المطعم');
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date();
      const startDate = now.toISOString().split('T')[0];
      const endDate = new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0];

      const newSub = await SubscriptionService.create({
        restaurantId: formData.restaurantId || `rest_${Date.now()}`,
        restaurantName: formData.restaurantName,
        plan: formData.plan,
        captainsCount: formData.plan.includes('1000') ? 6 : formData.plan.includes('700') ? 4 : 2,
        price: Number(formData.price),
        startDate,
        endDate,
        status: formData.status,
      });

      setSubscriptions((prev) => [newSub, ...prev]);
      success(`تم تفعيل اشتراك باقة ${formData.plan} لمطعم "${formData.restaurantName}"`);
      setIsAddModalOpen(false);
    } catch (err) {
      toastError('فشل إنشاء الاشتراك');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!renewingSub) return;
    setActionLoading(true);
    try {
      await SubscriptionService.renew(renewingSub.id, 30);
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 30);
      const formattedEndDate = newEndDate.toISOString().split('T')[0];

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === renewingSub.id
            ? { ...s, status: 'Active', endDate: formattedEndDate }
            : s
        )
      );

      success(`تم تجديد اشتراك مطعم "${renewingSub.restaurantName}" لمدة 30 يوماً إضافية`);
      setRenewingSub(null);
    } catch (err) {
      toastError('فشل تجديد الاشتراك');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (sub: Subscription) => {
    const newStatus: SubscriptionStatus = sub.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await SubscriptionService.updateStatus(sub.id, newStatus);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
      );
      success(
        newStatus === 'Active'
          ? `تم تفعيل اشتراك مطعم "${sub.restaurantName}"`
          : `تم إيقاف اشتراك مطعم "${sub.restaurantName}" مؤقتاً`
      );
    } catch (err) {
      toastError('فشل تغيير حالة الاشتراك');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">إدارة اشتراكات المطاعم</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            الباقات الشهرية لنظام El Batal Express: 400 ج.م، 700 ج.م، 1000 ج.م وباقات مخصصة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubscriptions}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل اشتراك جديد</span>
          </button>
        </div>
      </div>

      {/* Package Plans Showcase Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#11141c] border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400">الباقة الأساسية</span>
              <span className="text-[11px] font-bold text-zinc-500">شهري</span>
            </div>
            <div className="text-2xl font-black text-white font-['Outfit',sans-serif] mb-1">
              400 <span className="text-xs font-bold text-amber-400 font-['Cairo']">ج.م</span>
            </div>
            <p className="text-xs text-zinc-400">مناسبة للمطاعم الناشئة حتى 150 طلب شهرياً مع دعم فني أساسي</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11141c] border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400">الباقة المتوسطة</span>
              <span className="text-[11px] font-bold text-zinc-500">شهري</span>
            </div>
            <div className="text-2xl font-black text-white font-['Outfit',sans-serif] mb-1">
              700 <span className="text-xs font-bold text-amber-400 font-['Cairo']">ج.م</span>
            </div>
            <p className="text-xs text-zinc-400">للمطاعم النشطة حتى 400 طلب شهرياً مع أولوية توزيع الكباتن</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161c28] to-[#10131b] border border-amber-500/30 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black text-[10px]">
            الأكثر طلباً
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400">الباقة الاحترافية</span>
              <span className="text-[11px] font-bold text-zinc-500">شهري</span>
            </div>
            <div className="text-2xl font-black text-white font-['Outfit',sans-serif] mb-1">
              1,000 <span className="text-xs font-bold text-amber-400 font-['Cairo']">ج.م</span>
            </div>
            <p className="text-xs text-zinc-300">طلبات غير محدودة مع أولوية مطلقة في الكباتن وإحصائيات متقدمة</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11141c] border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400">الباقة المخصصة</span>
              <span className="text-[11px] font-bold text-zinc-500">اتفاق خاص</span>
            </div>
            <div className="text-2xl font-black text-white font-['Outfit',sans-serif] mb-1">
              سعر مخصص
            </div>
            <p className="text-xs text-zinc-400">لسلاسل المطاعم والفروع المتعددة بحسب حجم الطلبات اليومي</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المطعم أو الباقة..."
            className="w-full bg-[#0a0c12] border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center rounded-xl bg-[#0a0c12] border border-zinc-800 p-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'all' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            الكل ({subscriptions.length})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'Active' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ساري ({subscriptions.filter((s) => s.status === 'Active').length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'Pending' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            معلق ({subscriptions.filter((s) => s.status === 'Pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('Suspended')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'Suspended' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            موقوف ({subscriptions.filter((s) => s.status === 'Suspended').length})
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-xs font-semibold">جاري جلب الاشتراكات...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="لم يتم العثور على اشتراكات"
              description="لا توجد بيانات تطابق البحث أو لم يتم تسجيل أي اشتراك بعد."
              icon={CreditCard}
              actionText="تسجيل اشتراك جديد"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/40">
                  <th className="py-4 px-4">اسم المطعم</th>
                  <th className="py-4 px-4">خطة الاشتراك</th>
                  <th className="py-4 px-4">السعر</th>
                  <th className="py-4 px-4">تاريخ البداية</th>
                  <th className="py-4 px-4">تاريخ النهاية</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-zinc-100">
                      {sub.restaurantName}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{sub.plan}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-white text-xs font-['Outfit',sans-serif]">
                      {sub.price} ج.م
                    </td>

                    <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                      {sub.startDate}
                    </td>

                    <td className="py-4 px-4 text-xs font-mono text-zinc-300 font-bold">
                      {sub.endDate}
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={sub.status} type="subscription" />
                    </td>

                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        {/* Renew button */}
                        <button
                          onClick={() => setRenewingSub(sub)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors"
                          title="تجديد الاشتراك 30 يوم"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تجديد (+30 يوم)</span>
                        </button>

                        {/* Suspend / Unsuspend button */}
                        <button
                          onClick={() => handleToggleSuspension(sub)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            sub.status === 'Active'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {sub.status === 'Active' ? (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>إيقاف مؤقت</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>تفعيل</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-4">تسجيل اشتراك شهري لمطعم</h3>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">اختر المطعم *</label>
                {restaurants.length > 0 ? (
                  <select
                    value={formData.restaurantId}
                    onChange={(e) => {
                      const selected = restaurants.find((r) => r.id === e.target.value);
                      setFormData({
                        ...formData,
                        restaurantId: e.target.value,
                        restaurantName: selected?.name || '',
                      });
                    }}
                    className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">-- اختر من قائمة المطاعم --</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="اسم المطعم"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">خطة الاشتراك</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Basic (400)', 'Standard (700)', 'Premium (1000)', 'Custom'] as PlanName[]).map(
                    (p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handlePlanChange(p)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          formData.plan === p
                            ? 'bg-amber-500 text-zinc-950 border-amber-500'
                            : 'bg-[#0a0c12] text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">سعر الاشتراك (ج.م)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">الحالة الأولية</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Active">ساري (Active)</option>
                  <option value="Pending">معلق (Pending)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الحفظ...' : 'تفعيل الاشتراك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Subscription Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(renewingSub)}
        title="تأكيد تجديد الاشتراك"
        message={`هل تريد تجديد اشتراك مطعم "${renewingSub?.restaurantName}" لمدة شهر إضافي (30 يوماً)؟ ستصبح الحالة "ساري".`}
        confirmText="تأكيد التجديد"
        cancelText="إلغاء"
        isLoading={actionLoading}
        onConfirm={handleRenewSubscription}
        onClose={() => setRenewingSub(null)}
      />
    </div>
  );
};
