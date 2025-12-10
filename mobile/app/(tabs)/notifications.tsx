// app/(tabs)/notifications.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    Platform,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme_provider';
import {
    getNotifications,
    markNotificationRead,
    type AppNotification,
} from '@/api/notifications';

export default function NotificationsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await getNotifications();
            setNotifications(response.notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, []);

    const handleNotificationPress = async (notification: AppNotification) => {
        // Mark as read
        if (!notification.read) {
            try {
                await markNotificationRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
                );
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Navigate to detail
        router.push({
            pathname: '/notifications/[id]',
            params: {
                id: notification.id,
                title: notification.title,
                body: notification.body,
                timeAgo: formatTimeAgo(notification.created_at),
                type: notification.notification_type,
                read: notification.read.toString(),
            },
        });
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getNotificationImage = (type: string) => {
        // Map notification types to images
        const images: Record<string, string> = {
            expiring_soon: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=200&q=80',
            expiring_today: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
            expired: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&q=80',
            low_stock: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=200&q=80',
            custom: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=200&q=80',
        };
        return images[type] || images.custom;
    };

    if (loading) {
        return (
            <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
                <View style={s.header}>
                    <View style={{ width: 26 }} />
                    <Text style={s.headerTitle}>Notifications</Text>
                    <View style={{ width: 26 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <View style={{ width: 26 }} />
                <Text style={s.headerTitle}>Notifications</Text>
                <View style={{ width: 26 }} />
            </View>

            <FlatList
                data={notifications.filter(n => !n.archived)}
                keyExtractor={(it) => it.id}
                contentContainerStyle={{ paddingBottom: 24 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    <NotificationRow
                        item={item}
                        onPress={() => handleNotificationPress(item)}
                        getImage={getNotificationImage}
                        formatTime={formatTimeAgo}
                    />
                )}
                style={s.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={s.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={theme.textDim} />
                        <Text style={s.emptyTitle}>No notifications yet</Text>
                        <Text style={s.emptyText}>
                            You'll see notifications here when items are expiring
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

function NotificationRow({
    item,
    onPress,
    getImage,
    formatTime
}: {
    item: AppNotification;
    onPress: () => void;
    getImage: (type: string) => string;
    formatTime: (date: string) => string;
}) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <Pressable
            style={[s.row, !item.read && s.unreadRow]}
            android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
            onPress={onPress}
        >
            <Image source={{ uri: getImage(item.notification_type) }} style={s.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={[s.title, !item.read && s.unreadTitle]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={s.time}>{formatTime(item.created_at)}</Text>
            </View>
            {!item.read && <View style={s.unreadDot} />}
        </Pressable>
    );
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: t.bg,
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
            color: t.text,
        },
        list: {
            paddingHorizontal: 16,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: t.card,
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOpacity: t.name === 'light' ? 0.05 : 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            ...(Platform.OS === 'android' ? { elevation: 2 } : {}),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.name === 'light' ? 'transparent' : t.border,
            position: 'relative',
        },
        unreadRow: {
            borderLeftWidth: 3,
            borderLeftColor: t.primary,
        },
        thumb: {
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: t.border,
        },
        title: {
            fontSize: 16,
            fontWeight: '800',
            color: t.text,
        },
        unreadTitle: {
            fontWeight: '900',
        },
        time: {
            marginTop: 4,
            fontSize: 14,
            color: t.primary,
            fontWeight: '600',
        },
        unreadDot: {
            position: 'absolute',
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: t.primary,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: 64,
            paddingHorizontal: 32,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: t.text,
            marginTop: 16,
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 14,
            color: t.textDim,
            textAlign: 'center',
            lineHeight: 20,
        },
    });
