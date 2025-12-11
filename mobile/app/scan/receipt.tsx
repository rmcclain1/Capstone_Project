// mobile/app/scan/receipt.tsx
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Alert,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadReceipt, getReceipt } from '@/api/receipts';
import http from '@/lib/http';
import { useRouter } from 'expo-router';

export default function ReceiptScan() {
    const router = useRouter();
    const [uri, setUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [processingStatus, setProcessingStatus] = useState('');

    const resetState = () => {
        setUri(null);
        setResult(null);
        setProcessingStatus('');
    };

    const pick = useCallback(async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
            return Alert.alert(
                'Permission required',
                'Camera access is needed to scan receipts.'
            );
        }

        const r = await ImagePicker.launchCameraAsync({
            quality: 0.85,
            allowsEditing: true,
        });

        if (!r.canceled && r.assets?.[0]?.uri) {
            setUri(r.assets[0].uri);
            setResult(null);
            setProcessingStatus('');
        }
    }, []);

    const pollReceipt = async (receiptId: string, maxAttempts = 15): Promise<any> => {
        for (let i = 0; i < maxAttempts; i++) {
            setProcessingStatus(`Processing receipt... (${i + 1}/${maxAttempts})`);

            const receipt = await getReceipt(receiptId);

            if (receipt.status === 'done') {
                setProcessingStatus('Processing complete!');
                return receipt;
            } else if (receipt.status === 'failed') {
                throw new Error('Receipt processing failed on server');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error('Receipt processing timeout - please try again');
    };

    const submit = useCallback(async () => {
        if (!uri) {
            Alert.alert('Error', 'Please take a photo first');
            return;
        }

        setLoading(true);
        setProcessingStatus('Uploading receipt...');

        try {
            const upload = await uploadReceipt(uri);
            console.log('[Receipt] Upload response:', upload);

            if (upload.status === 'processing') {
                setProcessingStatus('Receipt uploaded, processing...');
                const done = await pollReceipt(upload.id);
                setResult(done);

                if (!done.items || done.items.length === 0) {
                    Alert.alert(
                        'No Items Found',
                        "We couldn't detect any items in this receipt. Please try:\n\n• Better lighting\n• Clearer image\n• Flattening the receipt\n\nWould you like to try again?",
                        [
                            { text: 'Retry', onPress: pick },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );
                }
            } else if (upload.status === 'done') {
                setResult(upload);
            } else {
                throw new Error('Unexpected upload status: ' + upload.status);
            }
        } catch (e: any) {
            console.error('[Receipt] Error:', e);
            const errorMsg = e?.response?.data?.error || e.message || 'Upload failed';
            Alert.alert(
                'Upload Failed',
                `${errorMsg}\n\nPlease try again with:\n• Better lighting\n• Less glare\n• Clearer image`,
                [
                    { text: 'Retry', onPress: pick },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
            setProcessingStatus('');
        } finally {
            setLoading(false);
        }
    }, [uri, pick]);

    const addAll = useCallback(async () => {
        if (!result?.items?.length) {
            Alert.alert('No items', 'No items found to add to pantry');
            return;
        }

        setLoading(true);
        try {
            const promises = result.items.map((it: any) =>
                http.post('/api/v1/pantries', {
                    pantry: {
                        item_name: it.name || it.raw || 'Unknown Item',
                        manufacturer: it.matched?.brand,
                        category: it.matched?.category,
                        image_url: it.matched?.image_url,
                        quantity: it.qty || 1,
                    },
                })
            );

            await Promise.all(promises);
            Alert.alert(
                'Success!',
                `Added ${result.items.length} item${result.items.length > 1 ? 's' : ''} to your pantry`,
                [{ text: 'View Pantry', onPress: () => router.push('/(tabs)/pantry') }]
            );

            resetState();
        } catch (e: any) {
            const msg =
                e?.response?.data?.errors?.join(', ') ||
                e.message ||
                'Failed to add items';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    }, [result, router]);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
            <Text style={styles.title}>Scan Receipt</Text>

            {!uri ? (
                <View>
                    <Text style={styles.helpText}>
                        Tips for best results:{'\n'}
                        • Ensure good lighting{'\n'}
                        • Flatten the receipt{'\n'}
                        • Avoid glare and shadows
                    </Text>
                    <Pressable onPress={pick} style={styles.card}>
                        <Text style={styles.btnText}>Take Receipt Photo</Text>
                    </Pressable>
                </View>
            ) : (
                <>
                    <Image
                        source={{ uri }}
                        style={{
                            width: '100%',
                            height: 320,
                            borderRadius: 12,
                            marginBottom: 12,
                        }}
                        resizeMode="contain"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <Pressable
                            onPress={pick}
                            style={[styles.card, styles.secondaryBtn, { flex: 1 }]}
                            disabled={loading}
                        >
                            <Text
                                style={[styles.btnText, styles.secondaryText]}
                            >
                                Retake
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={submit}
                            style={[
                                styles.card,
                                { flex: 1 },
                                loading && { opacity: 0.6 },
                            ]}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>Upload & Parse</Text>
                        </Pressable>
                    </View>

                    {/* Cancel button */}
                    <View style={{ alignItems: 'center' }}>
                        <Pressable
                            onPress={() => {
                                resetState();
                                router.back();
                            }}
                            style={[
                                styles.card,
                                styles.secondaryBtn,
                                { marginTop: 12, width: '60%' },
                            ]}
                            disabled={loading}
                        >
                            <Text
                                style={[styles.btnText, styles.secondaryText]}
                            >
                                Cancel
                            </Text>
                        </Pressable>
                    </View>
                </>
            )}

            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2362FF" />
                    <Text
                        style={{ marginTop: 8, fontSize: 14, color: '#666' }}
                    >
                        {processingStatus || 'Processing...'}
                    </Text>
                </View>
            )}

            {result && !loading && (
                <View style={{ marginTop: 16 }}>
                    <Text style={styles.h}>
                        Detected Items ({result.items?.length || 0})
                    </Text>
                    {result.items?.length ? (
                        <>
                            {result.items.map((it: any, i: number) => (
                                <View key={i} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontWeight: '600',
                                                fontSize: 15,
                                            }}
                                        >
                                            {it.matched?.name ||
                                                it.name ||
                                                it.raw ||
                                                'Unknown Item'}
                                        </Text>
                                        {it.matched?.brand && (
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: '#666',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {it.matched.brand}
                                            </Text>
                                        )}
                                    </View>
                                    <Text
                                        style={{
                                            width: 50,
                                            textAlign: 'right',
                                            fontWeight: '600',
                                            fontSize: 15,
                                        }}
                                    >
                                        × {it.qty || 1}
                                    </Text>
                                </View>
                            ))}
                            <Pressable
                                onPress={addAll}
                                style={[styles.card, { marginTop: 16 }]}
                            >
                                <Text style={styles.btnText}>
                                    Add All to Pantry ({result.items.length})
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text
                                style={{
                                    color: '#666',
                                    fontStyle: 'italic',
                                    textAlign: 'center',
                                }}
                            >
                                No items detected in receipt.{'\n'}Try retaking
                                with better lighting.
                            </Text>
                            <Pressable
                                onPress={pick}
                                style={[
                                    styles.card,
                                    styles.secondaryBtn,
                                    { marginTop: 12, width: '100%' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.btnText,
                                        styles.secondaryText,
                                    ]}
                                >
                                    Retake Photo
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    card: {
        height: 56,
        borderRadius: 14,
        backgroundColor: '#2362FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    secondaryBtn: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    btnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryText: {
        color: '#333',
    },
    center: {
        marginTop: 24,
        gap: 8,
        alignItems: 'center',
        padding: 20,
    },
    h: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        color: '#111',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#ddd',
        gap: 12,
    },
    helpText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 8,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
});
