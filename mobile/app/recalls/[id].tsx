// app/recalls/[id].tsx
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    Pressable,
    SafeAreaView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/constants/theme_provider';

export default function RecallDetails() {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const params = useLocalSearchParams() as Record<string, string | undefined>;

    const {
        title,
        image,
        reason = 'Reason not provided.',
        batchLot = '—',
        affectedDates = '—',
        upc = '—',
        manufacturer = '—',
        authority = '—',
        actions = 'Follow official instructions from the issuing authority.',
    } = params;

    // prefer `productName` if present, else fallback to `title`
    const productName = params.productName || title || 'Product';

    // basic image fallback
    const [imgUri, setImgUri] = useState(
        image || 'https://i.pravatar.cc/300?img=15'
    );

    return (
        <SafeAreaView style={s.safe}>
            {/* Top bar */}
            <View style={s.topBar}>
                <Pressable
                    onPress={() => router.back()}
                    style={s.backBtn}
                    hitSlop={12}
                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                >
                    <Ionicons name="chevron-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={s.topTitle}>Recall Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={s.product}>{productName}</Text>

                {/* Image */}
                <Image
                    source={{ uri: imgUri }}
                    style={s.hero}
                    onError={() =>
                        setImgUri('https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=640&q=60')
                    }
                />

                {/* Reason */}
                <Text style={s.h2}>Reason for Recall</Text>
                <Text style={s.body}>{reason}</Text>

                <View style={s.card}>
                    <Row label="Batch/Lot Numbers" value={batchLot} />
                    <Divider />
                    <Row label="Affected Dates" value={affectedDates} />
                    <Divider />
                    <Row label="UPC/Barcode" value={upc} />
                    <Divider />
                    <Row label="Manufacturer" value={manufacturer} />
                    <Divider />
                    <Row label="Issuing Authority" value={authority} />
                </View>

                <Text style={[s.h2, { marginTop: 14 }]}>What to Do</Text>
                <Text style={s.body}>{actions}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function Row({ label, value }: { label: string; value?: string }) {
    const { theme } = useTheme();
    const rs = useMemo(() => makeRowStyles(theme), [theme]);
    return (
        <View style={rs.row}>
            <Text style={rs.label}>{label}</Text>
            <Text style={rs.value}>{value || '—'}</Text>
        </View>
    );
}

function Divider() {
    const { theme } = useTheme();
    return <View style={{ height: 1, backgroundColor: theme.border }} />;
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: t.bg },
        content: { padding: 16, paddingBottom: 28 },
        topBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingVertical: 10,
            backgroundColor: t.bg,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: t.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        topTitle: { fontSize: 16, fontWeight: '800', color: t.text },

        product: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 8 },
        hero: {
            width: '100%',
            height: 170,
            borderRadius: 14,
            marginBottom: 14,
            backgroundColor: t.border,
        },
        h2: { fontWeight: '800', color: t.text, marginTop: 6, marginBottom: 6 },
        body: { color: t.textDim, lineHeight: 20 },

        card: {
            marginTop: 12,
            borderRadius: 14,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            backgroundColor: t.card,
            paddingHorizontal: 12,
            paddingTop: 6,
            paddingBottom: 6,
        },
    });

const makeRowStyles = (t: any) =>
    StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
        label: { width: 140, color: t.textDim, fontWeight: '600', fontSize: 13 },
        value: { flex: 1, color: t.text, fontSize: 13 },
    });
