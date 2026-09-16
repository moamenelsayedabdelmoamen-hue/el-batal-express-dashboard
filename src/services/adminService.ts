import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  getAuth,
} from 'firebase/auth';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { auth, db, firebaseConfig, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { COLLECTIONS } from './collections';
import { AdminAccount, AdminRolePermission } from '../types';

let localAdminsCache: AdminAccount[] = [
  {
    id: 'super_admin_master',
    uid: 'super_admin_master',
    name: 'مؤمن السيد (مسؤول النظام)',
    displayName: 'مؤمن السيد (مسؤول النظام)',
    email: 'moamen.elsayed.abdelmoamen@gmail.com',
    roles: ['add_restaurants', 'add_captains', 'manage_orders'],
    status: 'active',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
];

export const ROLE_DEFINITIONS: {
  id: AdminRolePermission;
  label: string;
  description: string;
}[] = [
  {
    id: 'add_restaurants',
    label: 'إضافة مطاعم',
    description: 'تسجيل مطاعم جديدة، اعتماد الشركاء، وتعديل بيانات وقوائم المطاعم',
  },
  {
    id: 'add_captains',
    label: 'إضافة كابتن',
    description: 'تسجيل واعتماد كباتن التوصيل الجدد وتوثيق رخصهم ومركباتهم',
  },
  {
    id: 'manage_orders',
    label: 'متابعة الأوردرات',
    description: 'مراقبة حركة الطلبات وإسنادها للكباتن وتحديث الحالات وإلغاء الطلبات',
  },
  {
    id: 'read_only',
    label: 'قراءة البيانات فقط',
    description: 'الاطلاع على التقارير والإحصائيات دون صلاحية التعديل أو الحذف',
  },
];

export const AdminService = {
  /**
   * جلب جميع المسؤولين المسجلين في Firestore في مجموعة admins
   */
  async getAll(): Promise<{ data: AdminAccount[]; isLive: boolean }> {
    if (!isFirebaseConfigured || !db) {
      return { data: localAdminsCache, isLive: false };
    }

    try {
      const colRef = collection(db, COLLECTIONS.ADMINS);
      const q = query(colRef);

      // Protect against network hang/unavailable with a 5s timeout
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout: operating in offline mode')), 5000)
      );

      const snapshot = await Promise.race([fetchPromise, timeoutPromise]);

      if (snapshot.empty) {
        return { data: localAdminsCache, isLive: true };
      }

      const list: AdminAccount[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: docSnap.id,
          name: data.displayName || data.name || data.email?.split('@')[0] || 'مسؤول',
          displayName: data.displayName || data.name || 'مسؤول',
          email: data.email || '',
          roles: Array.isArray(data.roles) ? data.roles : (data.role ? [data.role] : ['manage_orders']),
          status: data.status || (data.emailVerified ? 'active' : 'pending_verification'),
          emailVerified: !!data.emailVerified,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          raw: data,
        });
      });

      localAdminsCache = list;
      return { data: list, isLive: true };
    } catch (error: any) {
      console.warn('Firestore admins read notice (using cached data):', error?.message || error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ADMINS);
      return { data: localAdminsCache, isLive: false };
    }
  },

  /**
   * إضافة مسؤول جديد:
   * 1. إنشاء الحساب في Firebase Auth
   * 2. إرسال بريد إلكتروني لتأكيد تفعيل الحساب
   * 3. حفظ بياناته في Firestore في مجموعة admins
   */
  async createAdmin(params: {
    name: string;
    email: string;
    password: string;
    roles: AdminRolePermission[];
    addedBy?: string;
  }): Promise<{ success: boolean; adminId: string; emailVerificationSent: boolean }> {
    const { name, email, password, roles, addedBy } = params;
    const cleanEmail = email.trim().toLowerCase();
    let createdUid = 'admin_' + Date.now();
    let emailVerificationSent = false;

    // استخدام تطبيق ثانوي لإنشاء المستخدم وإرسال بريد التفعيل دون الخروج من حساب الأدمن الحالي
    if (isFirebaseConfigured && firebaseConfig?.apiKey) {
      const secondaryAppName = `SecondaryAuth_${Date.now()}`;
      let secondaryApp: any = null;
      try {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        // إنشاء المستخدم في Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
        createdUid = userCredential.user.uid;

        // تحديث اسمه
        await updateProfile(userCredential.user, {
          displayName: name,
        });

        // إرسال بريد إلكتروني لتأكيد تفعيل الحساب فوراً
        try {
          await sendEmailVerification(userCredential.user);
          emailVerificationSent = true;
        } catch (verErr) {
          console.warn('Email verification error:', verErr);
          emailVerificationSent = false;
        }
      } catch (authError: any) {
        console.warn('Firebase Auth user creation notice:', authError);
        // إذا كان الحساب موجوداً بالفعل مسبقاً، نستخدم المعرف ونحفظه في Firestore
        if (authError.code === 'auth/email-already-in-use') {
          createdUid = 'existing_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        } else {
          // رمي الخطأ إذا كانت كلمة السر ضعيفة أو البريد خاطئ
          if (authError.code === 'auth/weak-password') {
            throw new Error('كلمة المرور ضعيفة جداً، يرجى إدخال 6 أحرف أو أرقام على الأقل');
          }
          if (authError.code === 'auth/invalid-email') {
            throw new Error('صيغة البريد الإلكتروني غير صحيحة');
          }
        }
      } finally {
        if (secondaryApp) {
          try {
            await deleteApp(secondaryApp);
          } catch (e) {
            // ignore cleanup error
          }
        }
      }
    }

    // 2. حفظ بيانات المسؤول في قاعدة بيانات Firestore الحقيقية في مجموعة admins
    const adminDocData = {
      uid: createdUid,
      name: name.trim(),
      displayName: name.trim(),
      email: cleanEmail,
      roles: roles,
      role: 'admin',
      status: emailVerificationSent ? 'pending_verification' : 'active',
      emailVerified: false,
      verificationEmailSent: emailVerificationSent,
      createdAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
      updatedAt: isFirebaseConfigured && db ? serverTimestamp() : new Date().toISOString(),
      addedBy: addedBy || 'مسؤول النظام',
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTIONS.ADMINS, createdUid);
        await setDoc(docRef, adminDocData, { merge: true });
      } catch (firestoreError) {
        console.error('Failed to save admin in Firestore:', firestoreError);
        handleFirestoreError(firestoreError, OperationType.CREATE, `${COLLECTIONS.ADMINS}/${createdUid}`);
      }
    }

    // تحديث الكاش المحلي
    const newAdminRecord: AdminAccount = {
      id: createdUid,
      uid: createdUid,
      name: name.trim(),
      displayName: name.trim(),
      email: cleanEmail,
      roles: roles,
      status: emailVerificationSent ? 'pending_verification' : 'active',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    localAdminsCache = [newAdminRecord, ...localAdminsCache.filter((a) => a.email !== cleanEmail)];

    return {
      success: true,
      adminId: createdUid,
      emailVerificationSent,
    };
  },

  /**
   * حذف مسؤول من Firestore
   */
  async deleteAdmin(id: string): Promise<void> {
    localAdminsCache = localAdminsCache.filter((a) => a.id !== id && a.uid !== id);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ADMINS, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.ADMINS}/${id}`);
      }
    }
  },

  /**
   * تعديل اسم مسؤول النظام
   */
  async updateAdminName(uid: string, newName: string): Promise<void> {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('الاسم لا يمكن أن يكون فارغاً');

    // 1. تحديث في Firebase Auth إذا كان المستخدم الحالي
    if (auth?.currentUser && auth.currentUser.uid === uid) {
      try {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      } catch (err) {
        console.warn('Firebase updateProfile error:', err);
      }
    }

    // 2. تحديث في Firestore في مجموعة admins
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTIONS.ADMINS, uid);
        await updateDoc(docRef, {
          name: trimmed,
          displayName: trimmed,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.warn('Could not update admin doc in firestore:', error);
      }
    }

    // 3. تحديث الكاش المحلي
    localAdminsCache = localAdminsCache.map((a) =>
      a.uid === uid || a.id === uid ? { ...a, name: trimmed, displayName: trimmed } : a
    );
  },
};
