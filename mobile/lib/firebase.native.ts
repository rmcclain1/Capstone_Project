import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CFG } from '@/lib/config';

const firebaseConfig = {
    apiKey: CFG.FIREBASE_API_KEY,
    authDomain: CFG.FIREBASE_AUTH_DOMAIN,
    projectId: CFG.FIREBASE_PROJECT_ID,
    storageBucket: CFG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: CFG.FIREBASE_MESSAGING_SENDER_ID,
    appId: CFG.FIREBASE_APP_ID,
    measurementId: CFG.FIREBASE_MEASUREMENT_ID || undefined,
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeAuth, getReactNativePersistence } = require('firebase/auth/react-native');
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
    auth = getAuth(app);
}

export { auth };
