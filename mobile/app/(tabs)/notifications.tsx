// app/notifications/index.tsx
import React, {useMemo, useEffect, useState, useCallback} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/api/auth';
import { useAuth } from '@/app/context/auth_context';
import { useTheme } from '@/constants/theme_provider';

type Notification = {
    id: number;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
};

export default function NotificationsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { theme } = useTheme();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const s = useMemo(() => makeStyles(theme), [theme]);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token, fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: number) => {
        try {
            await api.patch(`/notifications/${id}/mark_as_read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark_all_as_read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return '1d ago';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]}>
                <View>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Notifications</Text>
                <View style={{ width: 26 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(it) => it.id.toString()}
                contentContainerStyle={{ paddingBottom: 24 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => <NotificationRow item={item} />}
                style={s.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

function NotificationRow({ item }: { item: Notification }) {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <Pressable
            style={s.row}
            android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
            onPress={() =>
                router.push({
                    pathname: '/notifications/[id]',
                    params: {
                        id: item.id,
                        title: item.title,
                        timeAgo: item.created_at,
                        body: item.message,
                    },
                })
            }
        >
            <Ionicons
                name={item.read ? "notifications-outline" : "notifications"}
                size={22}
                color={item.read ? theme.textDim : theme.primary}
            />
            <View style={{ flex: 1 }}>
                <Text style={s.title} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={s.time}>{item.message}</Text>
            </View>
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
            ...(Platform.OS === 'android' ? { elevation: 2 } : null),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.name === 'light' ? 'transparent' : t.border,
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
        time: {
            marginTop: 4,
            fontSize: 14,
            color: t.primary,
            fontWeight: '600',
        },
    });
