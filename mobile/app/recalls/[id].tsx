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
import { useTheme } from '@/constants/theme_provider';

type AiSummary = {
    status: string;
    bullets: string[];
    error?: string;
};

export default function RecallDetails() {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);
    const aiStyles = useMemo(() => makeAiStyles(theme), [theme]);

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
        <SafeAreaView style={s.screen}>
            <View style={s.topBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={s.backBtn}
                    hitSlop={12}
                >
                    <Ionicons name="chevron-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.topTitle}>Recall Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                showsVerticalScrollIndicator={false}
            >
                {!loadingRecall && !recall && (
                    <View style={s.errorCard}>
                        <Text style={s.errorTitle}>Recall not found</Text>
                        <Text style={s.errorBody}>
                            We couldn’t load the details for this recall. Please try again later.
                        </Text>
                    </View>
                )}

                {recall && (
                    <>
                        <Text style={s.product}>{product_description}</Text>

                        <Image
                            source={{
                                uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTinceT4qU-by39MTOb6iTSCedX1w_PLrds3g&s',
                            }}
                            style={s.hero}
                        />

                        <AiSummaryCard loading={loadingSummary} summary={aiSummary} theme={theme} aiStyles={aiStyles} />

                        <Text style={[s.h2, { color: theme.text }]}>Reason for Recall</Text>
                        <Text style={[s.body, { color: theme.text }]}>{reason_for_recall || 'Not provided.'}</Text>

                        <View style={s.card}>
                            <Row label="Manufacturer" value={recalling_firm || '—'} theme={theme} />
                            <Divider theme={theme} />
                            <Row label="Product Type" value={product_type || '—'} theme={theme} />
                            <Divider theme={theme} />
                            <Row label="Classification" value={classification || '—'} theme={theme} />
                            <Divider theme={theme} />
                            <Row label="Report Date" value={report_date || '—'} theme={theme} />
                            <Divider theme={theme} />
                            <Row label="Code Info" value={code_info || '—'} theme={theme} />
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function AiSummaryCard({
    loading,
    summary,
    theme,
    aiStyles,
}: {
    loading: boolean;
    summary: AiSummary | null;
    theme: any;
    aiStyles: any;
}) {
    const label = 'AI Summary';

    const statusText =
        summary?.status || (summary?.error ? 'Status unclear' : 'Loading…');

    const statusColor = useMemo(() => {
        const s = (summary?.status || '').toLowerCase();
        if (s.includes('likely')) return '#B91C1C';
        if (s.includes('not')) return '#15803D';
        return theme.text;
    }, [summary, theme]);

    const bulletText = useMemo(() => {
        const bullets = summary?.bullets || [];
        if (!bullets.length) return '';
        return bullets.map((b) => `• ${b}`).join('\n');
    }, [summary]);

    return (
        <View style={aiStyles.card}>
            <View style={aiStyles.headerRow}>
                <View style={aiStyles.badge}>
                    <Ionicons name="sparkles-outline" size={14} color={theme.primary} />
                    <Text style={[aiStyles.badgeText, { color: theme.primary }]}>{label}</Text>
                </View>
                <View style={[aiStyles.statusPill, { borderColor: statusColor }]}>
                    <View style={[aiStyles.dot, { backgroundColor: statusColor }]} />
                    <Text style={[aiStyles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>
            </View>

            {loading ? (
                <View style={aiStyles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[aiStyles.loadingText, { color: theme.textSecondary }]}>
                        Generating summary…
                    </Text>
                </View>
            ) : (
                <TypewriterText text={bulletText} theme={theme} aiStyles={aiStyles} />
            )}
        </View>
    );
}

function TypewriterText({
    text,
    speed = 15,
    theme,
    aiStyles,
}: {
    text: string;
    speed?: number;
    theme: any;
    aiStyles: any;
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

    return <Text style={[aiStyles.statusText, { color: theme.text, lineHeight: 20 }]}>{display || 'No summary available.'}</Text>;
}

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ width: 140, color: theme.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
            <Text style={{ flex: 1, color: theme.text, fontSize: 13 }}>{value}</Text>
        </View>
    );
}

function Divider({ theme }: { theme: any }) {
    return <View style={{ height: 1, backgroundColor: theme.border }} />;
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.bg },
        topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10 },
        backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' },
        topTitle: { fontSize: 16, fontWeight: '800', color: t.text },
        product: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 8, marginTop: 12 },
        hero: { width: '100%', height: 170, borderRadius: 14, marginBottom: 14, backgroundColor: t.border },
        h2: { fontWeight: '800', marginTop: 6, marginBottom: 6 },
        body: { lineHeight: 20 },
        card: { marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.card, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6 },
        errorCard: { borderRadius: 14, padding: 12, backgroundColor: t.errorBg, borderWidth: 1, borderColor: t.errorBorder, marginTop: 8 },
        errorTitle: { fontWeight: '700', marginBottom: 4 },
        errorBody: { fontSize: 13 },
    });

const makeAiStyles = (t: any) =>
    StyleSheet.create({
        card: { borderRadius: 16, padding: 12, marginBottom: 8, backgroundColor: t.aiCard, borderWidth: 1, borderColor: t.aiBorder },
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: t.aiBadge },
        badgeText: { fontSize: 12, fontWeight: '700' },
        statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, backgroundColor: t.card },
        dot: { width: 7, height: 7, borderRadius: 999, marginRight: 6 },
        statusText: { fontSize: 12, fontWeight: '700' },
        loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        loadingText: { fontSize: 13 },
    });
