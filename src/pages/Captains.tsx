import React, { useEffect, useState, useMemo } from 'react';
import {
  Bike,
  Search,
  Plus,
  Star,
  RefreshCw,
  Phone,
  Trash2,
  Eye,
  X,
  TrendingUp,
} from 'lucide-react';
import { Captain, CaptainStatus } from '../types';
import { CaptainService } from '../services/captainService';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const CaptainsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [captains, setCaptains] = useState<Captain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'busy'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCaptain, setViewingCaptain] = useState<Captain | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add captain form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: 'دراجة نارية (موتوسيكل)',
    status: 'online' as CaptainStatus,
  });

  const fetchCaptains = async () => {
    setLoading(true);
    try {
      const res = await CaptainService.getAll();
      setCaptains(res.data);
    } catch (err) {
      console.error('Failed to load captains:', err);
      toastError('فشل تحميل بيانات الكباتن');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptains();
  }, []);

  const filteredCaptains = useMemo(() => {
    return captains.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.vehicleType && c.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [captains, searchQuery, statusFilter]);

  const handleUpdateStatus = async (captain: Captain, newStatus: CaptainStatus) => {
    try {
      await CaptainService.updateStatus(captain.id, newStatus);
      setCaptains((prev) =>
        prev.map((c) => (c.id === captain.id ? { ...c, status: newStatus } : c))
      );
      success(`تم تحديث حالة الكابتن ${captain.name} إلى ${newStatus}`);
    } catch (err) {
      toastError('فشل تحديث حالة الكابتن');
    }
  };

  const handleAddCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toastError('يرجى كتابة اسم ورقم هاتف الكابتن');
      return;
    }

    setActionLoading(true);
    try {
      const newCapt = await CaptainService.create({
        name: formData.name,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        status: formData.status,
        ordersCount: 0,
        rating: 5.0,
      });

      setCaptains((prev) => [newCapt, ...prev]);
      success('تم إضافة الكابتن الجديد بنجاح');
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        vehicleType: 'دراجة نارية (موتوسيكل)',
        status: 'online',
      });
    } catch (err) {
      toastError('فشل تسجيل الكابتن');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await CaptainService.delete(deletingId);
      setCaptains((prev) => prev.filter((c) => c.id !== deletingId));
      success('تم حذف الكابتن بنجاح');
      setDeletingId(null);
    } catch (err) {
      toastError('فشل حذف الكابتن');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">إدارة كباتن التوصيل</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            متابعة أسطول توصيل El Batal Express وحالات الاتصال ومعدلات الإنجاز
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCaptains}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كابتن جديد</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-zinc-400 block mb-1">إجمالي الكباتن</span>
          <span className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif]">
            {captains.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-emerald-400 block mb-1">المتصلون (Online)</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit',sans-serif]">
            {captains.filter((c) => c.status === 'online').length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-amber-400 block mb-1">في توصيل (Busy)</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit',sans-serif]">
            {captains.filter((c) => c.status === 'busy').length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-zinc-500 block mb-1">غير متصلين (Offline)</span>
          <span className="text-xl sm:text-2xl font-black text-zinc-400 font-['Outfit',sans-serif]">
            {captains.filter((c) => c.status === 'offline').length}
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
            placeholder="البحث بالاسم أو الهاتف أو المركبة..."
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
            الكل ({captains.length})
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'online' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            متصل ({captains.filter((c) => c.status === 'online').length})
          </button>
          <button
            onClick={() => setStatusFilter('busy')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'busy' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            في توصيل ({captains.filter((c) => c.status === 'busy').length})
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              statusFilter === 'offline' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            غير متصل ({captains.filter((c) => c.status === 'offline').length})
          </button>
        </div>
      </div>

      {/* Captains Table */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-xs font-semibold">جاري جلب الكباتن...</p>
          </div>
        ) : filteredCaptains.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="لم يتم العثور على كباتن"
              description="لا توجد نتائج تطابق معايير البحث أو التصفية الحالية."
              icon={Bike}
              actionText="إعادة ضبط البحث"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/40">
                  <th className="py-4 px-4">اسم الكابتن</th>
                  <th className="py-4 px-4">رقم الهاتف</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">المركبة</th>
                  <th className="py-4 px-4">عدد الطلبات</th>
                  <th className="py-4 px-4">التقييم</th>
                  <th className="py-4 px-4">تاريخ التسجيل</th>
                  <th className="py-4 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCaptains.map((captain) => (
                  <tr key={captain.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-zinc-100 text-sm">{captain.name}</p>
                          <span className="text-[11px] text-zinc-500 font-mono">ID: {captain.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs font-mono text-zinc-300">
                      {captain.phone}
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={captain.status} type="captain" />
                    </td>

                    <td className="py-4 px-4 text-xs text-zinc-300">
                      {captain.vehicleType || 'دراجة نارية'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-black text-white font-['Outfit',sans-serif]">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>{captain.ordersCount} طلب</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{captain.rating ? captain.rating.toFixed(1) : '5.0'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-zinc-500">
                      {captain.createdAt
                        ? new Date(captain.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>

                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={captain.status}
                          onChange={(e) => handleUpdateStatus(captain, e.target.value as CaptainStatus)}
                          className="bg-[#0a0c12] border border-zinc-800 text-[11px] font-bold text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                        >
                          <option value="online">Online (متصل)</option>
                          <option value="busy">Busy (في توصيل)</option>
                          <option value="offline">Offline (غير متصل)</option>
                        </select>

                        <button
                          onClick={() => setViewingCaptain(captain)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingId(captain.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
                          title="حذف الكابتن"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* View Captain Details Modal */}
      {viewingCaptain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingCaptain(null)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{viewingCaptain.name}</h3>
                <p className="text-xs text-zinc-400 font-mono">ID: {viewingCaptain.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">رقم الهاتف</span>
                <span className="font-bold text-zinc-200 font-mono">{viewingCaptain.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">نوع المركبة</span>
                <span className="font-bold text-zinc-200">{viewingCaptain.vehicleType || 'دراجة نارية'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">الحالة</span>
                <StatusBadge status={viewingCaptain.status} type="captain" />
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">إجمالي الطلبات</span>
                <span className="font-bold text-zinc-200">{viewingCaptain.ordersCount} طلب منجز</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Captain Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">تسجيل كابتن جديد في المنظومة</h3>

            <form onSubmit={handleAddCaptain} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">اسم الكابتن الرباعي *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد محمد مصطفى"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">رقم الهاتف المحمول *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">نوع المركبة</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="دراجة نارية (موتوسيكل)">دراجة نارية (موتوسيكل)</option>
                  <option value="سكوتر كهربائي">سكوتر كهربائي</option>
                  <option value="سيارة ميني فان">سيارة ميني فان</option>
                  <option value="دراجة هوائية">دراجة هوائية</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">الحالة الأولية</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CaptainStatus })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="online">متصل (Online)</option>
                  <option value="offline">غير متصل (Offline)</option>
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
                  {actionLoading ? 'جاري الإضافة...' : 'تسجيل الكابتن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingId)}
        title="تأكيد حذف الكابتن"
        message="هل أنت متأكد من رغبتك في حذف هذا الكابتن من النظام؟"
        confirmText="حذف نهائي"
        cancelText="تراجع"
        isDanger={true}
        isLoading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
};
