import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration for El Batal Express (el-batal-express-956ae)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAsXpoAY4bhwE6krsdCcBKrUMw7SHnb7Xc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'el-batal-express-956ae.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://el-batal-express-956ae-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'el-batal-express-956ae',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'el-batal-express-956ae.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '877386066216',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:877386066216:web:c08c681e0c2d7563cd081d',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-WP7JQQE26B',
};

// Check if Firebase is fully configured with a valid Google/Firebase API key
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length > 20 &&
  firebaseConfig.apiKey.startsWith('AIza') &&
  !firebaseConfig.apiKey.includes('Placeholder')
);

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore;
let storage: FirebaseStorage;

function initFirestoreInstance(targetApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(targetApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // If already initialized or persistent cache not supported in environment
    return getFirestore(targetApp);
  }
}

try {
  if (isFirebaseConfigured) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    try {
      auth = getAuth(app);
    } catch (authErr) {
      console.warn('Firebase Auth initialization warning:', authErr);
      auth = null;
    }
    db = initFirestoreInstance(app);
    storage = getStorage(app);
  } else {
    // When apiKey is not configured in the preview environment, initialize app without apiKey
    // to prevent Firebase Auth from throwing "auth/invalid-api-key"
    app = getApps().length
      ? getApp()
      : initializeApp({
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
          storageBucket: firebaseConfig.storageBucket,
        });
    auth = null;
    db = initFirestoreInstance(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
  if (!getApps().length) {
    app = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    app = getApp();
  }
  auth = null;
  db = initFirestoreInstance(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

// Skill standard: Firestore Error handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth?.currentUser;
  const msg = error instanceof Error ? error.message : String(error);
  const isNetworkOffline =
    msg.includes('Could not reach Cloud Firestore backend') ||
    msg.includes('offline') ||
    msg.includes('unavailable');

  const errInfo: FirestoreErrorInfo = {
    error: msg,
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
    },
    operationType,
    path,
  };

  if (isNetworkOffline) {
    // Firestore operates automatically in offline cache mode during network latency or reconnection
    console.info('Firestore offline/reconnecting mode active:', path);
  } else {
    console.error('Firestore Error Logged:', JSON.stringify(errInfo));
  }
  return errInfo;
}
