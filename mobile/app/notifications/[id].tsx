// app/notifications/[id].tsx
import React, { useMemo, useState } from 'react';
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
import { deleteNotification, archiveNotification } from '@/api/notifications';

export default function NotificationDetail() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);
    const [isDeleting, setIsDeleting] = useState(false);

    const { id, title, body, timeAgo, type, read } = useLocalSearchParams<{
        id?: string;
        title?: string;
        body?: string;
        timeAgo?: string;
        type?: string;
        read?: string;
    }>();

    const getNotificationIcon = (notifType?: string) => {
        switch (notifType) {
            case 'expiring_soon': return 'time-outline';
            case 'expiring_today': return 'alert-circle-outline';
            case 'expired': return 'close-circle-outline';
            case 'low_stock': return 'trending-down-outline';
            default: return 'notifications-outline';
        }
    };

    const getNotificationColor = (notifType?: string) => {
        switch (notifType) {
            case 'expiring_soon': return '#F59E0B';
            case 'expiring_today': return '#EF4444';
            case 'expired': return '#DC2626';
            case 'low_stock': return '#3B82F6';
            default: return theme.primary;
        }
    };

    const onDismiss = async () => {
        if (!id) return;

        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteNotification(id);
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete notification');
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const onArchive = async () => {
        if (!id) return;

        try {
            await archiveNotification(id);
            Alert.alert('Archived', 'Notification has been archived');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to archive notification');
        }
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
                {/* Icon Badge */}
                <View style={[s.iconBadge, { backgroundColor: getNotificationColor(type) + '20' }]}>
                    <Ionicons
                        name={getNotificationIcon(type) as any}
                        size={32}
                        color={getNotificationColor(type)}
                    />
                </View>

                <Text style={s.title}>
                    {title ?? 'Notification'}
                </Text>

                <Text style={s.body}>
                    {body ?? 'No additional details available.'}
                </Text>

                <View style={s.metaContainer}>
                    <Ionicons name="time-outline" size={16} color={theme.textDim} />
                    <Text style={s.meta}>Received: {timeAgo ?? 'Unknown'}</Text>
                </View>

                {type && (
                    <View style={s.metaContainer}>
                        <Ionicons name="pricetag-outline" size={16} color={theme.textDim} />
                        <Text style={s.meta}>Type: {type.replace(/_/g, ' ')}</Text>
                    </View>
                )}

                {read === 'false' && (
                    <View style={s.badge}>
                        <Text style={s.badgeText}>Unread</Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={s.footer}>
                <Pressable
                    style={s.ghostBtn}
                    onPress={onDismiss}
                    disabled={isDeleting}
                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[s.ghostText, { color: '#EF4444' }]}>Delete</Text>
                </Pressable>
                <Pressable
                    style={s.primaryBtn}
                    onPress={onArchive}
                    disabled={isDeleting}
                    android_ripple={Platform.OS === 'android' ? { color: theme.primary } : undefined}
                >
                    <Ionicons name="archive-outline" size={18} color={theme.primary ?? '#fff'} />
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
        iconBadge: {
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: '900',
            color: t.text,
            marginBottom: 12,
            textAlign: 'center',
        },
        body: {
            fontSize: 16,
            lineHeight: 24,
            color: t.textDim,
            marginBottom: 24,
            textAlign: 'center',
        },
        metaContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
        },
        meta: {
            color: t.textDim,
            fontWeight: '600',
            fontSize: 14,
        },
        badge: {
            backgroundColor: t.primary + '20',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            alignSelf: 'flex-start',
            marginTop: 16,
        },
        badgeText: {
            color: t.primary,
            fontWeight: '700',
            fontSize: 12,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            margin: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        ghostBtn: {
            flex: 1,
            backgroundColor: t.inputBg,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        ghostText: { fontWeight: '700', color: t.text },
        primaryBtn: {
            flex: 1,
            backgroundColor: t.primary,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
        },
        primaryText: { fontWeight: '800', color: t.onPrimary ?? '#fff' },
    });
