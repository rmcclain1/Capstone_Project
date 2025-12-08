// lib/config.ts
let localEnv: any = {};
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    localEnv = require('../env.local.json');
} catch {
    localEnv = {};
}

type EnvJson = {
    google?: { webClientId?: string; iosClientId?: string; androidClientId?: string };
    firebase?: {
        apiKey?: string; authDomain?: string; projectId?: string; storageBucket?: string;
        messagingSenderId?: string; appId?: string; measurementId?: string;
    };
    api?: { webBaseUrl?: string; lanBaseUrl?: string };
};

const cfg: EnvJson = (localEnv as EnvJson) || {};

export const CFG = {
    GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? cfg.google?.webClientId ?? '',
    GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? cfg.google?.iosClientId ?? '',
    GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? cfg.google?.androidClientId ?? '',

    FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? cfg.firebase?.apiKey ?? '',
    FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? cfg.firebase?.authDomain ?? '',
    FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? cfg.firebase?.projectId ?? '',
    FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? cfg.firebase?.storageBucket ?? '',
    FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? cfg.firebase?.messagingSenderId ?? '',
    FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? cfg.firebase?.appId ?? '',
    FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? cfg.firebase?.measurementId ?? '',

    API_URL_WEB: process.env.EXPO_PUBLIC_API_URL_WEB ?? cfg.api?.webBaseUrl ?? 'http://localhost:3000',
    API_URL_LAN: process.env.EXPO_PUBLIC_API_URL_LAN ?? cfg.api?.lanBaseUrl ?? 'http://10.0.2.2:3000',
} as const;
