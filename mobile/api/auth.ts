// mobile/api/auth.ts
import { signInWithGoogleAndGetFirebaseIdToken } from '@/lib/google';
import {
  firebaseSignInWithEmail,
  firebaseSignUpWithEmail,
  firebaseSendReset,
  firebaseUpdatePassword,
} from '@/lib/emailPassword';
import { postToRails, clearRailsJwt, getRailsJwt } from '@/api/session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import http from '@/lib/http';
import * as SecureStore from 'expo-secure-store';

type Ok<T> = { ok: true; user?: T };
type Err = { ok: false; reason: string; code?: string };
export type Result<T> = Ok<T> | Err;

const FRIENDLY_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/weak-password': 'Password is too weak.',
};

function friendlyFirebaseMessage(code?: string): string {
  if (!code) return 'Authentication failed. Please try again.';
  return FRIENDLY_MESSAGES[code] || 'Authentication failed. Please try again.';
}

// Email/password login
export async function loginWithEmailPassword(email: string, password: string): Promise<Result<any>> {
  try {
    const { idToken } = await firebaseSignInWithEmail(email, password);
    const session = await postToRails(idToken);
    if (!session.ok) {
      return { ok: false, reason: session.error || 'Server rejected login' };
    }
    return { ok: true, user: session.user };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

// Google sign-in
export async function loginWithGoogle(): Promise<Result<any>> {
  try {
    const idToken = await signInWithGoogleAndGetFirebaseIdToken();
    const session = await postToRails(idToken);
    if (!session.ok) {
      return { ok: false, reason: session.error || 'Server rejected login' };
    }
    return { ok: true, user: session.user };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

// Apple sign-in
export async function loginWithApple(): Promise<Result<any>> {
  try {
    // Only available on iOS
    if (Platform.OS !== 'ios') {
      return { ok: false, reason: 'Apple Sign-In is only available on iOS' };
    }

    // Check if Apple Sign-In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { ok: false, reason: 'Apple Sign-In is not available on this device' };
    }

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('[Apple Sign-In] Got credential:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
    });

    // Send to Rails backend
    const response = await http.post('/api/v1/sessions/apple', {
      identity_token: credential.identityToken,
      user_info: {
        email: credential.email,
        name: credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : undefined,
      },
    });

    if (!response.data?.ok) {
      return { ok: false, reason: response.data?.error || 'Apple sign-in failed' };
    }

    // Store the Rails JWT
    const token = response.data.token;
    if (token) {
      await SecureStore.setItemAsync('rails_jwt', token);
    }

    return { ok: true, user: response.data.user };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, reason: 'Sign-in was canceled' };
    }
    console.error('[Apple Sign-In] Error:', e);
    return { ok: false, reason: e?.message || 'Apple sign-in failed' };
  }
}

// Email/password signup
export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<Result<any>> {
  try {
    const { idToken } = await firebaseSignUpWithEmail(email, password);
    const session = await postToRails(idToken);
    if (!session.ok) {
      return { ok: false, reason: session.error || 'Server rejected signup' };
    }
    return { ok: true, user: session.user };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

// Password reset email
export async function sendPasswordReset(email: string): Promise<Result<boolean>> {
  try {
    await firebaseSendReset(email);
    return { ok: true, user: true };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

// In-app password update (after re-auth)
export async function updatePassword(newPassword: string): Promise<Result<boolean>> {
  try {
    await firebaseUpdatePassword(newPassword);
    return { ok: true, user: true };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

export async function getSessionToken(): Promise<string | null> {
  return await getRailsJwt();
}

export async function logout(): Promise<void> {
  await clearRailsJwt();
}
