// app/auth/forgot-password.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sendPasswordReset } from '@/api/auth';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const validateEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

    const handleSendResetEmail = async () => {
        setError(null);

        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            console.log('[ForgotPassword] Sending reset email to:', email);
            const result = await sendPasswordReset(email);

            if (!result.ok) {
                setError(result.reason || 'Failed to send reset email.');
                return;
            }

            Alert.alert(
                'Email Sent! ✓',
                `Password reset instructions have been sent to:\n\n${email}\n\nCheck your inbox and follow the link to reset your password.`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (e: any) {
            console.error('[ForgotPassword] Error:', e);
            setError(e?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.select({ ios: 'padding', android: undefined, web: undefined })}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            hitSlop={12}
                            onPress={() => router.back()}
                            disabled={loading}
                            style={styles.backButton}
                        >
                            <Ionicons name="chevron-back" size={26} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Reset Password</Text>
                        <View style={{ width: 26 }} />
                    </View>

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-closed-outline" size={48} color="#2563EB" />
                        </View>
                    </View>

                    {/* Main Content */}
                    <View style={styles.content}>
                        <Text style={styles.heading}>Forgot Your Password?</Text>

                        <Text style={styles.description}>
                            Enter your email address and we'll send you a link to reset your password.
                        </Text>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={18} color="#991B1B" style={{ marginRight: 8 }} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TextInput
                            placeholder="Email address"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError(null);
                            }}
                            style={styles.input}
                            editable={!loading}
                            onSubmitEditing={handleSendResetEmail}
                            returnKeyType="send"
                        />

                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>What happens next:</Text>
                            <View style={styles.step}>
                                <Text style={styles.stepNumber}>1</Text>
                                <Text style={styles.stepText}>
                                    We'll send a password reset link to your email
                                </Text>
                            </View>
                            <View style={styles.step}>
                                <Text style={styles.stepNumber}>2</Text>
                                <Text style={styles.stepText}>
                                    Click the link in your email
                                </Text>
                            </View>
                            <View style={styles.step}>
                                <Text style={styles.stepNumber}>3</Text>
                                <Text style={styles.stepText}>
                                    Create a new password and sign in
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSendResetEmail}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="mail" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Send Reset Link</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.helpText}>
                            The link will expire in 1 hour for security.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backToLogin}
                            disabled={loading}
                        >
                            <Ionicons name="arrow-back" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                            <Text style={styles.backToLoginText}>Back to login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#F5F3FA',
    },
    container: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        marginVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#DBEAFE',
    },
    content: {
        paddingHorizontal: 24,
    },
    heading: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        marginBottom: 16,
    },
    errorText: {
        color: '#991B1B',
        flexShrink: 1,
        fontSize: 14,
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
        marginBottom: 24,
        backgroundColor: '#fff',
    },
    infoBox: {
        backgroundColor: '#F0F9FF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginBottom: 24,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 12,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2563EB',
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 24,
    },
    stepText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    button: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 56,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    helpText: {
        fontSize: 13,
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 16,
        fontStyle: 'italic',
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        paddingVertical: 12,
    },
    backToLoginText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2563EB',
    },
});
