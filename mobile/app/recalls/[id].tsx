import React from 'react';
import {View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RecallDetails() {
    const params = useLocalSearchParams() as any;

    const {
        productName = params.title,
        image = params.image,
        reason = 'Reason not provided.',
        batchLot = '—',
        affectedDates = '—',
        upc = '—',
        manufacturer = '—',
        authority = '—',
        actions = 'Follow official instructions from the issuing authority.',
    } = params;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                    <Ionicons name="chevron-back" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Recall Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.product}>{productName}</Text>

                {/* Image */}
                <Image source={{ uri: image as string }} style={styles.hero} />

                {/* Reason */}
                <Text style={styles.h2}>Reason for Recall</Text>
                <Text style={styles.body}>{reason}</Text>

                <View style={styles.card}>
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

                {/* What to Do */}
                <Text style={[styles.h2, { marginTop: 14 }]}>What to Do</Text>
                <Text style={styles.body}>{actions}</Text>
            </ScrollView>
        </SafeAreaView>
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

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 10, paddingVertical: 10,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6',
        alignItems: 'center', justifyContent: 'center',
    },
    topTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

    product: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
    hero: {
        width: '100%', height: 170, borderRadius: 14, marginBottom: 14,
        backgroundColor: '#E5E7EB',
    },
    h2: { fontWeight: '800', color: '#111827', marginTop: 6, marginBottom: 6 },
    body: { color: '#374151', lineHeight: 20 },

    card: {
        marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF',
        paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6,
    },
});

const rowStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    label: { width: 140, color: '#6B7280', fontWeight: '600', fontSize: 13 },
    value: { flex: 1, color: '#111827', fontSize: 13 },
});
