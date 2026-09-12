import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  X,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  Bike,
  Send,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { OrderService } from '../services/orderService';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { SendOrderModal } from '../components/orders/SendOrderModal';

const ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Accepted',
  'Preparing',
  'Ready',
  'Picked Up',
  'Delivered',
  'Cancelled',
];

export const OrdersPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await OrderService.getAll();
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toastError('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Unique restaurants list for filtering
  const uniqueRestaurants = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => {
      if (o.restaurantName) {
        map.set(o.restaurantName, o.restaurantName);
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.captainName && o.captainName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.customerPhone && o.customerPhone.includes(searchQuery));

      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      const matchesRestaurant = selectedRestaurant === 'all' ? true : o.restaurantName === selectedRestaurant;

      return matchesSearch && matchesStatus && matchesRestaurant;
    });
  }, [orders, searchQuery, statusFilter, selectedRestaurant]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await OrderService.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({ ...viewingOrder, status: newStatus });
      }
      success(`تم تحديث حالة الطلب إلى "${newStatus}"`);
    } catch (err) {
      toastError('فشل تحديث حالة الطلب');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">إدارة حركة وتدفق الطلبات</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            متابعة مراحل الطلب السبعة: جديد، مقبول، قيد التحضير، جاهز، تم الاستلام، تم التوصيل، ملغي
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 -rotate-45" />
            <span>إرسال طلب لكابتن</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="تحديث الطلبات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-zinc-400 block mb-1">إجمالي الطلبات</span>
          <span className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif]">
            {orders.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-amber-400 block mb-1">قيد المعالجة والتوصيل</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit',sans-serif]">
            {orders.filter((o) => ['New', 'Accepted', 'Preparing', 'Ready', 'Picked Up'].includes(o.status)).length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-emerald-400 block mb-1">المكتملة (Delivered)</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit',sans-serif]">
            {orders.filter((o) => o.status === 'Delivered').length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-rose-400 block mb-1">الملغاة (Cancelled)</span>
          <span className="text-xl sm:text-2xl font-black text-rose-400 font-['Outfit',sans-serif]">
            {orders.filter((o) => o.status === 'Cancelled').length}
          </span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث برقم الطلب، المطعم، العميل، الهاتف أو الكابتن..."
              className="w-full bg-[#0a0c12] border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="bg-[#0a0c12] border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">كل المطاعم</option>
              {uniqueRestaurants.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7 lifecycle status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-[#0a0c12] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            الكل ({orders.length})
          </button>
          {ORDER_STATUSES.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-[#0a0c12] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 text-xs font-semibold">جاري جلب الطلبات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="لم يتم العثور على طلبات"
              description="لا توجد نتائج تطابق معايير البحث أو التصفية المختارة."
              icon={ShoppingBag}
              actionText="إعادة ضبط الفلاتر"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSelectedRestaurant('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/40">
                  <th className="py-4 px-4">رقم الطلب</th>
                  <th className="py-4 px-4">المطعم</th>
                  <th className="py-4 px-4">العميل</th>
                  <th className="py-4 px-4">الكابتن</th>
                  <th className="py-4 px-4">قيمة الطلب</th>
                  <th className="py-4 px-4">رسوم التوصيل</th>
                  <th className="py-4 px-4">الإجمالي</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">الوقت</th>
                  <th className="py-4 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-amber-400 text-xs">
                      {order.orderNumber}
                    </td>

                    <td className="py-4 px-4 font-bold text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{order.restaurantName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-zinc-300">
                      <div>{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="text-[11px] font-mono text-zinc-500">{order.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-blue-400" />
                        <span>{order.captainName || 'لم يُعيّن'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-zinc-300">
                      {order.subtotal} ج.م
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-zinc-400">
                      {order.deliveryFee} ج.م
                    </td>

                    <td className="py-4 px-4 font-black text-white font-['Outfit',sans-serif] text-xs">
                      {order.total} ج.م
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={order.status} type="order" />
                    </td>

                    <td className="py-4 px-4 text-xs text-zinc-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className="bg-[#0a0c12] border border-zinc-800 text-[11px] font-bold text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors"
                          title="عرض تفاصيل الطلب"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#11141c] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingOrder(null)}
              className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{viewingOrder.orderNumber}</h3>
                  <StatusBadge status={viewingOrder.status} type="order" />
                </div>
                <p className="text-xs text-zinc-400">توقيت الإنشاء: {viewingOrder.createdAt}</p>
              </div>
            </div>

            {/* Restaurant & Customer Info */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">المطعم</span>
                <span className="font-bold text-zinc-200">{viewingOrder.restaurantName}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">كابتن التوصيل</span>
                <span className="font-bold text-zinc-200">{viewingOrder.captainName || 'غير معين'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">العميل</span>
                <span className="font-bold text-zinc-200">{viewingOrder.customerName}</span>
                {viewingOrder.customerPhone && (
                  <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">{viewingOrder.customerPhone}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">عنوان التوصيل</span>
                <span className="font-bold text-zinc-200">{viewingOrder.deliveryAddress || 'غير محدد'}</span>
              </div>
            </div>

            {/* Items Receipt */}
            {viewingOrder.items && viewingOrder.items.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-zinc-400 mb-2">عناصر الطلب</h4>
                <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3 space-y-2 text-xs">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-300">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono">{item.price * item.quantity} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total breakdown */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs mb-5">
              <div className="flex items-center justify-between text-zinc-400">
                <span>قيمة المأكولات (Subtotal):</span>
                <span className="font-mono text-zinc-300">{viewingOrder.subtotal} ج.م</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>رسوم التوصيل (Delivery Fee):</span>
                <span className="font-mono text-zinc-300">{viewingOrder.deliveryFee} ج.م</span>
              </div>
              <div className="flex items-center justify-between text-white font-extrabold text-sm pt-2 border-t border-zinc-800">
                <span>المبلغ الإجمالي:</span>
                <span className="font-mono text-amber-400 text-base">{viewingOrder.total} ج.م</span>
              </div>
            </div>

            {/* Status changer in modal */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <label className="text-xs font-bold text-zinc-400">تغيير حالة الطلب:</label>
              <select
                value={viewingOrder.status}
                onChange={(e) => handleUpdateStatus(viewingOrder.id, e.target.value as OrderStatus)}
                className="bg-[#0a0c12] border border-zinc-700 text-xs font-bold text-amber-400 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Send Order to Captain Modal */}
      <SendOrderModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onOrderCreated={fetchOrders}
      />
    </div>
  );
};
