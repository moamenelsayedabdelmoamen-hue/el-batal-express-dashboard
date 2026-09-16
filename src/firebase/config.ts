import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setLogLevel,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Silence non-fatal WebChannel connection retry notices
setLogLevel('error');

// Firebase configuration loaded from provisioned firebase-applet-config.json
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseAppletConfig as Record<string, any>).firestoreDatabaseId || undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId,
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

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Configure Firestore with long-polling and multi-tab local persistence
  // experimentalForceLongPolling completely prevents duplex HTTP/2 WebChannel stream failures in sandboxed iframe/proxy environments.
  const firestoreSettings = {
    experimentalForceLongPolling: true,
    localCache: typeof window !== 'undefined'
      ? persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        })
      : undefined,
  };

  try {
    db = firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, firestoreSettings);
  } catch {
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }

  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error);
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = null;
  try {
    db = firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
  storage = getStorage(app);
}

// Google Workspace OAuth Scopes
export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

export const googleProvider = new GoogleAuthProvider();
GOOGLE_WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Graceful Firestore Connection check
export async function testConnection(): Promise<boolean> {
  if (!db || !isFirebaseConfigured) return false;
  try {
    const snap = await getDoc(doc(db, 'test', 'connection'));
    return snap.exists();
  } catch {
    // Expected when unauthenticated or offline - app continues safely with resilient cache
    return false;
  }
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
    msg.includes('unavailable') ||
    msg.includes('The operation could not be completed');

  const isUnauthenticated =
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions');

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
  } else if (isUnauthenticated) {
    console.info('Awaiting authentication for path:', path);
  } else {
    console.error('Firestore Error Logged:', JSON.stringify(errInfo));
  }
  return errInfo;
}
