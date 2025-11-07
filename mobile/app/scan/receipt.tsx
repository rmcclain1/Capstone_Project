// mobile/app/scan/receipt.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Alert, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadReceipt, getReceipt } from '@/api/receipts';
import http from '@/lib/http';

export default function ReceiptScan() {
    const [uri, setUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const pick = useCallback(async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') return Alert.alert('Permission required', 'Camera access is needed.');
        const r = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true });
        if (!r.canceled && r.assets?.[0]?.uri) setUri(r.assets[0].uri);
    }, []);

    const submit = useCallback(async () => {
        if (!uri) return;
        setLoading(true);
        try {
            const upload = await uploadReceipt(uri);
            if (upload.status === 'processing') {
                const done = await getReceipt(upload.id);
                setResult(done);
            } else {
                setResult(upload);
            }
        } catch (e: any) {
            Alert.alert('Upload failed', e?.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    }, [uri]);

    const addAll = useCallback(async () => {
        if (!result?.items?.length) return;
        try {
            await Promise.all(
                (result.items || []).map((it: any) =>
                    http.post('/api/v1/pantries', {
                        pantry: {
                            item_name: it.name || it.raw,
                            // manufacturer: it.matched?.brand, // send if you have it
                            // category: 'receipt',             // optional: your schema supports it
                            // image_url: someUrlIfYouHaveIt    // safe only if you later add the column
                        }
                    })
                )
            );
            Alert.alert('Added', 'Receipt items added to pantry.');
        } catch (e: any) {
            const msg = e?.response?.data?.errors?.join(', ') || e.message || 'Failed to add';
            Alert.alert('Error', msg);
        }
    }, [result]);

    return (
        <View style={{ flex: 1, padding: 16 }}>
            {!uri ? (
                <Pressable onPress={pick} style={styles.card}><Text style={styles.btnText}>Take Receipt Photo</Text></Pressable>
            ) : (
                <>
                    <Image source={{ uri }} style={{ width: '100%', height: 320, borderRadius: 12 }} />
                    <Pressable onPress={submit} style={[styles.card, { marginTop: 12 }]}><Text style={styles.btnText}>Upload & Parse</Text></Pressable>
                </>
            )}

            {loading && (
                <View style={styles.center}><ActivityIndicator /><Text>Parsing…</Text></View>
            )}

            {result && (
                <View style={{ marginTop: 16 }}>
                    <Text style={styles.h}>Detected Items</Text>
                    {result.items?.length ? result.items.map((it: any, i: number) => (
                        <View key={i} style={styles.itemRow}>
                            <Text style={{ flex: 1 }}>{it.matched?.name || it.name || it.raw}</Text>
                            <Text style={{ width: 40, textAlign: 'right' }}>x{it.qty || 1}</Text>
                        </View>
                    )) : <Text>No items parsed yet.</Text>}

                    {result.items?.length ? (
                        <Pressable onPress={addAll} style={[styles.card, { marginTop: 12 }]}>
                            <Text style={styles.btnText}>Add All To Pantry</Text>
                        </Pressable>
                    ) : null}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { height: 56, borderRadius: 14, backgroundColor: '#2362FF', alignItems: 'center', justifyContent: 'center' },
    btnText: { color: 'white', fontWeight: '700' },
    center: { marginTop: 16, gap: 8, alignItems: 'center' },
    h: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' }
});
