import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Phone,
  Calendar,
  Eye,
  X,
  RefreshCw,
  Building2,
  Compass,
  Navigation,
} from 'lucide-react';
import { Restaurant, SubscriptionStatus, Order } from '../types';
import { RestaurantService } from '../services/restaurantService';
import { OrderService } from '../services/orderService';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { ExportButton } from '../components/common/ExportButton';
import { exportRestaurants } from '../utils/exportUtils';

export const RestaurantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');

  // Modals state
  const [viewingRestaurant, setViewingRestaurant] = useState<Restaurant | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    phone: '',
    address: '',
    rating: 5.0,
    subscriptionStatus: 'Active' as SubscriptionStatus,
    isActive: true,
  });

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const [resRestaurants, resOrders] = await Promise.all([
        RestaurantService.getAll(),
        OrderService.getAll(),
      ]);
      setRestaurants(resRestaurants.data);
      setOrders(resOrders.data);
    } catch (err) {
      console.error('Failed to load restaurants or orders:', err);
      toastError('حدث خطأ أثناء تحميل المطاعم والطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Map to count total real orders in the database for each restaurant
  const restaurantOrdersCount = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.restaurantName) {
        const nameKey = o.restaurantName.trim().toLowerCase();
        counts[nameKey] = (counts[nameKey] || 0) + 1;
        counts[o.restaurantName] = (counts[o.restaurantName] || 0) + 1;
      }
      if (o.restaurantId) {
        counts[o.restaurantId] = (counts[o.restaurantId] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.phone && r.phone.includes(searchQuery));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? r.isActive
          : !r.isActive;

      const matchesSub =
        subscriptionFilter === 'all'
          ? true
          : r.subscriptionStatus === subscriptionFilter;

      return matchesSearch && matchesStatus && matchesSub;
    });
  }, [restaurants, searchQuery, statusFilter, subscriptionFilter]);

  const handleToggleStatus = async (restaurant: Restaurant) => {
    try {
      const newStatus = await RestaurantService.toggleActive(restaurant.id, restaurant.isActive);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurant.id ? { ...r, isActive: newStatus } : r))
      );
      success(newStatus ? `تم تفعيل مطعم "${restaurant.name}"` : `تم إيقاف مطعم "${restaurant.name}"`);
    } catch (err) {
      toastError('فشل تغيير حالة المطعم');
    }
  };

  const handleOpenEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      category: restaurant.category || '',
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      rating: restaurant.rating || 5.0,
      subscriptionStatus: restaurant.subscriptionStatus || 'Active',
      isActive: restaurant.isActive,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;

    setActionLoading(true);
    try {
      await RestaurantService.update(editingRestaurant.id, {
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        subscriptionStatus: formData.subscriptionStatus,
      });

      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === editingRestaurant.id
            ? { ...r, ...formData }
            : r
        )
      );

      success('تم تحديث بيانات المطعم بنجاح');
      setEditingRestaurant(null);
    } catch (err) {
      toastError('فشل حفظ تعديلات المطعم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError('يرجى إدخال اسم المطعم');
      return;
    }

    setActionLoading(true);
    try {
      const newRest = await RestaurantService.create({
        name: formData.name,
        category: formData.category || 'عام',
        phone: formData.phone || '',
        address: formData.address || '',
        rating: 5.0,
        subscriptionStatus: formData.subscriptionStatus,
        isActive: formData.isActive,
      });

      setRestaurants((prev) => [newRest, ...prev]);
      success('تم تسجيل المطعم الجديد بنجاح');
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: '',
        phone: '',
        address: '',
        rating: 5.0,
        subscriptionStatus: 'Active',
        isActive: true,
      });
    } catch (err) {
      toastError('فشل إضافة المطعم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await RestaurantService.delete(deletingId);
      setRestaurants((prev) => prev.filter((r) => r.id !== deletingId));
      success('تم حذف المطعم بنجاح');
      setDeletingId(null);
    } catch (err) {
      toastError('فشل حذف المطعم');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">إدارة المطاعم المسجلة</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            متابعة شركاء El Batal Express وتعديل بياناتهم وتفعيل الخدمات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton
            onExportExcel={() => exportRestaurants(filteredRestaurants, 'xlsx')}
            onExportCsv={() => exportRestaurants(filteredRestaurants, 'csv')}
            label="تصدير المطاعم"
            count={filteredRestaurants.length}
          />

          <button
            onClick={fetchRestaurants}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                category: '',
                phone: '',
                address: '',
                rating: 5.0,
                subscriptionStatus: 'Active',
                isActive: true,
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مطعم جديد</span>
          </button>
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
            placeholder="البحث بالاسم أو التصنيف أو الهاتف..."
            className="w-full bg-[#0a0c12] border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-[#0a0c12] border border-zinc-800 p-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'all' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكل ({restaurants.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'active' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              نشط ({restaurants.filter((r) => r.isActive).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'inactive' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              موقوف ({restaurants.filter((r) => !r.isActive).length})
            </button>
          </div>

          {/* Subscription filter */}
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="bg-[#0a0c12] border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الاشتراكات</option>
            <option value="Active">ساري (Active)</option>
            <option value="Pending">معلق (Pending)</option>
            <option value="Expired">منتهي (Expired)</option>
            <option value="Suspended">موقوف (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-xs font-semibold">جاري جلب المطاعم من Firestore...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="لم يتم العثور على مطاعم"
              description="لا توجد نتائج تطابق معايير البحث أو التصفية الحالية."
              icon={UtensilsCrossed}
              actionText="إعادة ضبط البحث"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSubscriptionFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/40">
                  <th className="py-4 px-4">اسم المطعم</th>
                  <th className="py-4 px-4">التصنيف</th>
                  <th className="py-4 px-4">رقم الهاتف</th>
                  <th className="py-4 px-4">الطلبات</th>
                  <th className="py-4 px-4">حالة الاشتراك</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">تاريخ التسجيل</th>
                  <th className="py-4 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredRestaurants.map((restaurant) => {
                  const ordersCount =
                    restaurantOrdersCount[restaurant.name] ??
                    restaurantOrdersCount[restaurant.name.trim().toLowerCase()] ??
                    restaurantOrdersCount[restaurant.id] ??
                    0;

                  return (
                    <tr key={restaurant.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {restaurant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-zinc-100 text-sm">{restaurant.name}</p>
                            {restaurant.address && (
                              <p className="text-xs text-zinc-500 truncate max-w-xs">{restaurant.address}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-zinc-300">
                        {restaurant.category || 'عام'}
                      </td>

                      <td className="py-4 px-4 text-xs font-mono text-zinc-300">
                        {restaurant.phone || '—'}
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => navigate(`/orders?restaurant=${encodeURIComponent(restaurant.name)}`)}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-xs"
                          title={`عرض جميع طلبات مطعم ${restaurant.name}`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>{ordersCount} طلب</span>
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={restaurant.subscriptionStatus || 'Active'} type="subscription" />
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={restaurant.isActive} type="restaurant" />
                      </td>

                    <td className="py-4 px-4 text-xs text-zinc-500">
                      {restaurant.createdAt
                        ? new Date(restaurant.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>

                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingRestaurant(restaurant)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(restaurant)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            restaurant.isActive
                              ? 'text-rose-400 hover:bg-rose-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={restaurant.isActive ? 'إيقاف المطعم' : 'تفعيل المطعم'}
                        >
                          {restaurant.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(restaurant)}
                          className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
                          title="تعديل البيانات"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingId(restaurant.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition-colors"
                          title="حذف المطعم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingRestaurant(null)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{viewingRestaurant.name}</h3>
                <p className="text-xs text-zinc-400">معرف المطعم: {viewingRestaurant.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">التصنيف</span>
                <span className="font-bold text-zinc-200">{viewingRestaurant.category || 'عام'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">رقم الهاتف</span>
                <span className="font-bold text-zinc-200 font-mono">{viewingRestaurant.phone || '—'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">الحالة</span>
                <StatusBadge status={viewingRestaurant.isActive} type="restaurant" />
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">حالة الاشتراك</span>
                <StatusBadge status={viewingRestaurant.subscriptionStatus || 'Active'} type="subscription" />
              </div>
              <div className="col-span-2 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">العنوان والموقع</span>
                <span className="font-bold text-zinc-200">{viewingRestaurant.address || 'غير محدد'}</span>
              </div>
            </div>

            {/* Orders Section in Modal */}
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">إجمالي طلبات المطعم</span>
                  <span className="text-sm font-black text-amber-400 font-['Outfit',sans-serif]">
                    {(restaurantOrdersCount[viewingRestaurant.name] ??
                      restaurantOrdersCount[viewingRestaurant.name.trim().toLowerCase()] ??
                      restaurantOrdersCount[viewingRestaurant.id] ??
                      0)}{' '}
                    طلب مسجل في قاعدة البيانات
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate(`/orders?restaurant=${encodeURIComponent(viewingRestaurant.name)}`);
                  setViewingRestaurant(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <span>عرض كافة الطلبات</span>
              </button>
            </div>

            {/* Live Map navigation */}
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">الخريطة المباشرة وتحديد الكباتن</span>
                  <span className="text-xs font-bold text-emerald-300">
                    تتبع موقع المطعم والبحث عن أقرب كابتن متاح
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/live-map');
                  setViewingRestaurant(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Navigation className="w-4 h-4" />
                <span>فتح على الخريطة</span>
              </button>
            </div>

            {/* Raw data inspection to ensure zero data loss with existing schema */}
            {viewingRestaurant.raw && Object.keys(viewingRestaurant.raw).length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <details className="text-[11px] text-zinc-400">
                  <summary className="cursor-pointer font-bold text-amber-400 hover:underline">
                    عرض الحقول الكاملة المخزنة في Firestore (Schema Inspector)
                  </summary>
                  <pre className="mt-2 p-3 rounded-xl bg-[#090b10] border border-zinc-800 text-[10px] text-zinc-300 overflow-x-auto font-mono">
                    {JSON.stringify(viewingRestaurant.raw, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingRestaurant(null)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">تعديل بيانات المطعم</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">اسم المطعم</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">التصنيف / نوع الطعام</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="مثال: مأكولات شرقية، برجر، بيتزا"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">حالة الاشتراك</label>
                <select
                  value={formData.subscriptionStatus}
                  onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value as SubscriptionStatus })}
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Active">ساري (Active)</option>
                  <option value="Pending">معلق (Pending)</option>
                  <option value="Expired">منتهي (Expired)</option>
                  <option value="Suspended">موقوف (Suspended)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setEditingRestaurant(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Restaurant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">تسجيل مطعم جديد في المنظومة</h3>

            <form onSubmit={handleAddRestaurant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">اسم المطعم *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مطعم النجم الذهبي"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">التصنيف</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="وجبات سريعة، مشويات، أسماك..."
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  className="w-full bg-[#0a0c12] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="المدينة، الشارع، علامة مميزة"
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
                  {actionLoading ? 'جاري الإضافة...' : 'تسجيل المطعم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingId)}
        title="تأكيد حذف المطعم"
        message="هل أنت متأكد من رغبتك في حذف هذا المطعم من النظام؟ لا يمكن التراجع عن هذه الخطوة."
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
