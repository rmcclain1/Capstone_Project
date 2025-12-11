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
    useColorScheme,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadReceipt, getReceipt } from '@/api/receipts';
import http from '@/lib/http';
import { useRouter } from 'expo-router';

export default function ReceiptScan() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Theme-aware colors
    const bgColor = isDark ? '#020617' : '#FFFFFF';
    const titleColor = isDark ? '#F9FAFB' : '#111827';
    const subtitleColor = isDark ? '#9CA3AF' : '#4B5563';
    const cardBg = '#2362FF';
    const secondaryBg = isDark ? '#111827' : '#F0F0F0';
    const secondaryBorder = isDark ? '#374151' : '#DDDDDD';
    const secondaryTextColor = isDark ? '#E5E7EB' : '#333333';
    const itemTextColor = isDark ? '#F9FAFB' : '#111827';
    const itemBorderColor = isDark ? '#374151' : '#DDDDDD';
    const helpBg = isDark ? '#111827' : '#F3F4F6';

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
                'Camera access is needed to scan receipts.',
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
                        ],
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
                ],
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
                }),
            );

            await Promise.all(promises);
            Alert.alert(
                'Success!',
                `Added ${result.items.length} item${result.items.length > 1 ? 's' : ''} to your pantry`,
                [{ text: 'View Pantry', onPress: () => router.push('/(tabs)/pantry') }],
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
            style={[styles.container, { backgroundColor: bgColor }]}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
            <Text style={[styles.title, { color: titleColor }]}>Scan Receipt</Text>

            {!uri ? (
                <View>
                    <Text
                        style={[
                            styles.helpText,
                            { color: subtitleColor, backgroundColor: helpBg },
                        ]}
                    >
                        Tips for best results:{'\n'}
                        • Ensure good lighting{'\n'}
                        • Flatten the receipt{'\n'}
                        • Avoid glare and shadows
                    </Text>
                    <Pressable
                        onPress={pick}
                        style={[styles.card, { backgroundColor: cardBg }]}
                    >
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
                            style={[
                                styles.card,
                                styles.secondaryBtn,
                                {
                                    flex: 1,
                                    backgroundColor: secondaryBg,
                                    borderColor: secondaryBorder,
                                },
                            ]}
                            disabled={loading}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    styles.secondaryText,
                                    { color: secondaryTextColor },
                                ]}
                            >
                                Retake
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={submit}
                            style={[
                                styles.card,
                                { flex: 1, backgroundColor: cardBg },
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
                                {
                                    marginTop: 12,
                                    width: '60%',
                                    backgroundColor: secondaryBg,
                                    borderColor: secondaryBorder,
                                },
                            ]}
                            disabled={loading}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    styles.secondaryText,
                                    { color: secondaryTextColor },
                                ]}
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
                        style={{
                            marginTop: 8,
                            fontSize: 14,
                            color: subtitleColor,
                        }}
                    >
                        {processingStatus || 'Processing...'}
                    </Text>
                </View>
            )}

            {result && !loading && (
                <View style={{ marginTop: 16 }}>
                    <Text style={[styles.h, { color: titleColor }]}>
                        Detected Items ({result.items?.length || 0})
                    </Text>
                    {result.items?.length ? (
                        <>
                            {result.items.map((it: any, i: number) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.itemRow,
                                        { borderColor: itemBorderColor },
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontWeight: '600',
                                                fontSize: 15,
                                                color: itemTextColor,
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
                                                    color: subtitleColor,
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
                                            color: itemTextColor,
                                        }}
                                    >
                                        × {it.qty || 1}
                                    </Text>
                                </View>
                            ))}
                            <Pressable
                                onPress={addAll}
                                style={[
                                    styles.card,
                                    { marginTop: 16, backgroundColor: cardBg },
                                ]}
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
                                    color: subtitleColor,
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
                                    {
                                        marginTop: 12,
                                        width: '100%',
                                        backgroundColor: secondaryBg,
                                        borderColor: secondaryBorder,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.btnText,
                                        styles.secondaryText,
                                        { color: secondaryTextColor },
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
    container: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
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
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#DDDDDD',
    },
    btnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryText: {
        color: '#333333',
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
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#DDDDDD',
        gap: 12,
    },
    helpText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
    },
});
