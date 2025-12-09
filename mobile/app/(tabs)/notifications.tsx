// mobile/app/(tabs)/notifications.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    Platform,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';
import { useAuth } from '@/app/context/auth_context';
import { api } from '@/lib/api';

type NotificationType = 'recall' | 'expiring' | 'expired' | 'new_recall';

type Notification = {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    timeAgo: string;
    timestamp: string;
    image?: string;
    relatedId?: number;
};

// Helper to format dates
function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return new Date(dateString).toLocaleDateString();
}

// Generate notifications from pantry items and recalls
async function generateNotifications(): Promise<Notification[]> {
    const notifications: Notification[] = [];

    try {
        // Fetch pantry items
        const pantryRes = await api.get('/api/v1/pantries');
        const pantryItems = Array.isArray(pantryRes.data) ? pantryRes.data : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check for expiring/expired items
        pantryItems.forEach((item: any) => {
            if (!item.expiration_date) return;

            const expDate = new Date(item.expiration_date);
            expDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntil < 0) {
                // Expired
                notifications.push({
                    id: `expired-${item.id}`,
                    type: 'expired',
                    title: `${item.item_name} has expired`,
                    body: `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`,
                    timeAgo: timeAgo(item.expiration_date),
                    timestamp: item.expiration_date,
                    image: item.image_url || 'https://images.unsplash.com/photo-1505575972945-270b6aebc74b?w=200&q=80',
                    relatedId: item.id,
                });
            } else if (daysUntil <= 7) {
                // Expiring soon
                notifications.push({
                    id: `expiring-${item.id}`,
                    type: 'expiring',
                    title: `${item.item_name} expires soon`,
                    body: `Expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
                    timeAgo: timeAgo(item.created_at || new Date().toISOString()),
                    timestamp: item.created_at || new Date().toISOString(),
                    image: item.image_url || 'https://images.unsplash.com/photo-1505575972945-270b6aebc74b?w=200&q=80',
                    relatedId: item.id,
                });
            }
        });

        // Fetch recent recalls
        const recallsRes = await api.get('/api/v1/food_events', { params: { per_page: 10 } });
        const recalls = Array.isArray(recallsRes.data) ? recallsRes.data : [];

        // Add recall notifications
        recalls.slice(0, 5).forEach((recall: any, index: number) => {
            const reportDate = recall.report_date || new Date().toISOString();
            notifications.push({
                id: `recall-${recall.id}`,
                type: 'new_recall',
                title: 'New FDA Recall',
                body: recall.product_description || 'Check details for more information',
                timeAgo: timeAgo(reportDate),
                timestamp: reportDate,
                image: 'https://images.unsplash.com/photo-1584395630827-860eee694d7b?w=200&q=80',
                relatedId: recall.id,
            });
        });

    } catch (error) {
        console.error('[Notifications] Error generating:', error);
    }

    // Sort by timestamp (newest first)
    return notifications.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            console.log('[Notifications] Loading...');
            const notifs = await generateNotifications();
            console.log('[Notifications] Loaded:', notifs.length);
            setNotifications(notifs);
        } catch (error) {
            console.error('[Notifications] Load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'expired': return 'alert-circle';
            case 'expiring': return 'warning';
            case 'new_recall': return 'megaphone';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: NotificationType) => {
        switch (type) {
            case 'expired': return '#EF4444';
            case 'expiring': return '#F59E0B';
            case 'new_recall': return theme.primary;
            default: return theme.primary;
        }
    };

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Text style={s.headerTitle}>Notifications</Text>
                {user && (
                    <Text style={s.headerSubtitle}>
                        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </Text>
                )}
            </View>

            {loading ? (
                <View style={s.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            style={s.row}
                            android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                            onPress={() => {
                                if (item.type === 'new_recall' && item.relatedId) {
                                    router.push(`/recalls/${item.relatedId}`);
                                } else if ((item.type === 'expired' || item.type === 'expiring') && item.relatedId) {
                                    router.push('/(tabs)/pantry');
                                }
                            }}
                        >
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={s.thumb} />
                            ) : (
                                <View style={[s.thumb, s.iconThumb, { backgroundColor: theme.border }]}>
                                    <Ionicons
                                        name={getIcon(item.type)}
                                        size={28}
                                        color={getIconColor(item.type)}
                                    />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={s.title} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                <Text style={s.body} numberOfLines={1}>
                                    {item.body}
                                </Text>
                                <Text style={s.time}>{item.timeAgo}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textDim} />
                        </Pressable>
                    )}
                    style={s.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.centerContent}>
                            <MaterialCommunityIcons
                                name="bell-outline"
                                size={64}
                                color={theme.textDim}
                            />
                            <Text style={[s.emptyTitle, { color: theme.text }]}>
                                No notifications
                            </Text>
                            <Text style={[s.emptyText, { color: theme.textDim }]}>
                                We'll notify you about recalls and expiring items
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: t.bg,
        },
        header: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: t.border,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: t.text,
        },
        headerSubtitle: {
            fontSize: 14,
            color: t.textDim,
            marginTop: 2,
        },
        list: {
            paddingHorizontal: 16,
            paddingTop: 12,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: t.card,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOpacity: t.name === 'light' ? 0.05 : 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            ...(Platform.OS === 'android' ? { elevation: 2 } : {}),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.name === 'light' ? 'transparent' : t.border,
        },
        thumb: {
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: t.border,
        },
        iconThumb: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: {
            fontSize: 16,
            fontWeight: '700',
            color: t.text,
        },
        body: {
            fontSize: 14,
            color: t.textDim,
            marginTop: 2,
        },
        time: {
            marginTop: 4,
            fontSize: 12,
            color: t.primary,
            fontWeight: '600',
        },
        centerContent: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '700',
            marginTop: 16,
        },
        emptyText: {
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
        },
    });