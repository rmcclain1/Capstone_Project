// mobile/lib/firebase.web.ts
import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { CFG } from '@/lib/config';

// Hard-fail if any required field is missing
function assertNonEmpty(name: string, v: unknown) {
    if (!v || String(v).trim() === '') {
        throw new Error(`[firebase.web] Missing config value: ${name}`);
    }
}

const firebaseConfig = {
    apiKey: CFG.FIREBASE_API_KEY,
    authDomain: CFG.FIREBASE_AUTH_DOMAIN,
    projectId: CFG.FIREBASE_PROJECT_ID,
    storageBucket: CFG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: CFG.FIREBASE_MESSAGING_SENDER_ID,
    appId: CFG.FIREBASE_APP_ID,
    ...(CFG.FIREBASE_MEASUREMENT_ID ? { measurementId: CFG.FIREBASE_MEASUREMENT_ID } : {}),
};

// Validate required fields so we catch it before Firebase throws "invalid-api-key"
assertNonEmpty('FIREBASE_API_KEY', firebaseConfig.apiKey);
assertNonEmpty('FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain);
assertNonEmpty('FIREBASE_PROJECT_ID', firebaseConfig.projectId);
assertNonEmpty('FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket);
assertNonEmpty('FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId);
assertNonEmpty('FIREBASE_APP_ID', firebaseConfig.appId);

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
