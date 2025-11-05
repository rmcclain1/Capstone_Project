import React, { useState } from 'react';
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, Text, TextInput,
    StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useAuth } from "@/app/context/auth_context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { loginWithGoogle } from '@/api/auth';

export default function LoginScreen() {
    const [username, setUsername] = useState(''); // treated as email
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        try {
            await login(username, password);
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Login Failed', e?.response?.data?.error ?? e?.message ?? 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            setLoadingGoogle(true);
            const res = await loginWithGoogle();
            if (res?.ok) router.replace('/(tabs)');
            else Alert.alert('Google Sign-In', 'Could not authenticate with Google.');
        } catch (e: any) {
            Alert.alert('Google Sign-In Failed', e?.message ?? 'Unknown error');
        } finally {
            setLoadingGoogle(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={{ height: 24 }} />
                    <Text style={styles.appName}>Recall App</Text>
                    <View style={{ height: 24 }} />
                    <Text style={styles.h2}>Welcome back</Text>
                    <Text style={styles.sub}>Log in to continue</Text>
                    <View style={{ height: 16 }} />

                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, { marginTop: 12 }]}
                        autoFocus
                    />

                    {loading ? (
                        <ActivityIndicator size="large" color="#6E56CF" />
                    ) : (
                        <TouchableOpacity style={styles.cta} onPress={handleLogin} disabled={loadingGoogle}>
                            <Text style={styles.ctaText}>Continue</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.or}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    <TouchableOpacity style={styles.social} onPress={handleGoogle} disabled={loading || loadingGoogle}>
                        {loadingGoogle ? (
                            <ActivityIndicator />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={20} color="#111827" style={{ marginRight: 10 }} />
                                <Text style={styles.socialText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.social} disabled>
                        <Ionicons name="logo-apple" size={22} color="#111827" style={{ marginRight: 10 }} />
                        <Text style={styles.socialText}>Continue with Apple (dev build)</Text>
                    </TouchableOpacity>

                    <Text style={styles.legal}>
                        By clicking continue, you agree to our <Text style={styles.link}>Terms of Service</Text>{' '}
                        and <Text style={styles.link}>Privacy Policy</Text>
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/signup')} style={{ marginTop: 16 }}>
                        <Text style={styles.signupText}>
                            Don’t have an account? <Text style={styles.signupLink}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 32 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// styles unchanged from your file
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'stretch' },
    appName: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#111827' },
    h2: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#111827' },
    sub: { fontSize: 14, textAlign: 'center', color: '#6B7280', marginTop: 6 },
    input: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#111827', marginBottom: 12,
    },
    cta: {
        backgroundColor: '#111827', borderRadius: 12, height: 48,
        alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    or: { color: '#9CA3AF', fontSize: 12 },
    social: {
        flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12,
        backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
        paddingHorizontal: 14, marginBottom: 12,
    },
    socialText: { fontSize: 16, color: '#111827' },
    legal: { textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 8, lineHeight: 18 },
    link: { color: '#111827', fontWeight: '700', textDecorationLine: 'underline' },
    error: { color: '#b91c1c', textAlign: 'center', marginTop: 8 },
    sheet: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: '#F8F9FB',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 24, paddingHorizontal: 16, paddingTop: 8,
    },
    grabberWrap: { alignItems: 'center', paddingVertical: 6 },
    grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 4 },
    sheetSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 8 },
    sheetCancelBtn: {
        marginTop: 10, height: 48, borderRadius: 12,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
        alignItems: 'center', justifyContent: 'center',
    },
    sheetCancelText: { color: '#111827', fontSize: 16, fontWeight: '700' },
    signupText: { textAlign: 'center', fontSize: 14, color: '#6B7280' },
    signupLink: { fontWeight: '700', color: '#111827' },
});
