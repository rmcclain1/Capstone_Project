// mobile/api/auth.ts
import { signInWithGoogleAndGetFirebaseIdToken } from '@/lib/google';
import {
  firebaseSignInWithEmail,
  firebaseSignUpWithEmail,
  firebaseSendReset,
  firebaseUpdatePassword,
} from '@/lib/emailPassword';
import { postToRails, clearRailsJwt, getRailsJwt } from '@/api/session';

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
