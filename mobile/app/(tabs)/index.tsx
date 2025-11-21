// app/(tabs)/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View, Text, StyleSheet, Pressable, Image, ActivityIndicator,
    ScrollView, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import {api} from '@/api/auth'
import { useAuth } from '@/app/context/auth_context';
import { useTheme } from '@/constants/theme_provider';
import * as Notifications from 'expo-notifications';

type ApiPantry = {
    id: number;
    item_name: string;
    expiration_date?: string | null; // 'YYYY-MM-DD'
    expired?: boolean | null;
    created_at?: string; // ISO
    updated_at?: string; // ISO
};

/* ---------------- helpers ---------------- */
function parseISODate(s?: string | null): Date | null {
    if (!s) return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
}
function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function daysBetween(a: Date, b: Date): number {
    const A = startOfDay(a).getTime();
    const B = startOfDay(b).getTime();
    return Math.round((A - B) / 86400000);
}
function daysUntil(iso?: string | null): number | null {
    const d = parseISODate(iso);
    if (!d) return null;
    return daysBetween(d, new Date()); // positive => future
}
function formatRelative(d: Date) {
    const diff = daysBetween(d, new Date()); // positive => future
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff === -1) return 'yesterday';
    return diff > 1 ? `in ${diff} days` : `${Math.abs(diff)} days ago`;
}

/* ---------------- component ---------------- */

export default function Home() {
    const router = useRouter();
    const { user, token } = useAuth();
    const { theme } = useTheme();

    const s = useMemo(() => makeStyles(theme), [theme]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pantry, setPantry] = useState<ApiPantry[]>([]);

    const apiInstance = useMemo(() => {
        if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common.Authorization;
        }
        return api;
    }, [token]);

    const fetchPantry = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const { data } = await apiInstance.get('/pantries');
            const rows: ApiPantry[] = Array.isArray(data) ? data : (data?.items || []);
            setPantry(rows);
        } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || 'Failed to load pantry');
            setPantry([]);
        } finally {
            setLoading(false);
        }
    }, [apiInstance]);

    useEffect(() => {
        fetchPantry();
    }, [fetchPantry]);

    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(() => {
            router.push('/(tabs)/notifications');
        });

        return () => sub.remove();
    }, [router]);

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await fetchPantry();
        } finally {
            setRefreshing(false);
        }
    }, [fetchPantry]);

    /* ---- computed summary ---- */
    const { total, soonCount, expiredCount, soonestLabel } = useMemo(() => {
        const total = pantry.length;

        let soon = 0, expired = 0;
        let minDays: number | null = null;

        for (const p of pantry) {
            const d = daysUntil(p.expiration_date);
            const isExpired = p.expired === true || (d !== null && d < 0);

            if (isExpired) {
                expired++;
            } else if (d !== null) {
                if (d <= 7) soon++;
                if (minDays === null || d < minDays) minDays = d;
            }
        }

        const soonestLabel =
            minDays === null ? 'No dates on file' :
                minDays < 0 ? 'Some already expired' :
                    minDays === 0 ? 'Expires today' :
                        `Soonest in ${minDays} day${minDays === 1 ? '' : 's'}`;

        return { total, soonCount: soon, expiredCount: expired, soonestLabel };
    }, [pantry]);

    /* ---- recent activity (derived; no extra table) ---- */
    type ActivityEvent = { key: string; icon: string; title: string; subtitle: string; at: Date };
    const recentActivity: ActivityEvent[] = useMemo(() => {
        const now = new Date();
        const within7 = (iso?: string) => {
            if (!iso) return false;
            const d = new Date(iso);
            if (isNaN(d.getTime())) return false;
            return Math.abs(daysBetween(d, now)) <= 7;
        };

        const events: ActivityEvent[] = [];
        for (const p of pantry) {
            const created = p.created_at ? new Date(p.created_at) : null;
            const updated = p.updated_at ? new Date(p.updated_at) : null;
            const exp = parseISODate(p.expiration_date);

            // Added (last 7 days)
            if (created && within7(p.created_at)) {
                events.push({
                    key: `added-${p.id}-${p.created_at}`,
                    icon: '＋',
                    title: 'Added',
                    subtitle: p.item_name,
                    at: created,
                });
            }

            // Updated (last 7 days, not same timestamp as created)
            if (updated && created && updated.getTime() !== created.getTime() && within7(p.updated_at)) {
                events.push({
                    key: `updated-${p.id}-${p.updated_at}`,
                    icon: '✎',
                    title: 'Updated',
                    subtitle: p.item_name,
                    at: updated,
                });
            }

            // Expiring soon (≤ 7 days)
            if (exp) {
                const dLeft = daysUntil(p.expiration_date);
                if (dLeft !== null && dLeft >= 0 && dLeft <= 7) {
                    events.push({
                        key: `expiring-${p.id}-${p.expiration_date}`,
                        icon: '🕒',
                        title: 'Expiring Soon',
                        subtitle: `${p.item_name} • ${formatRelative(exp)}`,
                        at: exp,
                    });
                }
            }

            // Expired recently (expiry within last 7 days)
            const dLeft = daysUntil(p.expiration_date);
            const isExpired = p.expired === true || (dLeft !== null && dLeft < 0);
            if (isExpired && exp && Math.abs(daysBetween(exp, now)) <= 7) {
                events.push({
                    key: `expired-${p.id}-${p.expiration_date}`,
                    icon: '⚠️',
                    title: 'Expired',
                    subtitle: `${p.item_name} • ${formatRelative(exp)}`,
                    at: exp,
                });
            }
        }

        events.sort((a, b) => b.at.getTime() - a.at.getTime());
        return events.slice(0, 10);
    }, [pantry]);

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable onPress={() => router.push('/profile')}>
                    <Image
                        source={{ uri: (user as any)?.profile_picture_url || 'https://i.pravatar.cc/100?img=12' }}
                        style={s.avatar}
                    />
                </Pressable>
                <Text style={s.headerTitle}>Home</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Card */}
                <View style={s.card}>
                    <Text style={s.h1}>
                        Welcome back, <Text style={{ color: theme.text }}>{user?.first_name || user?.username}</Text>!
                    </Text>
                    <Text style={s.sub}>Pantry summary and recent activity.</Text>
                </View>

                {/* Summary */}
                <Text style={s.sectionTitle}>Pantry Summary</Text>

                {loading ? (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        {!!error && <Text style={{ marginTop: 8, color: theme.textDim }}>{error}</Text>}
                    </View>
                ) : (
                    <>
                        <View style={s.row}>
                            <SummaryTile icon="🧺" title="Total Items" subtitle={`${total} item${total === 1 ? '' : 's'}`} />
                            <SummaryTile icon="🕒" title="Expiring Soon" subtitle={soonCount > 0 ? `${soonCount} in ≤ 7 days` : soonestLabel} />
                        </View>
                        <View style={{ height: 12 }} />
                        <View style={s.row}>
                            <SummaryTile icon="⚠️" title="Expired" subtitle={`${expiredCount} item${expiredCount === 1 ? '' : 's'}`} />
                            <SummaryTile icon="📅" title="Soonest Expiry" subtitle={soonestLabel} />
                        </View>
                    </>
                )}

                {/* Activity */}
                <Text style={[s.sectionTitle, { marginTop: 18 }]}>Recent Activity</Text>
                {loading ? (
                    <View style={{ paddingVertical: 12 }}>
                        <ActivityIndicator size="small" color={theme.primary} />
                    </View>
                ) : recentActivity.length === 0 ? (
                    <View style={s.activity}>
                        <View style={[s.activityIconWrap, { backgroundColor: theme.tint }]}>
                            <Text style={[s.activityIcon, { color: theme.text }]}>ℹ️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.activityTitle}>No recent activity</Text>
                            <Text style={[s.activitySub, { color: theme.primary }]}>Add items or edit pantry to see updates.</Text>
                        </View>
                    </View>
                ) : (
                    recentActivity.map(ev => (
                        <ActivityItem key={ev.key} icon={ev.icon} title={ev.title} subtitle={ev.subtitle} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------------- small components ---------------- */

function SummaryTile({ icon, title, subtitle }:{ icon: string; title: string; subtitle: string }) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <View style={s.tile}>
            <View style={[s.tileIconWrap, { backgroundColor: theme.tint }]}>
                <Text style={s.tileIcon}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.tileTitle}>{title}</Text>
                <Pressable>
                    <Text style={[s.tileLink, { color: theme.primary }]}>{subtitle}</Text>
                </Pressable>
            </View>
        </View>
    );
}

function ActivityItem({ icon, title, subtitle }:{ icon: string; title: string; subtitle: string }) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <View style={s.activity}>
            <View style={[s.activityIconWrap, { backgroundColor: theme.tint }]}>
                <Text style={[s.activityIcon, { color: theme.text }]}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.activityTitle}>{title}</Text>
                <Text style={[s.activitySub, { color: theme.primary }]}>{subtitle}</Text>
            </View>
        </View>
    );
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg, paddingHorizontal: 16 },
    header: {
        height: 52, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 6,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: t.text },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.border },

    card: {
        marginTop: 8, backgroundColor: t.card, borderRadius: 16, padding: 16,
        shadowColor: '#000',
        shadowOpacity: t.name === 'light' ? 0.05 : 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    h1: { fontSize: 28, fontWeight: '900', color: t.text },
    sub: { marginTop: 8, fontSize: 16, lineHeight: 22, color: t.textDim },

    sectionTitle: { marginTop: 16, marginBottom: 10, fontSize: 20, fontWeight: '800', color: t.text },

    row: { flexDirection: 'row', gap: 12 },

    tile: {
        flex: 1, flexDirection: 'row', gap: 12, backgroundColor: t.card, borderRadius: 16,
        padding: 14, alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: t.name === 'light' ? 0.04 : 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    tileIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    tileIcon: { fontSize: 22, color: t.text },
    tileTitle: { fontSize: 16, fontWeight: '800', color: t.text },
    tileLink: { marginTop: 4, fontSize: 15, fontWeight: '700' },

    activity: {
        flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.card,
        borderRadius: 16, padding: 14, marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: t.name === 'light' ? 0.03 : 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    activityIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    activityIcon: { fontSize: 20 },
    activityTitle: { fontSize: 18, fontWeight: '800', color: t.text },
    activitySub: { marginTop: 2, fontWeight: '700' },
});
