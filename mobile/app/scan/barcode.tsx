// mobile/app/scan/barcode.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { lookupBarcode } from '@/api/barcodes';
import http from '@/lib/http';

export default function BarcodeScan() {
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const onBarCodeScanned = useCallback(async (e: any) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);

        try {
            const upc = String(e.data || '').replace(/\D/g, '');

            if (!upc || upc.length < 8) {
                throw new Error('Invalid barcode format');
            }

            const result = await lookupBarcode(upc);

            if (!result) {
                throw new Error(`No product found for barcode: ${upc}`);
            }

            setProduct(result);
        } catch (err: any) {
            Alert.alert(
                'Scan Failed',
                err.message || String(err),
                [
                    { text: 'Try Again', onPress: () => setScanned(false) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
            setScanned(false);
        } finally {
            setLoading(false);
        }
    }, [scanned, loading]);

    const addToPantry = useCallback(async () => {
        if (!product) return;

        setLoading(true);
        try {
            await http.post('/api/v1/pantries', {
                pantry: {
                    item_name: product.name,
                    // Optinonal fields
                    manufacturer: product.brand,
                    category: product.category,
                    image_url: product.image_url,

                    // Default values
                    quantity: 1,
                  
                }
            });

            Alert.alert(
                'Success',
                `${product.name} added to your pantry`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (e: any) {
            const msg = e?.response?.data?.errors?.join(', ') || e.message || 'Failed to add item';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    }, [product, router]);

    const resetScanner = useCallback(() => {
        setScanned(false);
        setProduct(null);
        setLoading(false);
    }, []);

    if (hasPermission === null) {
        return (
            <View style={styles.center}>
                <Text>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 16, marginBottom: 16 }}>
                    Camera access is required to scan barcodes
                </Text>
                <Pressable
                    onPress={() => BarCodeScanner.requestPermissionsAsync()}
                    style={styles.btn}
                >
                    <Text style={styles.btnText}>Grant Permission</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {!product ? (
                <>
                    <BarCodeScanner
                        onBarCodeScanned={scanned ? undefined : onBarCodeScanned}
                        style={{ flex: 1 }}
                    />
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <Text style={{ color: 'white', fontSize: 16 }}>
                                Looking up product...
                            </Text>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.resultWrap}>
                    {product.image_url ? (
                        <Image
                            source={{ uri: product.image_url }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    ) : null}

                    <Text style={styles.title}>{product.name}</Text>
                    {product.brand ? <Text style={styles.sub}>{product.brand}</Text> : null}
                    {product.category ? <Text style={styles.sub}>{product.category}</Text> : null}

                    <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
                        <Pressable
                            onPress={resetScanner}
                            style={[styles.btn, styles.secondary]}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>Scan Another</Text>
                        </Pressable>
                        <Pressable
                            onPress={addToPantry}
                            style={styles.btn}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>
                                {loading ? 'Adding...' : 'Add to Pantry'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 8
    },
    image: {
        width: 160,
        height: 160,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    sub: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
    },
    btn: {
        width: '100%',
        paddingHorizontal: 18,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#2362FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    secondary: {
        backgroundColor: '#888'
    },
    btnText: {
        color: 'white',
        fontWeight: '700'
    },
});