/**
 * El Batal Express - Admin Custom Claims Setup Script
 *
 * هذا السكريبت يُستخدم لتعيين صلاحية مدير النظام (role = admin) لمستخدم معين
 * باستخدام Firebase Admin SDK.
 *
 * طريقة التشغيل:
 * 1. قم بتحميل ملف Service Account JSON من Firebase Console -> Project Settings -> Service Accounts
 * 2. احفظ الملف باسم `serviceAccountKey.json` بجانب هذا السكريبت.
 * 3. شغّل الأمر:
 *    node scripts/set-admin-claim.js user@elbatalexpress.com
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ تنبيه: لم يتم العثور على ملف serviceAccountKey.json');
  console.log('يرجى تنزيله من Firebase Console ووضعه في مجلد scripts/');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'el-batal-express-956ae',
});

async function grantAdminRole(emailOrUid) {
  try {
    let userRecord;
    if (emailOrUid.includes('@')) {
      userRecord = await admin.auth().getUserByEmail(emailOrUid);
    } else {
      userRecord = await admin.auth().getUser(emailOrUid);
    }

    console.log(`🔍 تم العثور على المستخدم: ${userRecord.email} (${userRecord.uid})`);

    // Set Custom Claims: role: 'admin' and admin: true
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      admin: true,
    });

    // Also record in admins collection in Firestore for auditing
    const db = admin.firestore();
    await db.collection('admins').doc(userRecord.uid).set(
      {
        email: userRecord.email,
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ تم تعيين صلاحية Admin بنجاح للمستخدم: ${userRecord.email}`);
    console.log('ملاحظة: إذا كان المستخدم مسجلاً دخوله بالفعل، يرجى تسجيل الخروج وإعادة الدخول لتحديث الـ Token.');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تعيين الصلاحية:', error);
  } finally {
    process.exit(0);
  }
}

const targetUser = process.argv[2];
if (!targetUser) {
  console.log('الاستخدام: node scripts/set-admin-claim.js <USER_EMAIL_OR_UID>');
  process.exit(1);
}

grantAdminRole(targetUser);
