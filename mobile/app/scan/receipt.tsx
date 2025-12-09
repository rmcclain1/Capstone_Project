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
        if (perm.status !== 'granted') {
            return Alert.alert('Permission required', 'Camera access is needed.');
        }

        const r = await ImagePicker.launchCameraAsync({
            quality: 0.85,
            allowsEditing: true
        });

        if (!r.canceled && r.assets?.[0]?.uri) {
            setUri(r.assets[0].uri);
            setResult(null); // Clear previous results
        }
    }, []);

    const pollReceipt = async (receiptId: string, maxAttempts = 10): Promise<any> => {
        for (let i = 0; i < maxAttempts; i++) {
            const receipt = await getReceipt(receiptId);

            if (receipt.status === 'done') {
                return receipt;
            } else if (receipt.status === 'failed') {
                throw new Error('Receipt processing failed');
            }

            // Wait 2 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error('Receipt processing timeout');
    };

    const submit = useCallback(async () => {
        if (!uri) {
            Alert.alert('Error', 'Please take a photo first');
            return;
        }

        setLoading(true);
        try {
            const upload = await uploadReceipt(uri);

            if (upload.status === 'processing') {
                // Poll until complete
                const done = await pollReceipt(upload.id);
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
        if (!result?.items?.length) {
            Alert.alert('No items', 'No items found to add');
            return;
        }

        setLoading(true);
        try {
            const promises = result.items.map((it: any) =>
                http.post('/api/v1/pantries', {
                    pantry: {
                        item_name: it.name || it.raw,
                        manufacturer: it.matched?.brand,
                        category: it.matched?.category,
                        image_url: it.matched?.image_url,
                        
                        // Default values
                        quantity: it.qty || 1,
                    }
                })
            );

            await Promise.all(promises);
            Alert.alert('Success', `Added ${result.items.length} items to pantry`);

            // Reset for next scan
            setUri(null);
            setResult(null);
        } catch (e: any) {
            const msg = e?.response?.data?.errors?.join(', ') || e.message || 'Failed to add items';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    }, [result]);

    return (
        <View style={{ flex: 1, padding: 16 }}>
            {!uri ? (
                <Pressable onPress={pick} style={styles.card}>
                    <Text style={styles.btnText}>Take Receipt Photo</Text>
                </Pressable>
            ) : (
                <>
                    <Image
                        source={{ uri }}
                        style={{ width: '100%', height: 320, borderRadius: 12 }}
                        resizeMode="contain"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <Pressable
                            onPress={pick}
                            style={[styles.card, styles.secondaryBtn, { flex: 1 }]}
                            disabled={loading}
                        >
                            <Text style={[styles.btnText, styles.secondaryText]}>Retake</Text>
                        </Pressable>
                        <Pressable
                            onPress={submit}
                            style={[styles.card, { flex: 1 }]}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>Upload & Parse</Text>
                        </Pressable>
                    </View>
                </>
            )}

            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 8 }}>Processing...</Text>
                </View>
            )}

            {result && !loading && (
                <View style={{ marginTop: 16 }}>
                    <Text style={styles.h}>Detected Items</Text>
                    {result.items?.length ? (
                        <>
                            {result.items.map((it: any, i: number) => (
                                <View key={i} style={styles.itemRow}>
                                    <Text style={{ flex: 1 }}>
                                        {it.matched?.name || it.name || it.raw}
                                    </Text>
                                    <Text style={{ width: 40, textAlign: 'right' }}>
                                        x{it.qty || 1}
                                    </Text>
                                </View>
                            ))}
                            <Pressable
                                onPress={addAll}
                                style={[styles.card, { marginTop: 12 }]}
                            >
                                <Text style={styles.btnText}>
                                    Add All to Pantry ({result.items.length})
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <Text style={{ color: '#666', fontStyle: 'italic' }}>
                            No items detected in receipt
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        height: 56,
        borderRadius: 14,
        backgroundColor: '#2362FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    secondaryBtn: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    btnText: {
        color: 'white',
        fontWeight: '700'
    },
    secondaryText: {
        color: '#333',
    },
    center: {
        marginTop: 16,
        gap: 8,
        alignItems: 'center'
    },
    h: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#ddd'
    }
});