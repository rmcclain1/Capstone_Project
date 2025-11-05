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
        const cred = await signInWithPopup(auth, provider);
        const idToken = await cred.user.getIdToken();
        if (!idToken) throw new Error('No Firebase ID token (web)');
        return idToken;
    }

    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const redirectUri = AuthSession.makeRedirectUri();
    const request = new AuthSession.AuthRequest({
        clientId: Platform.OS === 'ios' ? CFG.GOOGLE_IOS_CLIENT_ID : CFG.GOOGLE_ANDROID_CLIENT_ID,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { scope: 'openid email profile' },
        redirectUri,
    });

    await request.makeAuthUrlAsync(discovery);

    // Typings sometimes miss startAsync; cast to any to satisfy TS.
    const startAsync = (AuthSession as any).startAsync as (args: { authUrl: string }) => Promise<any>;
    const res = await startAsync({ authUrl: request.url! });

    if (res?.type !== 'success' || !res?.params?.id_token) {
        throw new Error('Google sign-in canceled or failed');
    }

    const googleIdToken = res.params.id_token as string;
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const cred = await signInWithCredential(auth, credential);
    const firebaseIdToken = await cred.user.getIdToken();
    if (!firebaseIdToken) throw new Error('No Firebase ID token (native)');
    return firebaseIdToken;
}
