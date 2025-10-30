// app/notifications/[id].tsx (or your route path)
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';

export default function NotificationDetail() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const { title, body, from, timeAgo } = useLocalSearchParams<{
        title?: string;
        body?: string;
        from?: string;
        timeAgo?: string;
    }>();

    const onDismiss = () => {
        Alert.alert('Dismissed');
        router.back();
    };

    const onArchive = () => {
        Alert.alert('Archived');
        router.back();
    };

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable
                    hitSlop={12}
                    onPress={() => router.back()}
                    style={s.iconBtn}
                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                >
                    <Ionicons name="chevron-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Notification</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                <Text style={s.title}>
                    {title ?? 'New Recipe Alert: Spicy Chicken Tacos'}
                </Text>

                <Text style={s.body}>
                    {body ??
                        "Chef Isabella Rossi just shared a new recipe for Spicy Chicken Tacos. It’s a must-try for your next Taco Tuesday!"}
                </Text>

                <Pressable
                    onPress={() => {}}
                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                >
                    <Text style={s.meta}>From: {from ?? 'Chef Isabella Rossi'}</Text>
                </Pressable>

                <Text style={s.meta}>Received: {timeAgo ?? '2 hours ago'}</Text>
            </ScrollView>

            {/* Footer */}
            <View style={s.footer}>
                <Pressable
                    style={s.ghostBtn}
                    onPress={onDismiss}
                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                >
                    <Text style={s.ghostText}>Dismiss</Text>
                </Pressable>
                <Pressable
                    style={s.primaryBtn}
                    onPress={onArchive}
                    android_ripple={Platform.OS === 'android' ? { color: theme.primary } : undefined}
                >
                    <Text style={s.primaryText}>Archive</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.bg },
        header: {
            height: 52,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: t.bg,
        },
        iconBtn: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.inputBg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        headerTitle: { fontSize: 18, fontWeight: '800', color: t.text },
        content: { padding: 16, paddingBottom: 120 },
        title: {
            fontSize: 24,
            fontWeight: '900',
            color: t.text,
            marginBottom: 12,
        },
        body: {
            fontSize: 16,
            lineHeight: 22,
            color: t.textDim,
            marginBottom: 18,
        },
        meta: {
            color: t.primary,
            fontWeight: '700',
            marginTop: 6,
        },
        footer: {
            margin: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        ghostBtn: {
            flex: 1,
            backgroundColor: t.inputBg,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        ghostText: { fontWeight: '700', color: t.text },
        primaryBtn: {
            flex: 1,
            backgroundColor: t.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
        },
        primaryText: { fontWeight: '800', color: t.onPrimary ?? '#fff' },
    });
