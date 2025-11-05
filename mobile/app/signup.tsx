import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { signupWithEmailPassword } from '@/api/auth';

export default function SignUp() {
    const [username, setUsername] = useState(''); // optional display handle (Rails-side only)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (!email || !password || !confirm) return Alert.alert('Missing info', 'Please fill in all fields.');
        if (!/^\S+@\S+\.\S+$/.test(email)) return Alert.alert('Invalid email', 'Please enter a valid email.');
        if (password.length < 8) return Alert.alert('Weak password', 'Use at least 8 characters.');
        if (password !== confirm) return Alert.alert('Mismatch', 'Passwords do not match.');

        try {
            setLoading(true);
            const res = await signupWithEmailPassword(email, password);
            if (!res?.ok) throw new Error('Signup failed');
            Alert.alert('Success', 'Account created! Please log in.');
            router.replace('/login');
        } catch (e: any) {
            Alert.alert('Sign up failed', String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Create your account</Text>
                <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
                <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
                <TextInput style={styles.input} placeholder="Confirm password" secureTextEntry value={confirm} onChangeText={setConfirm} />

                <TouchableOpacity style={styles.cta} onPress={onSubmit} disabled={loading}>
                    <Text style={styles.ctaText}>{loading ? 'Creating...' : 'Sign up'}</Text>
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
});
