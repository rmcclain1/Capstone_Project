// mobile/app/login.tsx
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, Text, TextInput,
    StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '@/app/context/auth_context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingApple, setLoadingApple] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

    const router = useRouter();
    const { login, loginWithGoogleFlow, loginWithAppleFlow } = useAuth();

    // Check if Apple Sign-In is available (iOS only)
    useEffect(() => {
        async function checkAppleSignIn() {
            if (Platform.OS === 'ios') {
                const available = await AppleAuthentication.isAvailableAsync();
                setAppleSignInAvailable(available);
            }
        }
        checkAppleSignIn();
    }, []);

    const validateEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

    const handleLogin = async () => {
        setError(null);

        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            console.log('[Login] Attempting login...');
            await login(email, password); // Now throws on error
            console.log('[Login] Success! Navigating to tabs...');
            router.replace('/(tabs)');
        } catch (e: any) {
            console.error('[Login] Error:', e);
            const errorMessage = e?.message || e?.response?.data?.error || 'Sign-in failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setLoadingGoogle(true);
        try {
            console.log('[Login] Attempting Google login...');
            await loginWithGoogleFlow(); // Now throws on error
            console.log('[Login] Google success! Navigating to tabs...');
            router.replace('/(tabs)');
        } catch (e: any) {
            console.error('[Login] Google error:', e);
            const errorMessage = e?.message || e?.response?.data?.error || 'Google sign-in failed.';
            setError(errorMessage);
        } finally {
            setLoadingGoogle(false);
        }
    };

    const handleApple = async () => {
        setError(null);
        setLoadingApple(true);
        try {
            console.log('[Login] Attempting Apple login...');
            await loginWithAppleFlow();
            console.log('[Login] Apple success! Navigating to tabs...');
            router.replace('/(tabs)');
        } catch (e: any) {
            console.error('[Login] Apple error:', e);
            const errorMessage = e?.message || e?.response?.data?.error || 'Apple sign-in failed.';
            setError(errorMessage);
        } finally {
            setLoadingApple(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.select({ ios: 'padding', android: undefined })}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={{ height: 24 }} />
                    <Text style={styles.appName}>Recall App</Text>
                    <View style={{ height: 24 }} />
                    <Text style={styles.h2}>Welcome back</Text>
                    <Text style={styles.sub}>Log in to continue</Text>
                    <View style={{ height: 16 }} />

                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={18} color="#991B1B" style={{ marginRight: 8 }} />
                            <Text style={styles.error}>{error}</Text>
                        </View>
                    ) : null}

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        editable={!loading && !loadingGoogle && !loadingApple}
                    />
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, { marginTop: 12 }]}
                        editable={!loading && !loadingGoogle && !loadingApple}
                        onSubmitEditing={handleLogin}
                        returnKeyType="done"
                    />

                    {/* Forgot Password Link */}
                    <TouchableOpacity
                        onPress={() => router.push('/auth/reset-password')}
                        style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 }}
                        disabled={loading || loadingGoogle || loadingApple}
                    >
                        <Text style={{ color: '#2362FF', fontSize: 14, fontWeight: '600' }}>
                            Forgot password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cta, (loading || loadingGoogle || loadingApple) && { opacity: 0.6 }]}
                        onPress={handleLogin}
                        disabled={loading || loadingGoogle || loadingApple}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.ctaText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.or}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    <TouchableOpacity
                        style={styles.social}
                        onPress={handleGoogle}
                        disabled={loading || loadingGoogle || loadingApple}
                    >
                        {loadingGoogle ? (
                            <ActivityIndicator color="#111827" />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={20} color="#111827" style={{ marginRight: 10 }} />
                                <Text style={styles.socialText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Apple Sign-In Button - Only show on iOS when available */}
                    {appleSignInAvailable ? (
                        <TouchableOpacity
                            style={styles.social}
                            onPress={handleApple}
                            disabled={loading || loadingGoogle || loadingApple}
                        >
                            {loadingApple ? (
                                <ActivityIndicator color="#111827" />
                            ) : (
                                <>
                                    <Ionicons name="logo-apple" size={22} color="#111827" style={{ marginRight: 10 }} />
                                    <Text style={styles.socialText}>Continue with Apple</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.social, { opacity: 0.6 }]} disabled>
                            <Ionicons name="logo-apple" size={22} color="#111827" style={{ marginRight: 10 }} />
                            <Text style={styles.socialText}>Continue with Apple (iOS only)</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.legal}>
                        By clicking continue, you agree to our{' '}
                        <Text style={styles.link} onPress={() => router.push('/TermsOfService')}>
                            Terms of Service
                        </Text>
                        {' '}and Privacy Policy
                    </Text>

                    <TouchableOpacity onPress={() => router.push('/signup')} style={{ marginTop: 16 }}>
                        <Text style={styles.signupText}>
                            Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 32 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'stretch' },
    appName: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#111827' },
    h2: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#111827' },
    sub: { fontSize: 14, textAlign: 'center', color: '#6B7280', marginTop: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    cta: {
        backgroundColor: '#111827',
        borderRadius: 12,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    or: { color: '#9CA3AF', fontSize: 12 },
    social: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    socialText: { fontSize: 16, color: '#111827' },
    legal: { textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 8, lineHeight: 18 },
    link: { color: '#111827', fontWeight: '700', textDecorationLine: 'underline' },
    error: { color: '#991B1B', flexShrink: 1, fontSize: 14 },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        marginBottom: 12,
    },
    signupText: { textAlign: 'center', fontSize: 14, color: '#6B7280' },
    signupLink: { fontWeight: '700', color: '#111827' },
});
