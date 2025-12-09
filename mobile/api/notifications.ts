// api/notifications.ts
import http from '@/lib/http';

export type NotificationType =
    | 'expiring_soon'
    | 'expiring_today'
    | 'expired'
    | 'low_stock'
    | 'custom';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    archived: boolean;
    notification_type: NotificationType;
    metadata?: {
        expiration_date?: string;
        days_until_expiration?: number;
        days_expired?: number;
    };
    pantry_item?: {
        id: string;
        item_name: string;
        expiration_date: string;
    };
    created_at: string;
}

export interface NotificationsResponse {
    notifications: AppNotification[];
    unread_count: number;
    archived_count: number;
    meta: {
        current_page: number;
        total_pages: number;
        total_count: number;
    };
}

export async function getNotifications(page: number = 1): Promise<NotificationsResponse> {
    const { data } = await http.get('/api/v1/notifications', {
        params: { page, per_page: 20 },
    });
    return data;
}

export async function markNotificationRead(id: string): Promise<void> {
    await http.post(`/api/v1/notifications/${id}/mark_read`);
}

export async function markAllNotificationsRead(): Promise<void> {
    await http.post('/api/v1/notifications/mark_all_read');
}

export async function archiveNotification(id: string): Promise<void> {
    await http.post(`/api/v1/notifications/${id}/archive`);
}

export async function unarchiveNotification(id: string): Promise<void> {
    await http.post(`/api/v1/notifications/${id}/unarchive`);
}

export async function archiveAllRead(): Promise<void> {
    await http.post('/api/v1/notifications/archive_all_read');
}

export async function deleteNotification(id: string): Promise<void> {
    await http.delete(`/api/v1/notifications/${id}`);
}

export async function deleteAllArchived(): Promise<void> {
    await http.delete('/api/v1/notifications/delete_archived');
}

export async function registerPushToken(token: string): Promise<void> {
    await http.post('/api/v1/notifications/register_token', {
        expo_push_token: token,
    });
}

export async function unregisterPushToken(): Promise<void> {
    await http.post('/api/v1/notifications/unregister_token');
}

export async function sendTestNotification(): Promise<void> {
    await http.post('/api/v1/notifications/test');
}