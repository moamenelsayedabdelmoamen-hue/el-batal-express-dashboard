import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  ArrowUpLeft,
  RefreshCw,
  TrendingUp,
  Activity,
  Send,
} from 'lucide-react';
import { DashboardStats, Order } from '../types';
import { DashboardService, EMPTY_STATS } from '../services/dashboardService';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { MetricsSummary } from '../components/dashboard/MetricsSummary';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await DashboardService.getDashboardData();
      setStats(res.stats);
      setRecentOrders(res.recentOrders);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900/60 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المطاعم',
      value: stats?.totalRestaurants ?? 0,
      icon: UtensilsCrossed,
      link: '/restaurants',
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-400',
      badge: `${stats?.activeRestaurants ?? 0} نشط`,
    },
    {
      title: 'المطاعم النشطة',
      value: stats?.activeRestaurants ?? 0,
      icon: Activity,
      link: '/restaurants',
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-400',
      badge: 'متصلة الآن',
    },
    {
      title: 'إجمالي الكباتن',
      value: stats?.totalCaptains ?? 0,
      icon: Bike,
      link: '/captains',
      color: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-400',
      badge: `${stats?.activeCaptains ?? 0} متصل`,
    },
    {
      title: 'الكباتن النشطون',
      value: stats?.activeCaptains ?? 0,
      icon: TrendingUp,
      link: '/captains',
      color: 'from-cyan-500/20 to-cyan-600/5',
      iconColor: 'text-cyan-400',
      badge: 'جاهزون للاستلام',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      link: '/orders',
      color: 'from-purple-500/20 to-purple-600/5',
      iconColor: 'text-purple-400',
      badge: 'كل الأوقات',
    },
    {
      title: 'طلبات اليوم',
      value: stats?.todayOrders ?? 0,
      icon: Clock,
      link: '/orders',
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-400',
      badge: 'اليوم',
    },
    {
      title: 'الطلبات المكتملة',
      value: stats?.completedOrders ?? 0,
      icon: CheckCircle2,
      link: '/orders',
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-400',
      badge: 'تم التوصيل',
    },
    {
      title: 'الطلبات الملغاة',
      value: stats?.cancelledOrders ?? 0,
      icon: XCircle,
      link: '/orders',
      color: 'from-rose-500/20 to-rose-600/5',
      iconColor: 'text-rose-400',
      badge: 'ملغاة',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141824] to-[#12141c] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              نظام التشغيل مباشر
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            مرحباً بك في لوحة تحكم El Batal Express
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            نظرة شاملة ولحظية على عمليات المطاعم، أسطول الكباتن وحركة الطلبات اليومية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/send-order"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 -rotate-45" />
            <span>إرسال طلب لكابتن</span>
          </Link>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Component: displays daily order volume, total active captains, and monthly revenue */}
      <MetricsSummary stats={stats || EMPTY_STATS} />

      {/* Quick actions & Navigation row */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-200">الوصول السريع إلى أقسام المنظومة</h4>
            <p className="text-xs text-zinc-500 mt-0.5">إدارة سريعة للمطاعم والكباتن والاشتراكات المالية</p>
          </div>
          <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 w-fit">
            El Batal Dispatch Core
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/send-order"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Send className="w-4 h-4 -rotate-45" />
              </div>
              <div>
                <span>إرسال طلب لكابتن</span>
                <span className="text-[11px] text-amber-400/80 block font-normal">إسناد فوري مع بحث سريع</span>
              </div>
            </div>
            <ArrowUpLeft className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/restaurants"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-200 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <span>إدارة المطاعم</span>
                <span className="text-[11px] text-zinc-500 block font-normal">{stats?.activeRestaurants ?? 3} متصل ومعتمد</span>
              </div>
            </div>
            <ArrowUpLeft className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            to="/captains"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-200 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <span>متابعة الكباتن الميدانيين</span>
                <span className="text-[11px] text-zinc-500 block font-normal">{stats?.activeCaptains ?? 3} جاهز للتوصيل</span>
              </div>
            </div>
            <ArrowUpLeft className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            to="/subscriptions"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-200 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span>خطط وباقات الاشتراكات</span>
                <span className="text-[11px] text-zinc-500 block font-normal">باقات 400 - 1000 ج.م</span>
              </div>
            </div>
            <ArrowUpLeft className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* 8 Stats cards grid */}
      <div>
        <h3 className="text-base font-extrabold text-white mb-4">مؤشرات الأداء الأساسية</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="bg-[#11141c] hover:bg-[#151923] border border-zinc-800/90 hover:border-amber-500/30 rounded-2xl p-5 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-zinc-900 border border-zinc-800 ${card.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-400 block mb-1">
                    {card.title}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white font-['Outfit',sans-serif]">
                      {card.value.toLocaleString('ar-EG')}
                    </span>
                    <ArrowUpLeft className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">آخر الطلبات المنفذة</h3>
            <p className="text-xs text-zinc-400 mt-0.5">سجل تدفق الطلبات لحظة بلحظة</p>
          </div>
          <Link
            to="/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>عرض جميع الطلبات</span>
            <ArrowUpLeft className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات مسجلة حتى الآن"
            description="عندما تبدأ المطاعم والعملاء بإنشاء طلبات، ستظهر هنا فوراً بتحديث لحظي."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 text-xs font-bold text-zinc-400">
                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">المطعم</th>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">الكابتن</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-200">
                      {order.restaurantName}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 text-xs">
                      {order.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 text-xs">
                      {order.captainName || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-white font-['Outfit',sans-serif] text-xs">
                      {order.total} ج.م
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} type="order" />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
