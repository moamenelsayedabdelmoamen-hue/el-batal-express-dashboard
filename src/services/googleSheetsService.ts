import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { Order, Restaurant, Captain, Payment, Subscription } from '../types';

// In-memory access token cache as strictly required by Workspace Integration skill
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear cached token on sign out
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
  });
}

/**
 * Sets or clears the in-memory access token
 */
export function setCachedGoogleToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Gets the current cached access token
 */
export function getCachedGoogleToken(): string | null {
  return cachedAccessToken;
}

/**
 * Ensures a valid Google OAuth access token with Google Sheets & Drive scopes.
 * If not already available, triggers the Google Sign-in popup.
 */
export async function getGoogleAccessToken(forcePrompt = false): Promise<string> {
  if (cachedAccessToken && !forcePrompt) {
    return cachedAccessToken;
  }

  if (!auth) {
    throw new Error('Firebase Auth غير مهيأ حالياً.');
  }

  if (isSigningIn) {
    // Wait for in-flight sign-in
    let attempts = 0;
    while (isSigningIn && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
      if (cachedAccessToken) return cachedAccessToken;
    }
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('لم يتم استلام رمز الوصول (OAuth Access Token) من Google.');
    }

    cachedAccessToken = token;
    return token;
  } catch (error: any) {
    console.error('Google OAuth sign-in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('تم إلغاء تسجيل الدخول أو إغلاق النافذة المنبثقة.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('تم حظر النافذة المنبثقة بواسطة المتصفح. يرجى السماح بالنوافذ المنبثقة.');
    }
    throw new Error(error.message || 'فشل الاتصال بخدمات Google.');
  } finally {
    isSigningIn = false;
  }
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List the user's existing Google Spreadsheets via Google Drive API
 */
export async function listGoogleSpreadsheets(token?: string): Promise<GoogleDriveFile[]> {
  const accessToken = token || (await getGoogleAccessToken());
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=25`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('انتهت صلاحية جلسة Google، يرجى إعادة تسجيل الدخول.');
    }
    throw new Error(errBody?.error?.message || `فشل جلب ملفات Google Sheets (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new Google Spreadsheet in Google Drive
 */
export async function createGoogleSpreadsheet(
  title: string,
  sheets: { title: string; rows?: any[][] }[] = [],
  token?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const accessToken = token || (await getGoogleAccessToken());

  const requestBody = {
    properties: {
      title,
    },
    sheets: sheets.map((s) => ({
      properties: {
        title: s.title,
      },
      data: s.rows && s.rows.length > 0
        ? [
            {
              startRow: 0,
              startColumn: 0,
              rowData: s.rows.map((row) => ({
                values: row.map((cell) => ({
                  userEnteredValue:
                    typeof cell === 'number'
                      ? { numberValue: cell }
                      : typeof cell === 'boolean'
                      ? { boolValue: cell }
                      : { stringValue: String(cell ?? '') },
                })),
              })),
            },
          ]
        : undefined,
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('انتهت صلاحية جلسة Google، يرجى إعادة تسجيل الدخول.');
    }
    throw new Error(errBody?.error?.message || `فشل إنشاء جدول بيانات Google (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Appends or updates rows in an existing spreadsheet tab
 */
export async function appendSpreadsheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][],
  token?: string
): Promise<any> {
  const accessToken = token || (await getGoogleAccessToken());
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `فشل كتابة البيانات إلى الجدول (${res.status})`);
  }

  return await res.json();
}

/**
 * Overwrite specific range with values
 */
export async function updateSpreadsheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][],
  token?: string
): Promise<any> {
  const accessToken = token || (await getGoogleAccessToken());
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `فشل تحديث بيانات الجدول (${res.status})`);
  }

  return await res.json();
}

/**
 * Reads values from a specific range in a Google Sheet
 */
export async function readSpreadsheetValues(
  spreadsheetId: string,
  range: string,
  token?: string
): Promise<any[][]> {
  const accessToken = token || (await getGoogleAccessToken());
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `فشل قراءة بيانات الجدول (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Fetch spreadsheet metadata including sheet tabs names
 */
export async function getSpreadsheetMetadata(spreadsheetId: string, token?: string): Promise<any> {
  const accessToken = token || (await getGoogleAccessToken());
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties,sheets.properties`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `فشل جلب تفاصيل الجدول (${res.status})`);
  }

  return await res.json();
}

// ==========================================
// High-Level Exporters for El Batal Express
// ==========================================

/**
 * Export Orders to a formatted Google Sheet
 */
export async function exportOrdersToGoogleSheet(
  orders: Order[],
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; totalExported: number }> {
  const title =
    customTitle ||
    `طلبات البطل إكسبريس - ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}`;

  const headers = [
    'رقم الطلب',
    'اسم المطعم',
    'اسم الكابتن',
    'اسم العميل',
    'هاتف العميل',
    'عنوان التوصيل',
    'قيمة الطلب',
    'رسوم التوصيل',
    'الحالة',
    'طريقة الدفع',
    'تاريخ ووقت الإنشاء',
    'ملاحظات',
  ];

  const rows = [
    headers,
    ...orders.map((o) => [
      o.orderNumber || '',
      o.restaurantName || '',
      o.captainName || 'لم يُحدد بعد',
      o.customerName || '',
      o.customerPhone || '',
      o.deliveryAddress || '',
      o.total || 0,
      o.deliveryFee || 0,
      o.status || '',
      o.raw?.paymentMethod || 'Cash',
      o.createdAt ? new Date(o.createdAt).toLocaleString('ar-EG') : '',
      o.raw?.notes || '',
    ]),
  ];

  const result = await createGoogleSpreadsheet(title, [{ title: 'الطلبات المسجلة', rows }]);

  return {
    ...result,
    totalExported: orders.length,
  };
}

/**
 * Export Restaurants to a formatted Google Sheet
 */
export async function exportRestaurantsToGoogleSheet(
  restaurants: Restaurant[],
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; totalExported: number }> {
  const title =
    customTitle ||
    `قائمة مطاعم البطل إكسبريس - ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}`;

  const headers = [
    'معرف المطعم',
    'اسم المطعم',
    'التصنيف',
    'رقم الهاتف',
    'العنوان',
    'حالة الاشتراك',
    'الحالة التشغيلية',
    'إجمالي الطلبات',
    'تاريخ التسجيل',
  ];

  const rows = [
    headers,
    ...restaurants.map((r) => [
      r.id || '',
      r.name || '',
      r.category || 'عام',
      r.phone || '',
      r.address || '',
      r.subscriptionStatus || 'Active',
      r.isActive ? 'مفعل نشط' : 'متوقف',
      r.raw?.totalOrders || 0,
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : '',
    ]),
  ];

  const result = await createGoogleSpreadsheet(title, [{ title: 'المطاعم المسجلة', rows }]);

  return {
    ...result,
    totalExported: restaurants.length,
  };
}

/**
 * Export Captains to a formatted Google Sheet
 */
export async function exportCaptainsToGoogleSheet(
  captains: Captain[],
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; totalExported: number }> {
  const title =
    customTitle ||
    `كباتن البطل إكسبريس - ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}`;

  const headers = [
    'معرف الكابتن',
    'اسم الكابتن',
    'رقم الهاتف',
    'نوع المركبة',
    'رقم اللوحة',
    'الحالة الحالية',
    'إجمالي التوصيلات',
    'رصيد المحفظة',
    'التقييم',
    'تاريخ التسجيل',
  ];

  const rows = [
    headers,
    ...captains.map((c) => [
      c.id || '',
      c.name || '',
      c.phone || '',
      c.vehicleType || '',
      c.raw?.vehicleNumber || '',
      c.status || 'online',
      c.ordersCount || 0,
      c.raw?.walletBalance || 0,
      c.rating || 5,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : '',
    ]),
  ];

  const result = await createGoogleSpreadsheet(title, [{ title: 'الكباتن المسجلون', rows }]);

  return {
    ...result,
    totalExported: captains.length,
  };
}

/**
 * Export Financial Transactions & Subscriptions to Google Sheet
 */
export async function exportFinancialsToGoogleSheet(
  payments: Payment[],
  subscriptions: Subscription[],
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; totalExported: number }> {
  const title =
    customTitle ||
    `التقرير المالي للبطل إكسبريس - ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}`;

  const paymentHeaders = [
    'معرف المعاملة',
    'اسم المطعم / الكيان',
    'المبلغ',
    'النوع',
    'طريقة الدفع',
    'الحالة',
    'التاريخ',
    'ملاحظات',
  ];

  const paymentRows = [
    paymentHeaders,
    ...payments.map((p) => [
      p.id || '',
      p.restaurantName || p.restaurantId || '',
      p.amount || 0,
      p.raw?.type || 'دفعة مطعم',
      p.paymentMethod || '',
      p.status || '',
      p.date || (p.createdAt ? new Date(p.createdAt).toLocaleDateString('ar-EG') : ''),
      p.notes || '',
    ]),
  ];

  const subHeaders = [
    'معرف الاشتراك',
    'اسم المطعم',
    'نوع الباقة',
    'القيمة الشهرية',
    'تاريخ البدء',
    'تاريخ الانتهاء',
    'الحالة',
  ];

  const subRows = [
    subHeaders,
    ...subscriptions.map((s) => [
      s.id || '',
      s.restaurantName || '',
      s.plan || '',
      s.price || 0,
      s.startDate || '',
      s.endDate || '',
      s.status || '',
    ]),
  ];

  const result = await createGoogleSpreadsheet(title, [
    { title: 'سجل المعاملات والمدفوعات', rows: paymentRows },
    { title: 'الاشتراكات الشهرية', rows: subRows },
  ]);

  return {
    ...result,
    totalExported: payments.length + subscriptions.length,
  };
}
