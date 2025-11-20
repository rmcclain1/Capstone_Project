import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { signup } from '@/api/users';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const onSubmit = async () => {
        if (!username || !email || !password || !confirm) {
            Alert.alert('Missing info', 'Please fill in all fields.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            Alert.alert('Invalid email', 'Please enter a valid email.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Weak password', 'Use at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            Alert.alert('Mismatch', 'Passwords do not match.');
            return;
        }
        try {
            setLoading(true);
            await signup({
                username,
                email,
                password,
                password_confirmation: confirm,
            });
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>Create your account</Text>
                <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
                <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <View style={styles.passwordWrapper}>
                    <TextInput style={styles.passwordInput} placeholder="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />

                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.question}>?</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.passwordWrapper}>
                    <TextInput style={styles.passwordInput} placeholder="Confirm password" secureTextEntry={!showConfirm} value={confirm} onChangeText={setConfirm} />

                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        <Text style={styles.question}>?</Text>
                    </TouchableOpacity>
                </View>

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

    signupText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#6B7280', 
    },
    signupLink: {
        fontWeight: '700',
        color: '#111827', 
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    question: {
        fontSize: 20,
        paddingHorizontal: 6,
        color: '#6B7280',
        fontWeight: '700',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 8,
    },
});
