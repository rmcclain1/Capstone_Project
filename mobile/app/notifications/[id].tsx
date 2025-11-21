// app/(tabs)/notification-detail.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/constants/theme_provider';
import { api } from '@/api/auth';

export default function NotificationDetailScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const params = useLocalSearchParams();

    const notification = {
        id: Number(params.id),
        title: params.title as string,
        message: params.message as string,
        created_at: params.created_at as string,
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffHours < 24) {
            const hours = Math.max(1, diffHours);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const handleDismiss = () => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/notifications/${notification.id}`);
                            router.back();
                        } catch (error) {
                            console.error('Error deleting notification:', error);
                            Alert.alert('Error', 'Failed to delete notification');
                        }
                    },
                },
            ]
        );
    };

    const handleArchive = async () => {
        try {
            router.back();
        } catch (error) {
            console.error('Error archiving notification:', error);
            Alert.alert('Error', 'Failed to archive notification');
        }
    };

    return (
        <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Notification</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Title */}
                <Text style={[styles.title, { color: theme.text }]}>
                    {notification.title}
                </Text>

                {/* Message */}
                <Text style={[styles.message, { color: theme.text }]}>
                    {notification.message}
                </Text>

                {/* Timestamp */}
                <View style={styles.timestampContainer}>
                    <Ionicons name="time-outline" size={16} color={theme.textDim} />
                    <Text style={[styles.timestamp, { color: theme.textDim }]}>
                        Received: {formatDate(notification.created_at)}
                    </Text>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.actions, {
                borderTopColor: theme.border,
                backgroundColor: theme.bg
            }]}>
                <Pressable
                    style={[styles.actionButton, {
                        backgroundColor: theme.card,
                        borderColor: theme.border
                    }]}
                    onPress={handleDismiss}
                >
                    <Text style={[styles.dismissText, { color: theme.text }]}>
                        Dismiss
                    </Text>
                </Pressable>

                <Pressable
                    style={[styles.actionButton, styles.archiveButton, {
                        backgroundColor: theme.primary
                    }]}
                    onPress={handleArchive}
                >
                    <Text style={styles.archiveText}>Archive</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        padding: 4,
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 100,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 34,
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        lineHeight: 26,
        marginBottom: 24,
        opacity: 0.85,
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    timestamp: {
        fontSize: 14,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    archiveButton: {
        borderWidth: 0,
    },
    dismissText: {
        fontSize: 16,
        fontWeight: '600',
    },
    archiveText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});