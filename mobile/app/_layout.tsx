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

        const registerWithRetry = async (maxRetries = 3) => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const token = await registerForPushNotificationsAsync();
                    
                    if (token && isMounted) {
                        console.log('[Notifications] Registering token with backend...');
                        await registerPushToken(token);
                        console.log('[Notifications] Token registered successfully');
                        return true; // Success
                    } else if (!token) {
                        console.log('[Notifications] No token received (likely permission denied)');
                        return false; // Don't retry if user denied permission
                    }
                } catch (error) {
                    console.error(`[Notifications] Registration attempt ${attempt + 1} failed:`, error);
                    
                    if (attempt < maxRetries - 1) {
                        // Exponential backoff: 2s, 4s, 8s
                        const delay = 2000 * Math.pow(2, attempt);
                        console.log(`[Notifications] Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            console.error('[Notifications] Failed to register after all retries');
            return false;
        };

        registerWithRetry();

        return () => {
            isMounted = false;
        };
    }, [user]);

    // Handle notification taps (background/killed app)
    useEffect(() => {
        const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as any;
            if (data?.screen === 'pantry') {
                router.push('/(tabs)/pantry');
            } else if (data?.screen === 'recalls') {
                router.push('/(tabs)/recalls');
            } else if (data?.screen === 'notifications') {
                router.push('/(tabs)/notifications');
            }
        });

        return () => tapSub.remove();
    }, []);

    // Handle notifications received while app is in foreground
    useEffect(() => {
        const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
            console.log('[Notifications] Received while app open:', notification.request.content);
            // Notification will be shown automatically due to setNotificationHandler
            // You could optionally refresh notification list here if needed
        });

        return () => receivedSub.remove();
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
                <Stack.Screen name="profile" />
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
