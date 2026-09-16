import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Table,
  FileText,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  Receipt,
  HelpCircle,
  Database,
  Layers,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { OrderService } from '../services/orderService';
import { RestaurantService } from '../services/restaurantService';
import { CaptainService } from '../services/captainService';
import { PaymentService } from '../services/paymentService';
import { SubscriptionService } from '../services/subscriptionService';
import {
  exportOrders,
  exportRestaurants,
  exportCaptains,
  exportPayments,
  exportSubscriptions,
  exportCompleteDatabaseWorkbook,
} from '../utils/exportUtils';

export const GoogleSheetsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  // Database Counts
  const [ordersCount, setOrdersCount] = useState(0);
  const [restaurantsCount, setRestaurantsCount] = useState(0);
  const [captainsCount, setCaptainsCount] = useState(0);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Direct Excel & CSV Export progress state
  const [exportingDirect, setExportingDirect] = useState<string | null>(null);

  // Fetch live counts from database
  const loadCounts = async () => {
    try {
      setLoadingCounts(true);
      const [ordersRes, restRes, capRes, payRes, subRes] = await Promise.all([
        OrderService.getAll(),
        RestaurantService.getAll(),
        CaptainService.getAll(),
        PaymentService.getAll(),
        SubscriptionService.getAll(),
      ]);
      setOrdersCount(ordersRes.data.length);
      setRestaurantsCount(restRes.data.length);
      setCaptainsCount(capRes.data.length);
      setPaymentsCount(payRes.data.length);
      setSubscriptionsCount(subRes.data.length);
    } catch (err) {
      console.warn('Failed to fetch counts:', err);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  // Direct Excel & CSV Export handler
  const handleDirectExport = async (
    type: 'orders' | 'restaurants' | 'captains' | 'finance' | 'subscriptions' | 'all',
    format: 'xlsx' | 'csv'
  ) => {
    setExportingDirect(`${type}-${format}`);
    try {
      if (type === 'orders') {
        const res = await OrderService.getAll();
        exportOrders(res.data, format);
        success(`تم تنزيل ${res.data.length} طلب كملف ${format.toUpperCase()} بنجاح!`);
      } else if (type === 'restaurants') {
        const res = await RestaurantService.getAll();
        exportRestaurants(res.data, format);
        success(`تم تنزيل ${res.data.length} مطعم كملف ${format.toUpperCase()} بنجاح!`);
      } else if (type === 'captains') {
        const res = await CaptainService.getAll();
        exportCaptains(res.data, format);
        success(`تم تنزيل ${res.data.length} كابتن كملف ${format.toUpperCase()} بنجاح!`);
      } else if (type === 'finance') {
        const payRes = await PaymentService.getAll();
        exportPayments(payRes.data, format);
        success(`تم تنزيل ${payRes.data.length} حركة مدفوعات كملف ${format.toUpperCase()} بنجاح!`);
      } else if (type === 'subscriptions') {
        const subRes = await SubscriptionService.getAll();
        exportSubscriptions(subRes.data, format);
        success(`تم تنزيل ${subRes.data.length} اشتراك شهري كملف ${format.toUpperCase()} بنجاح!`);
      } else if (type === 'all') {
        const [o, r, c, p, s] = await Promise.all([
          OrderService.getAll(),
          RestaurantService.getAll(),
          CaptainService.getAll(),
          PaymentService.getAll(),
          SubscriptionService.getAll(),
        ]);
        exportCompleteDatabaseWorkbook({
          orders: o.data,
          restaurants: r.data,
          captains: c.data,
          payments: p.data,
          subscriptions: s.data,
        });
        success('تم تنزيل قاعدة البيانات بالكامل كملف Excel شامل متعدد الجداول!');
      }
    } catch (err: any) {
      toastError('حدث خطأ أثناء تصدير الملف: ' + (err.message || ''));
    } finally {
      setExportingDirect(null);
    }
  };

  const totalRecords = ordersCount + restaurantsCount + captainsCount + paymentsCount + subscriptionsCount;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">تصدير وجداول البيانات</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                تنزيل وتصدير فوري لكافة بيانات الطلبات والمطاعم والكباتن والعمليات المالية بصيغة Excel و CSV
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadCounts}
            disabled={loadingCounts}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
            title="تحديث عدد السجلات المتوفرة في قاعدة البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loadingCounts ? 'animate-spin text-emerald-400' : ''}`} />
            <span>تحديث الإحصائيات</span>
          </button>

          <button
            onClick={() => handleDirectExport('all', 'xlsx')}
            disabled={exportingDirect !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="تنزيل كافة الجداول في مصنف Excel واحد"
          >
            {exportingDirect === 'all-xlsx' ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>تحميل الكل (Excel)</span>
          </button>
        </div>
      </div>

      {/* Main Direct Export Showcase Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#101918] to-[#11141c] border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير فوري ومباشر — بدون أي حسابات خارجية أو إذن تسجيل دخول</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              تصدير الجداول فورياً بصيغة Excel (.xlsx) أو CSV
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              يمكنك تنزيل بيانات الطلبات، المطاعم، الكباتن، والمدفوعات بضغطة زر واحدة. بمجرد تنزيل الملف يمكنك فتحه فوراً في <strong className="text-white">Microsoft Excel</strong> أو سحبه وإفلاته في <strong className="text-white">Google Sheets</strong>، مع التنسيق العربي الكامل وترتيب الأعمدة والتواريخ والمبالغ المالية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleDirectExport('all', 'xlsx')}
              disabled={exportingDirect !== null}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="تنزيل ملف Excel يحتوي على كل البيانات مقسمة في صفحات منفصلة"
            >
              {exportingDirect === 'all-xlsx' ? (
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>تحميل قاعدة البيانات بالكامل (Excel شامل)</span>
            </button>

            <a
              href="https://sheets.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="فتح موقع Google Sheets لرفع ملفك بعد التنزيل"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>فتح موقع Google Sheets</span>
            </a>
          </div>
        </div>

        {/* Database Status Pills */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">إجمالي السجلات الجاهزة في قاعدة البيانات:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
            {totalRecords} سجل
          </span>
          <span className="text-zinc-600">•</span>
          <span>ترميز الملفات: <strong className="text-zinc-300">UTF-8 عربي كامل</strong></span>
          <span className="text-zinc-600">•</span>
          <span>التوافق: <strong className="text-zinc-300">Excel 2016+, Office 365, Google Sheets, LibreOffice</strong></span>
        </div>
      </div>

      {/* Export Modules Grid (4 primary modules) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders Export */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors shadow-lg group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">سجل حركة الطلبات</h4>
              <p className="text-xs text-zinc-400 mt-1">
                تصدير كافة الطلبات بمراحلها السبعة، المطاعم، الكباتن، رسوم التوصيل، والعناوين.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono font-bold text-amber-400">
              {ordersCount} طلب متوفر للتصدير
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
              <span>تصدير مباشر فوري:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDirectExport('orders', 'xlsx')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف Excel (.xlsx) جاهز لـ Excel و Google Sheets"
              >
                {exportingDirect === 'orders-xlsx' ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleDirectExport('orders', 'csv')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف CSV عام"
              >
                {exportingDirect === 'orders-csv' ? (
                  <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Restaurants Export */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors shadow-lg group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">بيانات المطاعم المسجلة</h4>
              <p className="text-xs text-zinc-400 mt-1">
                تصدير قائمة المطاعم المسجلة، أرقام الهواتف، العناوين، وإجمالي الطلبات المسجلة.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono font-bold text-emerald-400">
              {restaurantsCount} مطعم مسجل
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
              <span>تصدير مباشر فوري:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDirectExport('restaurants', 'xlsx')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف Excel (.xlsx)"
              >
                {exportingDirect === 'restaurants-xlsx' ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleDirectExport('restaurants', 'csv')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف CSV"
              >
                {exportingDirect === 'restaurants-csv' ? (
                  <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Captains Export */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">أسطول كباتن التوصيل</h4>
              <p className="text-xs text-zinc-400 mt-1">
                تصدير بيانات الكباتن، أرقام اللوحات، الحالات التشغيلية، وأرصدة المحافظ.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono font-bold text-cyan-400">
              {captainsCount} كابتن مسجل
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
              <span>تصدير مباشر فوري:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDirectExport('captains', 'xlsx')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف Excel (.xlsx)"
              >
                {exportingDirect === 'captains-xlsx' ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleDirectExport('captains', 'csv')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف CSV"
              >
                {exportingDirect === 'captains-csv' ? (
                  <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial & Subscriptions Export */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors shadow-lg group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">التقرير المالي والاشتراكات</h4>
              <p className="text-xs text-zinc-400 mt-1">
                تصدير كافة الحركات المالية، الاشتراكات الشهرية، طرق الدفع وتواريخ الاستحقاق.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono font-bold text-purple-400">
              {paymentsCount + subscriptionsCount} سجل مالي
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
              <span>تصدير مباشر فوري:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDirectExport('finance', 'xlsx')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف Excel (.xlsx)"
              >
                {exportingDirect === 'finance-xlsx' ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleDirectExport('finance', 'csv')}
                disabled={exportingDirect !== null}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تنزيل كملف CSV"
              >
                {exportingDirect === 'finance-csv' ? (
                  <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview & Quick Guide Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Inventory Table */}
        <div className="lg:col-span-2 bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">ملخص السجلات المتوفرة للتصدير</h3>
                <p className="text-xs text-zinc-400">حالة البيانات الفعلية المسجلة حالياً في النظام</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/40">
                  <th className="py-3 px-4">نوع الجدول</th>
                  <th className="py-3 px-4">عدد السجلات</th>
                  <th className="py-3 px-4">الصيغ المدعومة</th>
                  <th className="py-3 px-4 text-left">التصدير السريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-200 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>سجل حركة الطلبات</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{ordersCount}</td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">Excel (.xlsx) / CSV</td>
                  <td className="py-3.5 px-4 text-left">
                    <button
                      onClick={() => handleDirectExport('orders', 'xlsx')}
                      disabled={exportingDirect !== null}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      تنزيل Excel
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-200 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>بيانات المطاعم الشريكة</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{restaurantsCount}</td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">Excel (.xlsx) / CSV</td>
                  <td className="py-3.5 px-4 text-left">
                    <button
                      onClick={() => handleDirectExport('restaurants', 'xlsx')}
                      disabled={exportingDirect !== null}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      تنزيل Excel
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-200 flex items-center gap-2">
                    <Bike className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>أسطول الكباتن والمناديب</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{captainsCount}</td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">Excel (.xlsx) / CSV</td>
                  <td className="py-3.5 px-4 text-left">
                    <button
                      onClick={() => handleDirectExport('captains', 'xlsx')}
                      disabled={exportingDirect !== null}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      تنزيل Excel
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-200 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>المدفوعات والمتحصلات</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{paymentsCount}</td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">Excel (.xlsx) / CSV</td>
                  <td className="py-3.5 px-4 text-left">
                    <button
                      onClick={() => handleDirectExport('finance', 'xlsx')}
                      disabled={exportingDirect !== null}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      تنزيل Excel
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>الاشتراكات الشهرية</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{subscriptionsCount}</td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">Excel (.xlsx) / CSV</td>
                  <td className="py-3.5 px-4 text-left">
                    <button
                      onClick={() => handleDirectExport('subscriptions', 'xlsx')}
                      disabled={exportingDirect !== null}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      تنزيل Excel
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* How to use with Google Sheets Guide */}
        <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">كيفية الفتح في Google Sheets</h3>
              <p className="text-xs text-zinc-400">بسيطة وسريعة بدون أي أذونات أو تعقيد</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/70">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                1
              </div>
              <div>
                <p className="font-bold text-zinc-100">تنزيل الملف المطلوب</p>
                <p className="text-zinc-400 mt-0.5">اضغط على زر تنزيل Excel (.xlsx) أو ملف قاعدة البيانات الشامل.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/70">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                2
              </div>
              <div>
                <p className="font-bold text-zinc-100">الفتح في Microsoft Excel</p>
                <p className="text-zinc-400 mt-0.5">انقر نقراً مزدوجاً على الملف المحمل وسيفتح مباشرة بكافة التنسيقات والألوان.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/70">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                3
              </div>
              <div>
                <p className="font-bold text-zinc-100">الفتح في Google Sheets</p>
                <p className="text-zinc-400 mt-0.5">
                  افتح <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">Google Drive</a> أو <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">Google Sheets</a> واسحب الملف وأفلته، وسيتحول تلقائياً لجدول بيانات أونلاين.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>الملفات منسقة من اليمين لليسار (RTL) لدعم اللغة العربية بشكل مثالي.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
