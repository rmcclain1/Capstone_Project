// app/(tabs)/notifications.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme_provider';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    archiveNotification,
    sendTestNotification,
    type AppNotification,
} from '@/api/notifications';

type TabType = 'all' | 'unread' | 'archived';

export default function NotificationsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await getNotifications();
            setAllNotifications(response.notifications);
            setUnreadCount(response.unread_count);
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

    const filteredNotifications = allNotifications.filter(n => {
        if (activeTab === 'unread') return !n.read;
        if (activeTab === 'archived') return n.archived;
        return !n.archived;
    });

    const handleMarkRead = async (notification: AppNotification) => {
        if (notification.read) return;

        try {
            await markNotificationRead(notification.id);
            setAllNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
            Alert.alert('Error', 'Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            await markNotificationRead(id);
            setAllNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to dismiss:', error);
            Alert.alert('Error', 'Failed to dismiss notification');
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await archiveNotification(id);
            setAllNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, archived: true } : n))
            );
        } catch (error) {
            console.error('Failed to archive:', error);
            Alert.alert('Error', 'Failed to archive notification');
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Notification',
            'This notification will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNotification(id);
                            setAllNotifications(prev => prev.filter(n => n.id !== id));
                        } catch (error) {
                            console.error('Failed to delete:', error);
                            Alert.alert('Error', 'Failed to delete notification');
                        }
                    },
                },
            ]
        );
    };

    const handleNotificationPress = (notification: AppNotification) => {
        handleMarkRead(notification);

        if (notification.pantry_item) {
            router.push(`/pantry/${notification.pantry_item.id}` as any);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'expiring_soon': return 'time-outline';
            case 'expiring_today': return 'alert-circle-outline';
            case 'expired': return 'close-circle-outline';
            case 'low_stock': return 'trending-down-outline';
            default: return 'notifications-outline';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'expiring_soon': return '#F59E0B';
            case 'expiring_today': return '#EF4444';
            case 'expired': return '#DC2626';
            case 'low_stock': return '#3B82F6';
            default: return theme.textDim;
        }
    };

    const renderNotification = ({ item }: { item: AppNotification }) => (
        <Pressable
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
            android_ripple={{ color: theme.border }}
        >
            <View style={styles.notificationContent}>
                <View
                    style={[
                        styles.iconCircle,
                        { backgroundColor: getNotificationColor(item.notification_type) + '20' },
                    ]}
                >
                    <Ionicons
                        name={getNotificationIcon(item.notification_type) as any}
                        size={24}
                        color={getNotificationColor(item.notification_type)}
                    />
                </View>

                <View style={styles.textContent}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                        {item.title}
                    </Text>
                    <Text style={styles.body}>{item.body}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtons}>
                {!item.read && (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDismiss(item.id);
                        }}
                        style={[styles.actionBtn, styles.dismissBtn]}
                        hitSlop={8}
                    >
                        <Ionicons name="checkmark-outline" size={16} color="#10B981" />
                        <Text style={[styles.actionText, styles.dismissText]}>Dismiss</Text>
                    </Pressable>
                )}

                {!item.archived && (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            handleArchive(item.id);
                        }}
                        style={[styles.actionBtn, styles.archiveBtn]}
                        hitSlop={8}
                    >
                        <Ionicons name="archive-outline" size={16} color={theme.textDim} />
                        <Text style={[styles.actionText, styles.archiveText]}>Archive</Text>
                    </Pressable>
                )}

                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                    }}
                    style={[styles.actionBtn, styles.deleteBtn]}
                    hitSlop={8}
                >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </Pressable>
            </View>

            {!item.read && <View style={styles.unreadDot} />}
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && activeTab === 'all' && (
                    <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </Pressable>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                    android_ripple={{ color: theme.border }}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        All
                    </Text>
                    {allNotifications.filter(n => !n.archived).length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>
                                {allNotifications.filter(n => !n.archived).length}
                            </Text>
                        </View>
                    )}
                </Pressable>

                <Pressable
                    style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
                    onPress={() => setActiveTab('unread')}
                    android_ripple={{ color: theme.border }}
                >
                    <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
                        Unread
                    </Text>
                    {unreadCount > 0 && (
                        <View style={[styles.tabBadge, styles.unreadBadge]}>
                            <Text style={[styles.tabBadgeText, { color: 'white' }]}>{unreadCount}</Text>
                        </View>
                    )}
                </Pressable>

                <Pressable
                    style={[styles.tab, activeTab === 'archived' && styles.activeTab]}
                    onPress={() => setActiveTab('archived')}
                    android_ripple={{ color: theme.border }}
                >
                    <Text style={[styles.tabText, activeTab === 'archived' && styles.activeTabText]}>
                        Archived
                    </Text>
                    {allNotifications.filter(n => n.archived).length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>
                                {allNotifications.filter(n => n.archived).length}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Notifications List */}
            <FlatList
                data={filteredNotifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons
                            name={
                                activeTab === 'archived' ? 'archive-outline' :
                                    activeTab === 'unread' ? 'checkmark-done-outline' :
                                        'notifications-off-outline'
                            }
                            size={64}
                            color={theme.textDim}
                        />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'archived' ? 'No archived notifications' :
                                activeTab === 'unread' ? 'All caught up!' :
                                    'No notifications yet'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'archived' ? 'Archived notifications will appear here' :
                                activeTab === 'unread' ? 'You have no unread notifications' :
                                    "You'll see notifications here when items are expiring"}
                        </Text>
                    </View>
                }
            />

            {/* Test Button (dev only) */}
            {__DEV__ && (
                <Pressable
                    style={styles.testBtn}
                    onPress={async () => {
                        try {
                            await sendTestNotification();
                            Alert.alert('Success', 'Test notification sent!');
                            setTimeout(handleRefresh, 2000);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to send test notification');
                        }
                    }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                    <Ionicons name="flask" size={20} color="white" />
                    <Text style={styles.testBtnText}>Test</Text>
                </Pressable>
            )}
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: theme.text },
    markAllBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    markAllText: { fontSize: 14, color: theme.primary, fontWeight: '600' },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: theme.primary },
    tabText: { fontSize: 15, fontWeight: '600', color: theme.textDim },
    activeTabText: { color: theme.primary },
    tabBadge: {
        backgroundColor: theme.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    unreadBadge: { backgroundColor: theme.primary },
    tabBadgeText: { fontSize: 11, fontWeight: '700', color: theme.text },
    listContent: {
        padding: 16,
        gap: 12,
        paddingBottom: 100, // Account for tab bar
    },
    notificationCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.name === 'light' ? 0.05 : 0.15,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
    },
    unreadCard: { borderLeftWidth: 3, borderLeftColor: theme.primary },
    notificationContent: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', color: theme.textDim, marginBottom: 4 },
    unreadTitle: { color: theme.text, fontWeight: '700' },
    body: { fontSize: 14, color: theme.textDim, lineHeight: 20, marginBottom: 4 },
    timestamp: { fontSize: 12, color: theme.textDim, opacity: 0.7 },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: theme.inputBg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
    },
    dismissBtn: {},
    archiveBtn: {},
    deleteBtn: { marginLeft: 'auto' },
    actionText: { fontSize: 12, fontWeight: '600' },
    dismissText: { color: '#10B981' },
    archiveText: { color: theme.textDim },
    deleteText: { color: '#EF4444' },
    unreadDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.primary,
    },
    emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: { fontSize: 14, color: theme.textDim, textAlign: 'center', lineHeight: 20 },
    testBtn: {
        position: 'absolute',
        bottom: 100, // Above tab bar
        right: 16,
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    testBtnText: { color: 'white', fontWeight: '700' },
});