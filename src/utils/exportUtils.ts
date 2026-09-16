import * as XLSX from 'xlsx';
import { Order, Restaurant, Captain, Payment, Subscription } from '../types';

/**
 * Format timestamp or date string to readable Arabic/standard format
 */
function formatDate(val: any): string {
  if (!val) return '-';
  try {
    if (typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000).toLocaleString('ar-EG');
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('ar-EG');
    }
  } catch {
    // fallback
  }
  return String(val);
}

/**
 * Status translations for user-friendly Arabic sheets
 */
const STATUS_TRANSLATIONS: Record<string, string> = {
  New: 'طلب جديد',
  Accepted: 'تم القبول',
  Preparing: 'جاري التجهيز',
  Ready: 'جاهز للاستلام',
  'Picked Up': 'تم الاستلام وجاري التوصيل',
  Delivered: 'تم التسليم بنجاح',
  Cancelled: 'ملغي',
  online: 'متاح متصل',
  busy: 'مشغول بطلب',
  offline: 'غير متصل',
  Active: 'نشط',
  Pending: 'قيد الانتظار',
  Expired: 'منتهي',
  Suspended: 'موقوف',
  success: 'مكتمل بنجاح',
  failed: 'فاشل',
};

function translateStatus(status?: string): string {
  if (!status) return '-';
  return STATUS_TRANSLATIONS[status] || status;
}

/**
 * Download helper using SheetJS
 */
function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string, format: 'xlsx' | 'csv') {
  if (format === 'csv') {
    // Export first sheet as CSV with UTF-8 BOM
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(workbook, `${fileName}.xlsx`, { bookType: 'xlsx' });
  }
}

/**
 * 1. Export Orders to Excel / CSV
 */
export function exportOrders(orders: Order[], format: 'xlsx' | 'csv' = 'xlsx') {
  const data = orders.map((order, idx) => ({
    '#': idx + 1,
    'رقم الطلب': order.orderNumber || order.id || '-',
    'اسم المطعم': order.restaurantName || '-',
    'اسم العميل': order.customerName || '-',
    'هاتف العميل': order.customerPhone || '-',
    'عنوان التوصيل': order.deliveryAddress || '-',
    'الكابتن المندوب': order.captainName || 'لم يُعيّن',
    'قيمة الطلب (ج.م)': order.subtotal || 0,
    'تكلفة التوصيل (ج.م)': order.deliveryFee || 0,
    'الإجمالي الكلي (ج.م)': order.total || 0,
    'حالة الطلب': translateStatus(order.status),
    'تاريخ الإنشاء': formatDate(order.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Auto column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(workbook, `طلبات_البطل_إكسبريس_${dateStr}`, format);
}

/**
 * 2. Export Restaurants to Excel / CSV
 */
export function exportRestaurants(restaurants: Restaurant[], format: 'xlsx' | 'csv' = 'xlsx') {
  const data = restaurants.map((r, idx) => ({
    '#': idx + 1,
    'اسم المطعم': r.name || '-',
    'التصنيف': r.category || 'عام',
    'رقم الهاتف': r.phone || '-',
    'العنوان': r.address || '-',
    'التقييم': r.rating || 5,
    'حالة الاشتراك': translateStatus(r.subscriptionStatus || 'Active'),
    'حالة النشاط': r.isActive ? 'مفعل' : 'معطل',
    'البريد الإلكتروني': r.ownerEmail || '-',
    'تاريخ التسجيل': formatDate(r.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 26 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المطاعم');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(workbook, `مطاعم_البطل_إكسبريس_${dateStr}`, format);
}

/**
 * 3. Export Captains to Excel / CSV
 */
export function exportCaptains(captains: Captain[], format: 'xlsx' | 'csv' = 'xlsx') {
  const data = captains.map((c, idx) => ({
    '#': idx + 1,
    'اسم الكابتن': c.name || '-',
    'رقم الهاتف': c.phone || '-',
    'نوع المركبة': c.vehicleType || 'دراجة نارية',
    'الحالة الحالية': translateStatus(c.status),
    'عدد الطلبات المنجزة': c.ordersCount || 0,
    'التقييم': c.rating || 5,
    'تاريخ الانضمام': formatDate(c.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الكباتن');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(workbook, `كباتن_البطل_إكسبريس_${dateStr}`, format);
}

/**
 * 4. Export Payments to Excel / CSV
 */
export function exportPayments(payments: Payment[], format: 'xlsx' | 'csv' = 'xlsx') {
  const data = payments.map((p, idx) => ({
    '#': idx + 1,
    'رقم المعاملة': p.transactionNumber || p.transactionId || p.id || '-',
    'اسم المطعم / العميل': p.restaurantName || '-',
    'المبلغ (ج.م)': p.amount || 0,
    'طريقة الدفع': p.paymentMethod || 'Cash',
    'حالة الدفع': translateStatus(p.status),
    'ملاحظات': p.notes || '-',
    'التاريخ': formatDate(p.date || p.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المدفوعات');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(workbook, `مدفوعات_البطل_إكسبريس_${dateStr}`, format);
}

/**
 * 5. Export Subscriptions to Excel / CSV
 */
export function exportSubscriptions(subscriptions: Subscription[], format: 'xlsx' | 'csv' = 'xlsx') {
  const data = subscriptions.map((s, idx) => ({
    '#': idx + 1,
    'اسم المطعم': s.restaurantName || '-',
    'نوع الباقة': s.plan || '-',
    'عدد الكباتن': s.captainsCount || 0,
    'قيمة الاشتراك (ج.م)': s.price || 0,
    'تاريخ البدء': formatDate(s.startDate),
    'تاريخ الانتهاء': formatDate(s.endDate),
    'حالة الاشتراك': translateStatus(s.status),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الاشتراكات');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(workbook, `اشتراكات_البطل_إكسبريس_${dateStr}`, format);
}

/**
 * 6. Export Complete Multi-Sheet Workbook with all system records
 */
export function exportCompleteDatabaseWorkbook(allData: {
  orders: Order[];
  restaurants: Restaurant[];
  captains: Captain[];
  payments: Payment[];
  subscriptions: Subscription[];
}) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Orders
  const ordersData = allData.orders.map((o, idx) => ({
    '#': idx + 1,
    'رقم الطلب': o.orderNumber || o.id,
    'المطعم': o.restaurantName,
    'العميل': o.customerName,
    'الهاتف': o.customerPhone || '-',
    'العنوان': o.deliveryAddress || '-',
    'المندوب': o.captainName || 'لم يُعيّن',
    'المجموع (ج.م)': o.total || 0,
    'الحالة': translateStatus(o.status),
    'التاريخ': formatDate(o.createdAt),
  }));
  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(workbook, wsOrders, 'الطلبات');

  // Sheet 2: Restaurants
  const restData = allData.restaurants.map((r, idx) => ({
    '#': idx + 1,
    'اسم المطعم': r.name,
    'التصنيف': r.category || 'عام',
    'الهاتف': r.phone || '-',
    'الاشتراك': translateStatus(r.subscriptionStatus || 'Active'),
    'الحالة': r.isActive ? 'مفعل' : 'معطل',
  }));
  const wsRest = XLSX.utils.json_to_sheet(restData);
  XLSX.utils.book_append_sheet(workbook, wsRest, 'المطاعم');

  // Sheet 3: Captains
  const capData = allData.captains.map((c, idx) => ({
    '#': idx + 1,
    'اسم الكابتن': c.name,
    'الهاتف': c.phone,
    'المركبة': c.vehicleType || 'دراجة نارية',
    'الحالة': translateStatus(c.status),
    'الطلبات المنجزة': c.ordersCount || 0,
  }));
  const wsCap = XLSX.utils.json_to_sheet(capData);
  XLSX.utils.book_append_sheet(workbook, wsCap, 'الكباتن');

  // Sheet 4: Payments
  const payData = allData.payments.map((p, idx) => ({
    '#': idx + 1,
    'رقم المعاملة': p.transactionNumber || p.id,
    'المطعم': p.restaurantName,
    'المبلغ (ج.م)': p.amount,
    'طريقة الدفع': p.paymentMethod,
    'الحالة': translateStatus(p.status),
    'التاريخ': formatDate(p.date || p.createdAt),
  }));
  const wsPay = XLSX.utils.json_to_sheet(payData);
  XLSX.utils.book_append_sheet(workbook, wsPay, 'المدفوعات');

  // Sheet 5: Subscriptions
  const subData = allData.subscriptions.map((s, idx) => ({
    '#': idx + 1,
    'المطعم': s.restaurantName,
    'الباقة': s.plan,
    'القيمة (ج.م)': s.price,
    'البداية': formatDate(s.startDate),
    'الانتهاء': formatDate(s.endDate),
    'الحالة': translateStatus(s.status),
  }));
  const wsSub = XLSX.utils.json_to_sheet(subData);
  XLSX.utils.book_append_sheet(workbook, wsSub, 'الاشتراكات');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `قاعدة_بيانات_البطل_إكسبريس_شاملة_${dateStr}.xlsx`);
}
