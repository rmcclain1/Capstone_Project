import 'react-native-gesture-handler';
import { Stack, router } from 'expo-router';
import { AuthProvider } from '@/app/context/auth_context';
import { ThemeProvider, useTheme } from '@/constants/theme_provider';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

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
                <Stack.Screen name="settings" />
                <Stack.Screen name="organization" />
                <Stack.Screen name="ai" />
                <Stack.Screen name="manual-entry" />
                <Stack.Screen name="recall/[id]" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="TermsOfService" />
                <Stack.Screen name="Contact" />
            </Stack>
        </View>
    );
}

export default function RootLayout() {
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as any;
            if (data?.screen === 'pantry') {
                router.push('/pantry');
            } else if (data?.screen === 'recalls') {
                router.push('/recalls');
            }
        });

        return () => sub.remove();
    }, []);
    return (
        <AuthProvider>
            <ThemeProvider>
                <ThemedStack />
            </ThemeProvider>
        </AuthProvider>
    );
}
