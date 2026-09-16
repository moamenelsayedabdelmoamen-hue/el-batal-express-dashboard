import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
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
  Calendar,
  CalendarDays,
  History,
  RotateCcw,
  UserCheck,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Order, OrderStatus, Captain } from '../types';
import { OrderService } from '../services/orderService';
import { CaptainService } from '../services/captainService';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { SendOrderModal } from '../components/orders/SendOrderModal';
import { ExportButton } from '../components/common/ExportButton';
import { exportOrders } from '../utils/exportUtils';

const ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Accepted',
  'Preparing',
  'Ready',
  'Picked Up',
  'Delivered',
  'Cancelled',
];

// Helper to extract YYYY-MM-DD from any date format in Firestore (using local/Egypt date)
function parseOrderDateString(createdAt: any): string {
  if (!createdAt) return '';
  try {
    // If it's already in YYYY-MM-DD format (like "2026-09-15" or "2026-09-15T...")
    if (typeof createdAt === 'string') {
      const match = createdAt.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
      // Or if format is DD/MM/YYYY
      const slashMatch = createdAt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (slashMatch) {
        const d = slashMatch[1].padStart(2, '0');
        const m = slashMatch[2].padStart(2, '0');
        const y = slashMatch[3];
        return `${y}-${m}-${d}`;
      }
    }

    let d: Date;
    if (typeof createdAt === 'object' && typeof createdAt.toDate === 'function') {
      d = createdAt.toDate();
    } else if (typeof createdAt === 'number') {
      const ms = createdAt < 10000000000 ? createdAt * 1000 : createdAt;
      d = new Date(ms);
    } else if (typeof createdAt === 'string') {
      d = new Date(createdAt);
    } else if (createdAt instanceof Date) {
      d = createdAt;
    } else {
      return '';
    }
    if (isNaN(d.getTime())) return '';

    // Extract using local timezone
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return '';
  }
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const restaurantParam = searchParams.get('restaurant') || restaurantId || '';

  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(restaurantParam || 'all');

  // Date Filter Modes: 'today' | 'history' | 'all'
  // When a specific restaurant is opened, default to 'all' to show all registered orders for that restaurant
  const [dateMode, setDateMode] = useState<'today' | 'history' | 'all'>(
    restaurantParam ? 'all' : 'today'
  );
  const [historyDate, setHistoryDate] = useState<string>(getTodayString());

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const todayStr = useMemo(() => getTodayString(), []);

  // Sync state if URL search param changes
  useEffect(() => {
    if (restaurantParam) {
      setSelectedRestaurant(restaurantParam);
      setDateMode('all');
    }
  }, [restaurantParam]);

  // Resolve display name for the restaurant if restaurantParam is an ID
  useEffect(() => {
    if (restaurantParam && orders.length > 0) {
      const match = orders.find(
        (o) =>
          (o.restaurantId && o.restaurantId.toLowerCase() === restaurantParam.toLowerCase()) ||
          (o.restaurantName && o.restaurantName.toLowerCase() === restaurantParam.toLowerCase())
      );
      if (match && match.restaurantName) {
        setSelectedRestaurant(match.restaurantName);
      }
    }
  }, [restaurantParam, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [resOrders, resCaptains] = await Promise.all([
        OrderService.getAll(),
        CaptainService.getAll(),
      ]);
      setOrders(resOrders.data);
      setCaptains(resCaptains.data);
    } catch (err) {
      console.error('Failed to load orders or captains:', err);
      toastError('فشل تحميل بيانات الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Orders scoped by date and restaurant
  const dateScopedOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Restaurant filter if selected
      if (selectedRestaurant !== 'all') {
        const oName = (o.restaurantName || '').trim().toLowerCase();
        const oId = (o.restaurantId || '').trim().toLowerCase();
        const sel = selectedRestaurant.trim().toLowerCase();
        const matches = oName === sel || oId === sel;
        if (!matches) return false;
      }

      // 2. Date scoping
      const orderDateStr = parseOrderDateString(o.createdAt);
      if (dateMode === 'today') {
        return orderDateStr === todayStr;
      } else if (dateMode === 'history') {
        return historyDate ? orderDateStr === historyDate : true;
      }
      return true; // 'all' mode
    });
  }, [orders, dateMode, historyDate, todayStr, selectedRestaurant]);

  // Metrics specifically for the selected view
  const metrics = useMemo(() => {
    const total = dateScopedOrders.length;
    const inProgress = dateScopedOrders.filter((o) =>
      ['New', 'Accepted', 'Preparing', 'Ready', 'Picked Up'].includes(o.status)
    ).length;
    const delivered = dateScopedOrders.filter((o) => o.status === 'Delivered').length;
    const cancelled = dateScopedOrders.filter((o) => o.status === 'Cancelled').length;
    return { total, inProgress, delivered, cancelled };
  }, [dateScopedOrders]);

  // Total Today Orders Count in database
  const todayOrdersTotalCount = useMemo(() => {
    return orders.filter((o) => {
      if (selectedRestaurant !== 'all') {
        const oName = (o.restaurantName || '').trim().toLowerCase();
        const oId = (o.restaurantId || '').trim().toLowerCase();
        const sel = selectedRestaurant.trim().toLowerCase();
        if (oName !== sel && oId !== sel) return false;
      }
      return parseOrderDateString(o.createdAt) === todayStr;
    }).length;
  }, [orders, todayStr, selectedRestaurant]);

  // Unique restaurants list for filtering across all orders in database
  const uniqueRestaurants = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => {
      if (o.restaurantName) {
        const name = o.restaurantName.trim();
        map.set(name, name);
      }
    });
    return Array.from(map.values()).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return dateScopedOrders.filter((o) => {
      // 1. Search query filter (Order number, Restaurant, Captain, Customer, Address)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.restaurantName && o.restaurantName.toLowerCase().includes(q)) ||
        (o.captainName && o.captainName.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q));

      // 2. Status filter
      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dateScopedOrders, searchQuery, statusFilter]);

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

  const handleAssignCaptain = async (orderId: string, captainId: string) => {
    if (!captainId) return;
    const captain = captains.find((c) => c.id === captainId);
    const captainName = captain?.name || 'كابتن معتمد';
    try {
      await OrderService.assignCaptain(orderId, captainId, captainName);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                captainId,
                captainName,
                status: o.status === 'New' ? 'Accepted' : o.status,
              }
            : o
        )
      );
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({
          ...viewingOrder,
          captainId,
          captainName,
          status: viewingOrder.status === 'New' ? 'Accepted' : viewingOrder.status,
        });
      }
      success(`تم تعيين الكابتن "${captainName}" للطلب بنجاح!`);
    } catch (err) {
      toastError('فشل تعيين الكابتن للطلب في قاعدة البيانات');
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
          <ExportButton
            onExportExcel={() => exportOrders(filteredOrders, 'xlsx')}
            onExportCsv={() => exportOrders(filteredOrders, 'csv')}
            label="تصدير الطلبات"
            count={filteredOrders.length}
          />

          <button
            onClick={() => navigate('/sheets')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            title="صفحة جداول البيانات والتصدير الشامل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">جداول البيانات</span>
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 -rotate-45 text-zinc-400" />
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

      {/* Restaurant Focus Banner when a restaurant is selected */}
      {selectedRestaurant !== 'all' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-[#161a25] to-[#11141c] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-amber-400/80">عرض طلبات المطعم:</span>
                <h2 className="text-lg sm:text-xl font-black text-white">{selectedRestaurant}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  {filteredOrders.length} طلب مسجل
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                عرض كافة الطلبات المسجلة في قاعدة البيانات لمطعم {selectedRestaurant}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/restaurants')}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لإدارة المطاعم</span>
            </button>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedRestaurant('all');
                setDateMode('today');
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <span>عرض كافة المطاعم</span>
            </button>
          </div>
        </div>
      )}

      {/* Date Filter Selection: Today's Orders vs Orders History */}
      <div className="bg-gradient-to-r from-[#121624] via-[#10131d] to-[#0c0f17] border border-zinc-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateMode('today')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                dateMode === 'today'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>طلبات اليوم</span>
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-extrabold ${
                  dateMode === 'today' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {todayOrdersTotalCount}
              </span>
            </button>

            <button
              onClick={() => setDateMode('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                dateMode === 'history'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>سجل الطلبات باليوم</span>
            </button>

            <button
              onClick={() => setDateMode('all')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateMode === 'all'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
              }`}
            >
              <span>كافة الطلبات ({orders.length})</span>
            </button>
          </div>

          {/* Date Picker Input when History mode is selected */}
          {dateMode === 'history' && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-4 h-4" />
                <span>اختر اليوم:</span>
              </label>
              <input
                type="date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="bg-zinc-900 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setHistoryDate(todayStr)}
                className="text-[11px] px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="الرجوع لتاريخ اليوم"
              >
                اليوم
              </button>
            </div>
          )}
        </div>

        {/* Date Filter Status Description */}
        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/60">
          {dateMode === 'today' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                إحصائيات وطلبات اليوم الحالي ({todayStr}) من قاعدة البيانات • إجمالي طلبات اليوم:{' '}
                <strong className="text-amber-400 font-bold">{metrics.total}</strong>
              </span>
            </>
          )}
          {dateMode === 'history' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>
                {historyDate ? (
                  <>
                    إحصائيات وطلبات اليوم المختار (<strong className="text-white font-mono">{historyDate}</strong>) من قاعدة البيانات • إجمالي الطلبات:{' '}
                    <strong className="text-amber-400 font-bold">{metrics.total}</strong>
                  </>
                ) : (
                  <span>اختر تاريخاً لعرض إحصائيات وطلبات ذلك اليوم الحقيقية</span>
                )}
              </span>
            </>
          )}
          {dateMode === 'all' && (
            <>
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>
                عرض كافة الطلبات التاريخية من قاعدة البيانات • إجمالي الطلبات:{' '}
                <strong className="text-white font-bold">{metrics.total}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Orders Quick Metrics for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-zinc-400 block mb-1">
            إجمالي الطلبات{' '}
            {selectedRestaurant !== 'all'
              ? `(مطعم ${selectedRestaurant})`
              : dateMode === 'today'
              ? '(اليوم)'
              : dateMode === 'history'
              ? '(اليوم المختار)'
              : '(الكل)'}
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif]">
            {metrics.total}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-amber-400 block mb-1">
            قيد المعالجة والتوصيل
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit',sans-serif]">
            {metrics.inProgress}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-emerald-400 block mb-1">
            المكتملة (Delivered)
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit',sans-serif]">
            {metrics.delivered}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#11141c] border border-zinc-800/80">
          <span className="text-xs font-bold text-rose-400 block mb-1">
            الملغاة (Cancelled)
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-400 font-['Outfit',sans-serif]">
            {metrics.cancelled}
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
              placeholder="البحث برقم الطلب، المطعم، أو الكابتن..."
              className="w-full bg-[#0a0c12] border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRestaurant}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedRestaurant(val);
                if (val !== 'all') {
                  setSearchParams({ restaurant: val });
                  setDateMode('all');
                } else {
                  setSearchParams({});
                }
              }}
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
            الكل ({dateScopedOrders.length})
          </button>
          {ORDER_STATUSES.map((st) => {
            const count = dateScopedOrders.filter((o) => o.status === st).length;
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
              title={
                selectedRestaurant !== 'all' && dateScopedOrders.length === 0
                  ? `لا توجد أي طلبات مسجلة لمطعم "${selectedRestaurant}" ${
                      dateMode === 'today'
                        ? 'اليوم'
                        : dateMode === 'history'
                        ? `في تاريخ (${historyDate})`
                        : 'في قاعدة البيانات'
                    }`
                  : dateScopedOrders.length === 0
                  ? `لا توجد أي طلبات مسجلة في ${
                      dateMode === 'today' ? 'هذا اليوم' : `تاريخ (${historyDate || 'المحدد'})`
                    }`
                  : 'لم يتم العثور على طلبات تطابق الفلتر'
              }
              description={
                selectedRestaurant !== 'all' && dateScopedOrders.length === 0
                  ? `لم يتم تسجيل طلبات لمطعم "${selectedRestaurant}" ${
                      dateMode === 'all'
                        ? 'في قاعدة البيانات حتى الآن.'
                        : 'في هذا التاريخ المحدد. يمكنك الضغط على زر "كافة الطلبات" بالأعلى أو عرض كل المطاعم.'
                    }`
                  : dateScopedOrders.length === 0
                  ? 'لم يتم تسجيل أي طلبات في قاعدة البيانات لهذا اليوم بعد (تظهر الأرقام والإحصائيات 0).'
                  : 'لا توجد نتائج تطابق معايير البحث أو تصفية الحالة المختارة.'
              }
              icon={ShoppingBag}
              actionText={
                selectedRestaurant !== 'all'
                  ? 'عرض طلبات كل المطاعم'
                  : dateScopedOrders.length === 0 && dateMode !== 'today'
                  ? 'عرض طلبات اليوم'
                  : 'إعادة ضبط الفلاتر'
              }
              onAction={() => {
                if (selectedRestaurant !== 'all') {
                  setSearchParams({});
                  setSelectedRestaurant('all');
                  setDateMode('today');
                } else if (dateScopedOrders.length === 0 && dateMode !== 'today') {
                  setDateMode('today');
                }
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
                  <th className="py-4 px-4">رقم الطلب</th>
                  <th className="py-4 px-4">المطعم</th>
                  <th className="py-4 px-4">الكابتن</th>
                  <th className="py-4 px-4">رسوم التوصيل</th>
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
                      {order.captainName ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Bike className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-zinc-200 truncate">{order.captainName}</span>
                          </div>
                          <select
                            defaultValue=""
                            onChange={(e) => handleAssignCaptain(order.id, e.target.value)}
                            className="bg-zinc-900 border border-zinc-700/80 text-[10px] text-zinc-400 hover:text-amber-400 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                            title="تغيير الكابتن"
                          >
                            <option value="" disabled>تغيير</option>
                            {captains.map((c) => (
                              <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <select
                            defaultValue=""
                            onChange={(e) => handleAssignCaptain(order.id, e.target.value)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer transition-all"
                          >
                            <option value="" disabled className="bg-zinc-900 text-zinc-400">
                              + تعيين كابتن
                            </option>
                            {captains.map((c) => (
                              <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                                {c.name} {c.vehicleType ? `(${c.vehicleType})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-xs text-amber-400">
                      {order.deliveryFee} ج.م
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
                          className="bg-[#0a0c12] border border-zinc-800 text-[11px] font-bold text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
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

            {/* Restaurant & Captain Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">المطعم</span>
                <span className="font-bold text-zinc-200">{viewingOrder.restaurantName}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">كابتن التوصيل</span>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="font-bold text-zinc-200 truncate">
                    {viewingOrder.captainName || 'لم يتم تعيين كابتن'}
                  </span>
                  <select
                    value={viewingOrder.captainId || ''}
                    onChange={(e) => handleAssignCaptain(viewingOrder.id, e.target.value)}
                    className="bg-zinc-950 border border-amber-500/50 text-[11px] text-amber-400 font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="" disabled>
                      {viewingOrder.captainName ? 'تغيير الكابتن' : 'تعيين كابتن'}
                    </option>
                    {captains.map((c) => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {viewingOrder.deliveryAddress && (
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 sm:col-span-2">
                  <span className="text-zinc-500 block mb-1">عنوان التوصيل</span>
                  <span className="font-bold text-zinc-200">{viewingOrder.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* Delivery Fee Card */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs mb-5">
              <span className="text-zinc-300 font-bold">رسوم التوصيل (المحددة من المطعم):</span>
              <span className="font-mono text-amber-400 font-black text-base">{viewingOrder.deliveryFee} ج.م</span>
            </div>

            {/* Items Receipt (if any) */}
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
