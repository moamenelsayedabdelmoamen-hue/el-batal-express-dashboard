import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Bike,
  Coins,
  TrendingUp,
  ArrowUpLeft,
  Clock,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface MetricsSummaryProps {
  stats: DashboardStats;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ stats }) => {
  const dailyOrders = stats.todayOrders ?? 0;
  const dailyVolume = stats.dailyOrderVolume ?? 0;
  const activeCaptains = stats.activeCaptains ?? 0;
  const totalCaptains = stats.totalCaptains ?? 0;
  const monthlyRevenue = stats.monthlyRevenue ?? 0;
  const totalRevenue = stats.totalRevenue ?? 0;
  const avgOrderValue = stats.avgOrderValue ?? 0;
  const deliveryTime = stats.avgDeliveryTimeMinutes ?? 0;
  const captainReadinessRate = totalCaptains > 0 ? Math.round((activeCaptains / totalCaptains) * 100) : 0;
  const monthlyTarget = 25000;
  const monthlyTargetPercent = monthlyTarget > 0 ? Math.min(100, Math.round((monthlyRevenue / monthlyTarget) * 100)) : 0;

  return (
    <section id="metrics-summary-section" aria-label="ملخص المؤشرات الرئيسية" className="space-y-4">
      {/* Section Header */}
      <div id="metrics-summary-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 id="metrics-summary-title" className="text-base sm:text-lg font-black text-white">
              ملخص المؤشرات التشغيلية الحيوية
            </h3>
            <p className="text-xs text-zinc-400">
              متابعة مباشرة لحجم الطلبات، قوة الأسطول الميداني والإيرادات المحققة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            تحديث لحظي مباشر
          </span>
        </div>
      </div>

      {/* 3 Core Metric Spotlight Cards */}
      <div id="metrics-cards-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Daily Order Volume */}
        <div
          id="metric-daily-order-volume"
          className="bg-gradient-to-br from-[#121622] to-[#0c0e14] border border-amber-500/30 hover:border-amber-500/50 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all group flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 block">حجم الطلبات اليومية</span>
                  <span className="text-[11px] text-zinc-400">اليوم ({new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })})</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                <TrendingUp className="w-3 h-3" />
                {dailyOrders > 0 ? `${dailyOrders} طلب` : 'محدث الآن'}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span id="daily-order-count-value" className="text-3xl sm:text-4xl font-black text-white font-['Outfit',sans-serif]">
                  {dailyOrders.toLocaleString('ar-EG')}
                </span>
                <span className="text-sm font-bold text-zinc-300">طلب اليوم</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span>القيمة النقدية للطلبات:</span>
                <strong className="text-amber-300 font-['Outfit',sans-serif] font-bold">
                  {dailyVolume.toLocaleString('ar-EG')} ج.م
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400">متوسط قيمة الطلب</span>
              <span className="text-white font-bold font-['Outfit',sans-serif]">{avgOrderValue} ج.م</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyOrders / 25) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-zinc-500">الهدف اليومي: 25 طلب</span>
              <Link
                id="link-to-orders-detail"
                to="/orders"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>تفاصيل الطلبات</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Active Captains */}
        <div
          id="metric-active-captains"
          className="bg-gradient-to-br from-[#121622] to-[#0c0e14] border border-cyan-500/30 hover:border-cyan-500/50 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all group flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-cyan-400 block">إجمالي الكباتن النشطين</span>
                  <span className="text-[11px] text-zinc-400">أسطول التوصيل الميداني</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                متصلون الآن
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span id="active-captains-count-value" className="text-3xl sm:text-4xl font-black text-white font-['Outfit',sans-serif]">
                  {activeCaptains.toLocaleString('ar-EG')}
                </span>
                <span className="text-sm font-bold text-zinc-300">
                  كابتن جاهز من أصل {totalCaptains}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span>نسبة جاهزية الأسطول:</span>
                <strong className="text-cyan-300 font-['Outfit',sans-serif] font-bold">
                  %{captainReadinessRate}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>متوسط سرعة التوصيل</span>
              </div>
              <span className="text-white font-bold">{deliveryTime} دقيقة</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${captainReadinessRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-zinc-500">جاهزون للاستلام الفوري</span>
              <Link
                id="link-to-captains-detail"
                to="/captains"
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>إدارة الكباتن</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 3: Monthly Revenue */}
        <div
          id="metric-monthly-revenue"
          className="bg-gradient-to-br from-[#121622] to-[#0c0e14] border border-emerald-500/30 hover:border-emerald-500/50 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all group flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">الإيرادات الشهرية</span>
                  <span className="text-[11px] text-zinc-400">اشتراكات ومعاملات الشهر الحالي</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                <Target className="w-3 h-3" />
                %{monthlyTargetPercent} من الهدف
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span id="monthly-revenue-amount-value" className="text-3xl sm:text-4xl font-black text-white font-['Outfit',sans-serif]">
                  {monthlyRevenue.toLocaleString('ar-EG')}
                </span>
                <span className="text-sm font-bold text-emerald-400">ج.م (EGP)</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span>التراكمي الإجمالي:</span>
                <strong className="text-zinc-300 font-['Outfit',sans-serif] font-bold">
                  {totalRevenue.toLocaleString('ar-EG')} ج.م
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400">المستهدف الشهري (25,000 ج.م)</span>
              <span className="text-white font-bold font-['Outfit',sans-serif]">%{monthlyTargetPercent}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${monthlyTargetPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-zinc-500">تشمل الاشتراكات ورسوم التوصيل</span>
              <Link
                id="link-to-payments-detail"
                to="/payments"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>سجل الإيرادات</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Operational Quick Bar */}
      <div
        id="metrics-secondary-quick-bar"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#11141c] border border-zinc-800/80 rounded-2xl p-4 text-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">معدل سرعة التوصيل</span>
            <strong className="text-zinc-200 font-bold">{deliveryTime} دقيقة</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">نسبة إكمال الطلبات</span>
            <strong className="text-emerald-400 font-bold">
              %{stats.orderSuccessRate ?? (stats.totalOrders ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 94)}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">المطاعم المشتركة</span>
            <strong className="text-zinc-200 font-bold">
              {stats.activeRestaurants} نشط من {stats.totalRestaurants}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">إجمالي الطلبات المنفذة</span>
            <strong className="text-white font-bold font-['Outfit',sans-serif]">
              {stats.totalOrders.toLocaleString('ar-EG')} طلب
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
};
