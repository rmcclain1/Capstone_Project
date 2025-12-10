import React from 'react';
import 'react-native-gesture-handler';
import { Stack, router } from 'expo-router';
import { AuthProvider, useAuth } from '@/app/context/auth_context';
import { ThemeProvider, useTheme } from '@/constants/theme_provider';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '@/app/utils/notifications';
import { registerPushToken } from '@/api/notifications';

function ThemedStack() {
    const { theme } = useTheme();
    const { user } = useAuth();

    // Register push notifications when user is authenticated
    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        (async () => {
            try {
                const token = await registerForPushNotificationsAsync();
                if (token && isMounted) {
                    console.log('[Notifications] Registering token with backend...');
                    await registerPushToken(token);
                    console.log('[Notifications] Token registered successfully');
                }
            } catch (error) {
                console.error('[Notifications] Registration failed:', error);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [user]);

    // Handle notification taps
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as any;
            if (data?.screen === 'pantry') {
                router.push('/(tabs)/pantry');
            } else if (data?.screen === 'recalls') {
                router.push('/(tabs)/recalls');
            } else if (data?.screen === 'notifications') {
                router.push('/(tabs)/notifications');
            }
        });

        return () => sub.remove();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.bg },
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
    return (
        <AuthProvider>
            <ThemeProvider>
                <ThemedStack />
            </ThemeProvider>
        </AuthProvider>
    );
}
