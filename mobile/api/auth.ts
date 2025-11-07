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
type Result<T> = Ok<T> | Err;

// --- Helpers -------------------------------------------------------------

function friendlyFirebaseMessage(code?: string): string {
  switch (code) {
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters.';
    case 'auth/email-already-in-use':
      return 'That email is already in use. Try signing in instead.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was canceled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Try to extract a human-friendly message from any Rails/HTTP-ish object.
 * Works with shapes like:
 *   { ok:false, status:422, error:"msg" }
 *   { ok:false, status:401, response:{ data:{ error:"msg"} } }
 *   { ok:false, data:{ error:"msg"} }
 *   { ok:false, message:"msg" }
 */
function extractRailsErrorDetail(session: unknown): { status?: number; detail?: string } {
  const s = session as any;
  const status: number | undefined =
    s?.status ?? s?.response?.status ?? (typeof s?.code === 'number' ? s.code : undefined);

  const detail =
    s?.error ??
    s?.message ??
    s?.data?.error ??
    s?.response?.data?.error ??
    s?.response?.data?.message ??
    s?.data ??
    s?.response?.data ??
    undefined;

  // stringify non-strings
  const detailStr = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : undefined;
  return { status, detail: detailStr };
}

function friendlyRailsMessage(status?: number, detail?: string): string {
  if (status === 401) return 'Authentication failed on the server.';
  if (status === 403) return 'You are not allowed to sign in.';
  if (status === 422) return detail || 'Invalid data.';
  if (status && status >= 500) return 'Server is unavailable. Try again later.';
  return detail || 'Unexpected server response.';
}

// --- API -----------------------------------------------------------------

export async function loginWithGoogle(): Promise<Result<Record<string, any>>> {
  try {
    const firebaseIdToken = await signInWithGoogleAndGetFirebaseIdToken();
    const session = await postToRails(firebaseIdToken);
    if (!session.ok) {
      const { status, detail } = extractRailsErrorDetail(session);
      return { ok: false, reason: friendlyRailsMessage(status, detail) };
    }
    return { ok: true, user: session.user };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<Result<Record<string, any>>> {
  try {
    const { idToken } = await firebaseSignInWithEmail(email, password);
    const session = await postToRails(idToken);
    if (!session.ok) {
      const { status, detail } = extractRailsErrorDetail(session);
      return { ok: false, reason: friendlyRailsMessage(status, detail) };
    }
    return { ok: true, user: session.user };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

export async function signupWithEmailPassword(
  email: string,
  password: string
): Promise<Result<Record<string, any>>> {
  try {
    const { idToken } = await firebaseSignUpWithEmail(email, password);
    const session = await postToRails(idToken);
    if (!session.ok) {
      const { status, detail } = extractRailsErrorDetail(session);
      return { ok: false, reason: friendlyRailsMessage(status, detail) };
    }
    return { ok: true, user: session.user };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

export async function sendPasswordReset(email: string): Promise<Ok<true> | Err> {
  try {
    await firebaseSendReset(email);
    return { ok: true, user: true };
  } catch (e: any) {
    return { ok: false, reason: friendlyFirebaseMessage(e?.code), code: e?.code };
  }
}

export async function changePassword(newPassword: string): Promise<Ok<true> | Err> {
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
