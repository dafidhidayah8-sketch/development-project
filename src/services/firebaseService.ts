import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import type { AppState } from './storageService';

const env = import.meta.env;

export interface FirebaseRuntimeConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseConnection {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  user: User;
  config: FirebaseRuntimeConfig;
}

const requiredKeys = ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID'] as const;

export function getFirebaseConfig(): FirebaseRuntimeConfig | null {
  const values = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  return requiredKeys.every(key => Boolean(env[key])) ? values : null;
}

let connectionPromise: Promise<FirebaseConnection> | null = null;

export async function connectFirebase(): Promise<FirebaseConnection> {
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const config = getFirebaseConfig();
    if (!config) {
      throw new Error('Konfigurasi Firebase belum lengkap. Isi VITE_FIREBASE_* pada environment aplikasi.');
    }

    const app = getApps()[0] || initializeApp(config);
    const auth = getAuth(app);
    let db: Firestore;

    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }

    const credential = auth.currentUser || (await signInAnonymously(auth)).user;
    if (!credential) throw new Error('Firebase Authentication gagal membuat sesi pengguna.');

    return { app, auth, db, user: credential, config };
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

function snapshotPath(uid: string) {
  return doc((globalThis as any).__DEV_FIREBASE_DB as Firestore, 'users', uid, 'snapshots', 'current');
}

export async function saveCloudSnapshot(state: AppState): Promise<void> {
  const connection = await connectFirebase();
  const { syncQueue: _syncQueue, integrationConfig: _integrationConfig, ...cloudState } = state;
  await setDoc(
    doc(connection.db, 'users', connection.user.uid, 'snapshots', 'current'),
    {
      ...cloudState,
      schemaVersion: 2,
      updatedAt: serverTimestamp(),
      updatedAtClient: new Date().toISOString(),
    },
    { merge: false },
  );
}

export async function loadCloudSnapshot(): Promise<AppState | null> {
  const connection = await connectFirebase();
  const snap = await getDoc(doc(connection.db, 'users', connection.user.uid, 'snapshots', 'current'));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!Array.isArray(data.projects)) return null;
  return {
    ...data,
    syncQueue: [],
    integrationConfig: {
      google: { status: 'CONNECTED', firebaseProject: connection.config.projectId, lastSync: new Date().toISOString() },
      github: { status: 'NOT_CONFIGURED' },
      cloudflare: { status: 'NOT_CONFIGURED' },
      whatsapp: { manualModeAvailable: true, apiStatus: 'NOT_CONFIGURED' },
    },
  } as AppState;
}

export async function testFirebaseConnection(): Promise<{ projectId: string; uid: string }> {
  const connection = await connectFirebase();
  await setDoc(
    doc(connection.db, 'users', connection.user.uid, 'health', 'connection'),
    { checkedAt: serverTimestamp(), clientCheckedAt: new Date().toISOString() },
    { merge: true },
  );
  return { projectId: connection.config.projectId, uid: connection.user.uid };
}
