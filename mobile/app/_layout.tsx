import React from 'react';
import 'react-native-gesture-handler';
import { Stack, router } from 'expo-router';
import { AuthProvider } from '@/app/context/auth_context';
import { ThemeProvider, useTheme } from '@/constants/theme_provider';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '@/app/utils/notifications';
import { registerPushToken } from '@/api/notifications';

function ThemedStack() {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <Stack
                screenOptions={{
                    headerShown: false,                 // you can toggle per-screen later
                    contentStyle: { backgroundColor: theme.bg },
                    // If you show headers on some screens later, these will apply:
                    headerStyle: { backgroundColor: theme.card },
                    headerTitleStyle: { color: theme.text },
                    headerTintColor: theme.primary,
                }}
            >
                {/* Tabs */}
                <Stack.Screen name="(tabs)" />
                {/* Standalone screens */}
                <Stack.Screen name="login" />
                <Stack.Screen name="auth/reset-password" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="manual-entry" />
                <Stack.Screen name="organization" />
                <Stack.Screen name="modal" />
                <Stack.Screen name="recalls/[id]" />
                <Stack.Screen name="notifications/[id]" />
            </Stack>
        </View>
    );
}

export default function RootLayout() {
    // Handle notification taps
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as any;
            if (data?.screen === 'notifications') {
                router.push('/notifications');
            } else if (data?.screen === 'recalls') {
                router.push('/recalls');
            }
        });

        return () => sub.remove();
    }, []);

    // Register for push notifications
    useEffect(() => {
        async function setupNotifications() {
            try {
                console.log('[Notifications] Registering for push notifications...');
                const token = await registerForPushNotificationsAsync();

                if (token) {
                    console.log('[Notifications] Push token obtained:', token);
                    try {
                        await registerPushToken(token);
                        console.log('[Notifications] Push token registered with backend');
                    } catch (error: any) {
                        console.error('[Notifications] Failed to register push token with backend:', error?.message);
                        // Don't throw - app can still work without push notifications
                    }
                } else {
                    console.log('[Notifications] No push token obtained (might be simulator/emulator)');
                }
            } catch (error) {
                console.error('[Notifications] Setup error:', error);
            }
        }

        // Delay slightly to let auth context initialize first
        const timer = setTimeout(setupNotifications, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthProvider>
            <ThemeProvider>
                <ThemedStack />
            </ThemeProvider>
        </AuthProvider>
    );
}
