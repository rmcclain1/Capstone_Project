
import { SafeAreaView } from 'react-native-safe-area-context'; // Ensures UI elements are displayed within safe boundaries.
import { View, Text, StyleSheet, Pressable, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // for handling screen-to-screen navigation
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/app/context/auth_context";
import React, { useState } from 'react';
import axios from 'axios';

const BG = '#F5F3FA';

function getBaseUrl() {
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api/v1';
    return 'http://127.0.0.1:3000/api/v1';
}

export default function ResetPassword() {
    const { user } = useAuth();
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');

    const API_BASE = getBaseUrl();

    const verifyCurrentPassword = async () => {
        try {
            const response = await axios.post(`${API_BASE}/users/verify_password`, {
                old_password: oldPassword,
            });
            if (response.data.valid) {
                console.log('✅ Current password is correct.');
                return true;
            } else {
                console.log('❌ Incorrect password.');
                return false;
            }
        } catch (error: any) {
            console.error('Verification failed:', error.response?.data || error.message);
            return false;
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== verifyPassword) {
            alert('New passwords do not match.');
            return;
        }

        const verified = await verifyCurrentPassword();
        if (!verified) {
            alert('Your current password is incorrect.');
            return;
        }

        try {
            const response = await axios.patch(`${API_BASE}/users/update_password`, {
                old_password: oldPassword,
                new_password: newPassword,
            });
            alert('Password updated successfully!');
            console.log(response.data);
        } catch (error: any) {
            console.error('Password update failed:', error.response?.data || error.message);
            alert('Failed to update password.');
        }
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <View style={styles.headerRow}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color="#1A1523" />
                </Pressable>
                <Text style={styles.title}>Reset Password</Text>
            </View>

            <Text style={styles.sub}>
                Password must be at least 8 characters,
                include an uppercase letter, a number,
                and a special character.
            </Text>

            <TextInput
                placeholder="Current password"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                value={oldPassword}
                onChangeText={setOldPassword}
                style={styles.input}
            />

            <TextInput
                placeholder="New password"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
            />

            <TextInput
                placeholder="Re-type new password"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                value={verifyPassword}
                onChangeText={setVerifyPassword}
                style={styles.input}
            />

            <Text style={styles.sub}>
                Forgot password
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                <Text style={styles.buttonText}>{'Change password'}</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    screen: {
        flex: 1,
        backgroundColor: BG
    },

    header: {
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1523'
    },

    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 28,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        marginVertical: 10
    },

    sub: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 2,
        marginBottom: 12,
        marginHorizontal: 10,
    },

    forgotPassword: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 2,
        marginBottom: 12,
        marginHorizontal: 10,
    },

    section: {
        marginTop: 24,
        marginBottom: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '800',
        color: '#1A1523',
    },

    logoutText: {
        color: '#d32f2f',
        fontSize: 16,
        fontWeight: '600',
    },

    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
        marginBottom: 12,
        marginHorizontal: 25
    },

    row: {
        paddingHorizontal: 16,
        height: 52,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: '#EEE9F7',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },

    label: { fontSize: 16, fontWeight: '600', color: '#1A1523' },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { fontSize: 16, color: '#2563EB', fontWeight: '600' },

    button: {
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 32,
        marginTop: 8,
        minWidth: 180,
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});