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

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const onBarCodeScanned = useCallback(async (e: any) => {
        if (scanned) return;
        setScanned(true);
        try {
            const upc = String(e.data || '').replace(/\D/g, '');
            if (!upc) throw new Error('No UPC detected');
            const result = await lookupBarcode(upc);
            if (!result) throw new Error('No product found for ' + upc);
            setProduct(result);
        } catch (err: any) {
            Alert.alert('Scan failed', err.message || String(err));
            setScanned(false);
        }
    }, [scanned]);

    const addToPantry = useCallback(async () => {
        if (!product) return;
        try {
            await http.post('/api/v1/pantries', {
                pantry: {
                    item_name: product.name,
                    manufacturer: product.brand,
                    category: product.category,
                    // image_url is safe to send if you later add the column; your controller filters by columns
                    image_url: product.image_url
                }
            });
            Alert.alert('Added', `${product.name} added to your pantry.`);
            router.back();
        } catch (e: any) {
            const msg = e?.response?.data?.errors?.join(', ') || e.message || 'Failed to add';
            Alert.alert('Error', msg);
        }
    }, [product, router]);

    if (hasPermission === null) {
        return <View style={styles.center}><Text>Requesting camera permission…</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.center}><Text>No camera access</Text></View>;
    }

    return (
        <View style={{ flex: 1 }}>
            {!product ? (
                <BarCodeScanner onBarCodeScanned={onBarCodeScanned} style={{ flex: 1 }} />
            ) : (
                <View style={styles.resultWrap}>
                    {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.image} /> : null}
                    <Text style={styles.title}>{product.name}</Text>
                    {product.brand ? <Text style={styles.sub}>{product.brand}</Text> : null}
                    {product.category ? <Text style={styles.sub}>{product.category}</Text> : null}

                    <Pressable onPress={() => { setScanned(false); setProduct(null); }} style={[styles.btn, styles.secondary]}>
                        <Text style={styles.btnText}>Scan Again</Text>
                    </Pressable>
                    <Pressable onPress={addToPantry} style={styles.btn}>
                        <Text style={styles.btnText}>Add to Pantry</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
    image: { width: 160, height: 160, borderRadius: 12, marginBottom: 8 },
    title: { fontSize: 18, fontWeight: '700' },
    sub: { fontSize: 14, opacity: 0.7 },
    btn: { marginTop: 12, paddingHorizontal: 18, height: 44, borderRadius: 12, backgroundColor: '#2362FF', alignItems: 'center', justifyContent: 'center' },
    secondary: { backgroundColor: '#888' },
    btnText: { color: 'white', fontWeight: '700' },
});
