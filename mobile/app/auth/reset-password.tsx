// app/(auth)/reset-password.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/app/context/auth_context";
import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const BG = '#F5F3FA';

export default function ResetPassword() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSendResetEmail = async () => {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser || !currentUser.email) {
            Alert.alert('Error', 'No email associated with this account');
            return;
        }

        Alert.alert(
            'Reset Password',
            `We'll send password reset instructions to:\n\n${currentUser.email}\n\nYou'll be able to create a new password through the email link.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Email',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await sendPasswordResetEmail(auth, currentUser.email!);

                            Alert.alert(
                                'Email Sent! ✓',
                                `Password reset instructions have been sent to:\n\n${currentUser.email}\n\nCheck your inbox and follow the link to reset your password.`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => router.back()
                                    }
                                ]
                            );
                        } catch (error: any) {
                            console.error('Password reset error:', error);

                            let errorMessage = 'Failed to send reset email. Please try again.';

                            if (error.code === 'auth/too-many-requests') {
                                errorMessage = 'Too many requests. Please wait a few minutes and try again.';
                            } else if (error.code === 'auth/user-not-found') {
                                errorMessage = 'No account found with this email.';
                            } else if (error.code === 'auth/invalid-email') {
                                errorMessage = 'Invalid email address.';
                            }

                            Alert.alert('Error', errorMessage);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Pressable hitSlop={12} onPress={() => router.back()} disabled={loading}>
                    <Ionicons name="chevron-back" size={26} color="#1A1523" />
                </Pressable>
                <Text style={styles.title}>Reset Password</Text>
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed-outline" size={48} color="#2563EB" />
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <Text style={styles.heading}>Secure Password Reset</Text>

                <Text style={styles.description}>
                    We'll send you a secure link to reset your password via email.
                </Text>

                <View style={styles.emailCard}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <Text style={styles.emailText}>
                        {user?.email || 'your-email@example.com'}
                    </Text>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>How it works:</Text>
                    <View style={styles.step}>
                        <Text style={styles.stepNumber}>1</Text>
                        <Text style={styles.stepText}>
                            Click "Send Reset Email" below
                        </Text>
                    </View>
                    <View style={styles.step}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={styles.stepText}>
                            Check your email inbox
                        </Text>
                    </View>
                    <View style={styles.step}>
                        <Text style={styles.stepNumber}>3</Text>
                        <Text style={styles.stepText}>
                            Click the link and create a new password
                        </Text>
                    </View>
                </View>

                <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSendResetEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="mail" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Send Reset Email</Text>
                        </>
                    )}
                </Pressable>

                <Text style={styles.helpText}>
                    The link will expire in 1 hour for security.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        marginVertical: 10,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 28,
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
    emailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 24,
        gap: 12,
    },
    emailText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        flex: 1,
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
});