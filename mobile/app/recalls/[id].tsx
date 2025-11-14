import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

type AiSummary = {
    status: string;
    bullets: string[];
    error?: string;
};

export default function RecallDetails() {
    const params = useLocalSearchParams() as any;
    const { id } = params;

    const [recall, setRecall] = useState<any>(null);
    const [loadingRecall, setLoadingRecall] = useState(true);

    const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

    const BASE_URL =
        Platform.OS === 'android'
            ? 'http://10.0.2.2:3000'
            : 'http://127.0.0.1:3000';

    useEffect(() => {
        async function fetchRecallAndSummary() {
            try {
                const res = await fetch(`${BASE_URL}/api/v1/food_events/${id}`);
                const data = await res.json();
                console.log(data)
                setRecall(data);
            } catch (error) {
                console.error('Error fetching recall details:', error);
            } finally {
                setLoadingRecall(false);
            }

            try {
                setLoadingSummary(true);
                const res2 = await fetch(
                    `${BASE_URL}/api/v1/food_events/${id}/ai_summary`
                );
                const summaryData = await res2.json();
                setAiSummary(summaryData);
            } catch (error) {
                console.error('Error fetching AI summary:', error);
                setAiSummary({
                    status: 'unclear',
                    bullets: ['Unable to generate AI summary right now.'],
                    error: String(error),
                });
            } finally {
                setLoadingSummary(false);
            }
        }

        fetchRecallAndSummary();
    }, [BASE_URL, id]);

    const {
        product_description,
        recalling_firm,
        reason_for_recall,
        code_info,
        report_date,
        classification,
        product_type,
    } = recall || {};

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={12}
                >
                    <Ionicons name="chevron-back" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Recall Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Error if recall failed */}
                {!loadingRecall && !recall && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorTitle}>Recall not found</Text>
                        <Text style={styles.errorBody}>
                            We couldn’t load the details for this recall. Please try again
                            later.
                        </Text>
                    </View>
                )}

                {/* Main recall content */}
                {recall && (
                    <>
                        <Text style={styles.product}>{product_description}</Text>

                        <Image
                            source={{
                                uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTinceT4qU-by39MTOb6iTSCedX1w_PLrds3g&s',
                            }}
                            style={styles.hero}
                        />
                        {/* AI SUMMARY CARD */}
                        <AiSummaryCard loading={loadingSummary} summary={aiSummary} />
                        <Text style={styles.h2}>Reason for Recall</Text>
                        <Text style={styles.body}>
                            {reason_for_recall || 'Not provided.'}
                        </Text>

                        <View style={styles.card}>
                            <Row label="Manufacturer" value={recalling_firm || '—'} />
                            <Divider />
                            <Row label="Product Type" value={product_type || '—'} />
                            <Divider />
                            <Row label="Classification" value={classification || '—'} />
                            <Divider />
                            <Row label="Report Date" value={report_date || '—'} />
                            <Divider />
                            <Row label="Code Info" value={code_info || '—'} />
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------- AI Summary UI ---------- */

function AiSummaryCard({
                           loading,
                           summary,
                       }: {
    loading: boolean;
    summary: AiSummary | null;
}) {
    const label = 'AI Summary';

    const statusText =
        summary?.status ||
        (summary?.error ? 'Status unclear' : 'Loading…');

    const statusColor = useMemo(() => {
        const s = (summary?.status || '').toLowerCase();
        if (s.includes('likely')) return '#B91C1C'; // red
        if (s.includes('not')) return '#15803D'; // green
        return '#4B5563';
    }, [summary]);

    const bulletText = useMemo(() => {
        const bullets = summary?.bullets || [];
        if (!bullets.length) return '';
        return bullets.map((b) => `• ${b}`).join('\n');
    }, [summary]);

    return (
        <View style={aiStyles.card}>
            <View style={aiStyles.headerRow}>
                <View style={aiStyles.badge}>
                    <Ionicons name="sparkles-outline" size={14} color="#4C1D95" />
                    <Text style={aiStyles.badgeText}>{label}</Text>
                </View>
                <View style={[aiStyles.statusPill, { borderColor: statusColor }]}>
                    <View
                        style={[aiStyles.dot, { backgroundColor: statusColor }]}
                    />
                    <Text style={[aiStyles.statusText, { color: statusColor }]}>
                        {statusText}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={aiStyles.loadingRow}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text style={aiStyles.loadingText}>
                        Generating summary…
                    </Text>
                </View>
            ) : (
                <TypewriterText text={bulletText} />
            )}
        </View>
    );
}

/* ---------- Typewriter component ---------- */

function TypewriterText({
                            text,
                            speed = 15,
                        }: {
    text: string;
    speed?: number;
}) {
    const [display, setDisplay] = useState('');

    useEffect(() => {
        setDisplay('');
        if (!text) return;

        let i = 0;
        const id = setInterval(() => {
            i += 1;
            setDisplay(text.slice(0, i));
            if (i >= text.length) clearInterval(id);
        }, speed);

        return () => clearInterval(id);
    }, [text, speed]);

    return (
        <Text style={aiStyles.bodyText}>
            {display || 'No summary available.'}
        </Text>
    );
}


function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={rowStyles.row}>
            <Text style={rowStyles.label}>{label}</Text>
            <Text style={rowStyles.value}>{value}</Text>
        </View>
    );
}
function Divider() {
    return <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />;
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

    product: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        marginTop: 12,
    },
    hero: {
        width: '100%',
        height: 170,
        borderRadius: 14,
        marginBottom: 14,
        backgroundColor: '#E5E7EB',
    },
    h2: { fontWeight: '800', color: '#111827', marginTop: 6, marginBottom: 6 },
    body: { color: '#374151', lineHeight: 20 },

    card: {
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: 6,
    },

    errorCard: {
        borderRadius: 14,
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        marginTop: 8,
    },
    errorTitle: {
        fontWeight: '700',
        color: '#991B1B',
        marginBottom: 4,
    },
    errorBody: {
        color: '#B91C1C',
        fontSize: 13,
    },
});

const rowStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    label: { width: 140, color: '#6B7280', fontWeight: '600', fontSize: 13 },
    value: { flex: 1, color: '#111827', fontSize: 13 },
});

const aiStyles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#E0E7FF',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4C1D95',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 13,
        color: '#4B5563',
    },
    bodyText: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
        color: '#1F2937',
    },
});
