// mobile/app/recalls/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/constants/theme_provider';
import { fetchFoodEvent, type FoodEvent } from '@/lib/recalls';

export default function RecallDetails() {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const params = useLocalSearchParams<{ id: string; title?: string; issuer?: string; image?: string }>();
    const [item, setItem] = useState<FoodEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadRecall() {
            try {
                console.log('[RecallDetail] Loading ID:', params.id);
                setLoading(true);
                setError(null);

                const fe = await fetchFoodEvent(Number(params.id));
                console.log('[RecallDetail] Loaded:', fe.product_description);

                if (!cancelled) {
                    setItem(fe);
                }
            } catch (e: any) {
                console.error('[RecallDetail] Load error:', e?.response?.data || e.message);
                if (!cancelled) {
                    setError(e?.response?.data?.error || e.message || 'Failed to load recall details');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadRecall();

        return () => {
            cancelled = true;
        };
    }, [params.id]);

    const title = item?.product_description || params.title || 'Recall';

    const handleShare = () => {
        Alert.alert('Share', 'Share functionality coming soon!');
    };

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Recall Details</Text>
                <Pressable hitSlop={12} onPress={handleShare}>
                    <Ionicons name="share-outline" size={24} color={theme.text} />
                </Pressable>
            </View>

            {loading ? (
                <View style={s.centerContent}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[s.loadingText, { color: theme.textDim }]}>Loading recall details...</Text>
                </View>
            ) : error ? (
                <View style={s.centerContent}>
                    <Ionicons name="alert-circle-outline" size={64} color={theme.danger || '#EF4444'} />
                    <Text style={[s.errorTitle, { color: theme.text }]}>Failed to Load</Text>
                    <Text style={[s.errorText, { color: theme.textDim }]}>{error}</Text>
                    <Pressable style={[s.retryButton, { backgroundColor: theme.primary }]} onPress={() => {
                        setLoading(true);
                        setError(null);
                        // Trigger reload
                    }}>
                        <Text style={s.retryText}>Try Again</Text>
                    </Pressable>
                </View>
            ) : !item ? (
                <View style={s.centerContent}>
                    <Ionicons name="document-outline" size={64} color={theme.textDim} />
                    <Text style={[s.errorTitle, { color: theme.text }]}>Recall Not Found</Text>
                    <Text style={[s.errorText, { color: theme.textDim }]}>
                        This recall may have been removed or doesn't exist.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.content}>
                    {/* Title */}
                    <Text style={s.title}>{title}</Text>

                    {/* Classification Badge */}
                    {item.classification && (
                        <View style={[s.badge, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                            <Text style={[s.badgeText, { color: theme.primary }]}>
                                Class {item.classification}
                            </Text>
                        </View>
                    )}

                    {/* Key Info Card */}
                    <View style={[s.card, { backgroundColor: theme.card }]}>
                        <InfoRow icon="business-outline" label="Firm" value={item.recalling_firm} />
                        <InfoRow icon="location-outline" label="Location" value={[item.city, item.state].filter(Boolean).join(', ')} />
                        <InfoRow icon="calendar-outline" label="Report Date" value={item.report_date || '—'} />
                        <InfoRow icon="alert-circle-outline" label="Status" value={item.status} />
                    </View>

                    {/* Reason Section */}
                    <Text style={s.sectionTitle}>Reason for Recall</Text>
                    <View style={[s.card, { backgroundColor: theme.card }]}>
                        <Text style={s.body}>{item.reason_for_recall || 'No reason provided'}</Text>
                    </View>

                    {/* Code Info Section */}
                    {item.code_info && (
                        <>
                            <Text style={s.sectionTitle}>Product Code Information</Text>
                            <View style={[s.card, { backgroundColor: theme.card }]}>
                                <Text style={s.body}>{item.code_info}</Text>
                            </View>
                        </>
                    )}

                    {/* Additional Details */}
                    <Text style={s.sectionTitle}>Additional Details</Text>
                    <View style={[s.card, { backgroundColor: theme.card }]}>
                        {item.recall_number && (
                            <InfoRow icon="document-text-outline" label="Recall #" value={item.recall_number} />
                        )}
                        {item.product_type && (
                            <InfoRow icon="cube-outline" label="Product Type" value={item.product_type} />
                        )}
                        {item.recall_initiation_date && (
                            <InfoRow icon="calendar-outline" label="Initiated" value={item.recall_initiation_date} />
                        )}
                    </View>

                    <View style={{ height: 24 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

/* ---------------- InfoRow Component ---------------- */

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    if (!value || value === '—') return null;

    return (
        <View style={s.infoRow}>
            <Ionicons name={icon as any} size={20} color={theme.primary} style={s.infoIcon} />
            <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.bg },
        header: {
            height: 52,
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: t.border,
        },
        headerTitle: { fontSize: 18, fontWeight: '800', color: t.text },
        content: { padding: 16 },
        title: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 12, lineHeight: 28 },
        badge: {
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            marginBottom: 16,
        },
        badgeText: { fontSize: 12, fontWeight: '700' },
        card: {
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: t.name === 'light' ? 0.04 : 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: t.text,
            marginBottom: 12,
            marginTop: 8,
        },
        body: { fontSize: 15, color: t.text, lineHeight: 22 },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 12,
        },
        infoIcon: { marginRight: 12, marginTop: 2 },
        infoLabel: { fontSize: 12, color: t.textDim, marginBottom: 2 },
        infoValue: { fontSize: 15, color: t.text, fontWeight: '600' },
        centerContent: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        loadingText: { marginTop: 16, fontSize: 14 },
        errorTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
        errorText: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
        retryButton: {
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
        },
        retryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    });