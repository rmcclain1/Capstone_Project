// mobile/app/(tabs)/_layout.tsx
import React, { useMemo, useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Platform, View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/constants/theme_provider';
import { useAuth } from '@/app/context/auth_context';

export default function TabsLayout() {
    const { theme } = useTheme();
    const { user, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    const tabBarStyle = useMemo(
        () => [
            styles.baseBar,
            {
                backgroundColor: theme.card,
                borderTopColor: theme.border,
                shadowOpacity: theme.name === 'light' ? 0.08 : 0.25,
            },
        ],
        [theme],
    );

    // Redirect to login if not authenticated
    useEffect(() => {
        if (loading) return;

        const inTabs = segments[0] === '(tabs)';

        if (!user && inTabs) {
            console.log('[Tabs] Not authenticated, redirecting to login');
            router.replace('/login');
        }
    }, [user, loading, segments]);

    // Show loading while checking auth
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Don't render tabs if not authenticated
    if (!user) {
        return null;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textDim,
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
                tabBarStyle,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pantry"
                options={{
                    title: 'Pantry',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="basket-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="recalls"
                options={{
                    title: 'Recalls',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="alert-decagram-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ai"
                options={{
                    title: 'AI',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Notifications',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="notifications-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    baseBar: {
        height: 86,
        paddingTop: 8,
        paddingBottom: 18,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        position: 'absolute',
        shadowColor: '#000',
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        ...(Platform.OS === 'android' ? { elevation: 10 } : {}),
    },
});