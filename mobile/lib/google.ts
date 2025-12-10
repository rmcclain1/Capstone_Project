import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CFG } from '@/lib/config';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogleAndGetFirebaseIdToken(): Promise<string> {
    if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        const cred = await signInWithPopup(auth, provider);
        const idToken = await cred.user.getIdToken(true); // Force refresh
        if (!idToken) throw new Error('No Firebase ID token (web)');
        return idToken;
    }

    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const redirectUri = AuthSession.makeRedirectUri();
    console.log('[Google] Using redirect URI:', redirectUri);

    const request = new AuthSession.AuthRequest({
        clientId: Platform.OS === 'ios' ? CFG.GOOGLE_IOS_CLIENT_ID : CFG.GOOGLE_ANDROID_CLIENT_ID,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: {
            scope: 'openid email profile',
            prompt: 'select_account', // Always show account picker
        },
        redirectUri,
    });

    await request.makeAuthUrlAsync(discovery);

    // Typings sometimes miss startAsync; cast to any to satisfy TS.
    const startAsync = (AuthSession as any).startAsync as (args: { authUrl: string }) => Promise<any>;
    const res = await startAsync({ authUrl: request.url! });

    console.log('[Google] Auth session result:', res?.type);

    if (res?.type !== 'success' || !res?.params?.id_token) {
        if (res?.type === 'cancel') {
            throw new Error('Google sign-in was canceled');
        }
        throw new Error('Google sign-in failed or was canceled');
    }

    const googleIdToken = res.params.id_token as string;
    const credential = GoogleAuthProvider.credential(googleIdToken);

    // Sign in with retry logic
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const cred = await signInWithCredential(auth, credential);
            const firebaseIdToken = await cred.user.getIdToken(true); // Force refresh
            if (!firebaseIdToken) throw new Error('No Firebase ID token (native)');
            console.log('[Google] Successfully obtained Firebase ID token');
            return firebaseIdToken;
        } catch (e: any) {
            lastError = e;
            console.error(`[Google] Attempt ${attempt + 1} failed:`, e.message);
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            }
        }
    }

    throw lastError || new Error('Failed to sign in with Google after multiple attempts');
}
