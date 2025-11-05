// app/(tabs)/_layout.tsx
import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/constants/theme_provider';

export default function Layout() {
    const { theme } = useTheme();

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
        // shadows
        shadowColor: '#000',
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        ...(Platform.OS === 'android' ? { elevation: 10 } : null),
    },
});