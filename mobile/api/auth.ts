// mobile/api/auth.ts
import { signInWithGoogleAndGetFirebaseIdToken } from '@/lib/google';
import {
  firebaseSignInWithEmail,
  firebaseSignUpWithEmail,
  firebaseSendReset,
  firebaseUpdatePassword,
} from '@/lib/emailPassword';
import { postToRails, clearRailsJwt, getRailsJwt } from '@/api/session';

export async function loginWithGoogle(): Promise<{ ok: boolean; user?: Record<string, any> }> {
  const firebaseIdToken = await signInWithGoogleAndGetFirebaseIdToken();
  const session = await postToRails(firebaseIdToken);
  return { ok: session.ok, user: session.user };
}

export async function loginWithEmailPassword(email: string, password: string) {
  const { idToken } = await firebaseSignInWithEmail(email, password);
  const session = await postToRails(idToken);
  return { ok: session.ok, user: session.user };
}

export async function signupWithEmailPassword(email: string, password: string) {
  const { idToken } = await firebaseSignUpWithEmail(email, password);
  const session = await postToRails(idToken);
  return { ok: session.ok, user: session.user };
}

export async function sendPasswordReset(email: string) {
  await firebaseSendReset(email);
  return { ok: true };
}

export async function changePassword(newPassword: string) {
  await firebaseUpdatePassword(newPassword);
  return { ok: true };
}

export async function getSessionToken(): Promise<string | null> {
  return await getRailsJwt();
}

export async function logout(): Promise<void> {
  await clearRailsJwt();
}
