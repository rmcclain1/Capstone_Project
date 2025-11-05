// mobile/lib/emailPassword.ts
import { auth } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
} from 'firebase/auth';

export async function firebaseSignUpWithEmail(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const idToken = await cred.user.getIdToken();
    return { user: cred.user, idToken };
}

export async function firebaseSignInWithEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const idToken = await cred.user.getIdToken();
    return { user: cred.user, idToken };
}

export async function firebaseSendReset(email: string) {
    return sendPasswordResetEmail(auth, email.trim());
}

export async function firebaseUpdatePassword(newPassword: string) {
    if (!auth.currentUser) throw new Error('No authenticated user');
    return updatePassword(auth.currentUser, newPassword);
}
