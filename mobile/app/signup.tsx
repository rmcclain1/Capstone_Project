// mobile/app/signup.tsx
import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { signUpWithEmailPassword } from '@/api/auth';

export default function SignUp() {
    const [username, setUsername] = useState(''); // optional display handle (Rails-side only)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

    const onSubmit = async () => {
        setError(null);

        if (!email || !password || !confirm) {
            setError('Please fill in all fields.');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 8) {
            setError('Use at least 8 characters for your password.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            const res = await signUpWithEmailPassword(email, password);
            if (!res?.ok) {
                const reason = (res as any)?.reason || 'Sign up failed. Please try again.';
                setError(reason);
                return;
            }
            router.replace('/login');
        } catch (e: any) {
            setError(e?.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Create your account</Text>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.error}>{error}</Text>
                    </View>
                ) : null}

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password (min 8 chars)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    secureTextEntry
                    value={confirm}
                    onChangeText={setConfirm}
                />

                <Text style={styles.legal}>
                    By creating an account you agree to our{' '}
                    <Text style={styles.signupLink} onPress={() => router.push('/TermsOfService')}>
                        Terms of Service
                    </Text>
                    .
                </Text>

                <TouchableOpacity style={[styles.cta, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Sign up</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 16 }}>
                    <Text style={styles.signupText}>
                        Already have an account? <Text style={styles.signupLink}>Log in</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 24, gap: 12 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    cta: { backgroundColor: '#111827', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },
    signupText: { textAlign: 'center', fontSize: 14, color: '#6B7280' },
    signupLink: { fontWeight: '700', color: '#111827' },

   
    errorBox: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    error: { color: '#991B1B' },
    legal: { textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 4 },
});
