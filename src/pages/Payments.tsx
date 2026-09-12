import React, { useEffect, useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Building2,
} from 'lucide-react';
import { Payment } from '../types';
import { PaymentService } from '../services/paymentService';
import { RestaurantService } from '../services/restaurantService';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const PaymentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    restaurantName: '',
    amount: 700,
    paymentMethod: 'فودافون كاش (Vodafone Cash)',
    status: 'success' as 'success' | 'pending' | 'failed',
    notes: 'تجديد اشتراك شهري',
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [payRes, restRes] = await Promise.all([
        PaymentService.getAll(),
        RestaurantService.getAll(),
      ]);
      setPayments(payRes.data);
      setRestaurants(restRes.data.map((r) => ({ id: r.id, name: r.name })));
    } catch (err) {
      console.error('Failed to load payments:', err);
      toastError('فشل تحميل سجل المعاملات المالية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const txn = (p.transactionId || p.transactionNumber || '').toLowerCase();
      const matchesSearch =
        txn.includes(searchQuery.toLowerCase()) ||
        p.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
      const matchesMethod = methodFilter === 'all' ? true : p.paymentMethod.includes(methodFilter);

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, searchQuery, statusFilter, methodFilter]);

  const totalSuccessful = useMemo(() => {
    return payments
      .filter((p) => p.status === 'success')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [payments]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurantName.trim()) {
      toastError('يرجى تحديد اسم المطعم');
      return;
    }

    setActionLoading(true);
    try {
      const newPay = await PaymentService.create({
        restaurantName: formData.restaurantName,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        date: new Date().toISOString().split('T')[0],
        notes: formData.notes,
      });

      setPayments((prev) => [newPay, ...prev]);
      success('تم تسجيل المعاملة المالية بنجاح');
      setIsAddModalOpen(false);
    } catch (err) {
      toastError('فشل تسجيل المعاملة');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">المدفوعات والمعاملات المالية</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            سجل إيرادات اشتراكات المطاعم والمدفوعات الرقمية والنقدية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل دفعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-[#11141c] border border-amber-500/20 shadow-md">
          <span className="text-xs font-bold text-amber-400 block mb-1">إجمالي المحصل (ناجحة)</span>
          <span className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif]">
            {totalSuccessful.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-amber-400 font-['Cairo']">ج.م</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-emerald-400 block mb-1">المعاملات الناجحة</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit',sans-serif]">
            {payments.filter((p) => p.status === 'success').length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-amber-400 block mb-1">قيد الانتظار</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit',sans-serif]">
            {payments.filter((p) => p.status === 'pending').length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-rose-400 block mb-1">المعاملات الفاشلة</span>
          <span className="text-xl sm:text-2xl font-black text-rose-400 font-['Outfit',sans-serif]">
            {payments.filter((p) => p.status === 'failed').length}
          </span>
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
            placeholder="البحث برقم المعاملة، المطعم، أو وسيلة الدفع..."
            className="w-full bg-[#0a0c12] border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center rounded-xl bg-[#0a0c12] border border-zinc-800 p-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'all' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكل ({payments.length})
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'success' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ناجحة
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'pending' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              قيد الانتظار
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'failed' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              فاشلة
            </button>
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-[#0a0c12] border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="فودافون كاش">فودافون كاش</option>
            <option value="محفظة">محفظة إلكترونية</option>
            <option value="تحويل بنكي">تحويل بنكي</option>
            <option value="نقدي">نقدي (كاش)</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-xs font-semibold">جاري جلب المعاملات المالية...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="لم يتم العثور على معاملات مالية"
              description="لا توجد بيانات مطابقة لمعايير البحث الحالية."
              icon={Receipt}
              actionText="تسجيل دفعة جديدة"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/40">
                  <th className="py-4 px-4">رقم المعاملة</th>
                  <th className="py-4 px-4">اسم المطعم</th>
                  <th className="py-4 px-4">المبلغ</th>
                  <th className="py-4 px-4">طريقة الدفع</th>
                  <th className="py-4 px-4">تاريخ الدفع</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-amber-400 text-xs">
                      {payment.transactionId || payment.transactionNumber}
                    </td>

                    <td className="py-4 px-4 font-bold text-zinc-100">
                      {payment.restaurantName}
                    </td>

                    <td className="py-4 px-4 font-mono font-black text-white text-xs font-['Outfit',sans-serif]">
                      {payment.amount.toLocaleString('ar-EG')} ج.م
                    </td>

                    <td className="py-4 px-4 text-xs text-zinc-300">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {payment.paymentMethod}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                      {payment.date}
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={payment.status} type="payment" />
                    </td>

                    <td className="py-4 px-4 text-left">
                      <button
                        onClick={() => setViewingPayment(payment)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors"
                        title="عرض تفاصيل الإيصال"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Payment Receipt Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingPayment(null)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">إيصال العملية المالية</h3>
                <p className="text-xs font-mono text-amber-400">{viewingPayment.transactionId || viewingPayment.transactionNumber}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3 text-xs mb-5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">المطعم:</span>
                <span className="font-bold text-zinc-200">{viewingPayment.restaurantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">المبلغ المسدد:</span>
                <span className="font-black text-white font-['Outfit',sans-serif] text-sm">
                  {viewingPayment.amount} ج.م
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">وسيلة الدفع:</span>
                <span className="text-zinc-300">{viewingPayment.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">التاريخ:</span>
                <span className="font-mono text-zinc-300">{viewingPayment.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">الحالة:</span>
                <StatusBadge status={viewingPayment.status} type="payment" />
              </div>
              {viewingPayment.notes && (
                <div className="pt-2 border-t border-zinc-800 text-zinc-400">
                  <span className="text-zinc-500 block mb-1">ملاحظات:</span>
                  <p>{viewingPayment.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewingPayment(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors"
            >
              إغلاق الإيصال
            </button>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">تسجيل دفعة مالية جديدة</h3>

            <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">اختر المطعم *</label>
                {restaurants.length > 0 ? (
                  <select
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">-- اختر من قائمة المطاعم --</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.name}>
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
                <label className="block font-bold text-zinc-300 mb-1.5">المبلغ المحصل (ج.م) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">طريقة الدفع</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="فودافون كاش (Vodafone Cash)">فودافون كاش (Vodafone Cash)</option>
                  <option value="محفظة إلكترونية (Smart Wallet)">محفظة إلكترونية (Smart Wallet)</option>
                  <option value="تحويل بنكي / InstaPay">تحويل بنكي / InstaPay</option>
                  <option value="كاش نقدي (Cash)">كاش نقدي (Cash)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">حالة الدفعة</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="success">ناجحة (Success)</option>
                  <option value="pending">قيد الانتظار (Pending)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">ملاحظات أو رقم الحوالة</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: تجديد باقة 700 ج.م لشهر أكتوبر"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
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
                  {actionLoading ? 'جاري التسجيل...' : 'تسجيل المعاملة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
