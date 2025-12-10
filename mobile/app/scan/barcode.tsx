// app/scan/barcode.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '@/lib/api';

export default function BarcodeScan() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [barcode, setBarcode] = useState<string | null>(null);

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        setBarcode(data);
        console.log(`Barcode scanned: Type=${type}, Data=${data}`);

        Alert.alert(
            'Barcode Scanned!',
            `Type: ${type}\nData: ${data}`,
            [
                { text: 'Scan Again', onPress: () => setScanned(false) },
                { text: 'Add to Pantry', onPress: () => handleAddToPantry(data) },
                { text: 'Close', onPress: () => router.back() },
            ]
        );
    };

    const handleAddToPantry = async (barcodeData: string) => {
        console.log('Adding barcode to pantry:', barcodeData);

        // Validate barcode format (UPC-A, UPC-E, EAN-13, EAN-8)
        const isValidUPC = /^\d{8,13}$/.test(barcodeData);
        if (!isValidUPC) {
            Alert.alert(
                'Invalid Barcode',
                'This barcode format is not supported. Please try again or enter manually.',
                [
                    { text: 'Try Again', onPress: () => setScanned(false) },
                    { text: 'Enter Manually', onPress: () => router.push('/manual-entry') },
                    { text: 'Cancel', onPress: () => router.back() },
                ]
            );
            return;
        }

        try {
            // Look up product from OpenFoodFacts with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${barcodeData}.json`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            const data = await response.json();

            if (data.status === 1 && data.product) {
                const product = data.product;
                const productName = product.product_name || 'Unknown Product';
                const imageUrl = product.image_url || product.image_front_url;

                // Create pantry item with barcode
                const pantryData = {
                    pantry: {
                        item_name: productName,
                        quantity: 1,
                        barcode: barcodeData,
                        image_url: imageUrl,
                        manufacturer: product.brands || undefined,
                        category: product.categories_tags?.[0]?.replace('en:', '') || undefined,
                        allergen: product.allergens_tags?.join(', ') || undefined,
                    }
                };

                await api.post('/api/v1/pantries', pantryData);

                Alert.alert(
                    'Success!',
                    `Added "${productName}" to your pantry`,
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)/pantry') }]
                );
            } else {
                // Product not found in OpenFoodFacts database
                Alert.prompt(
                    'Product Not Found',
                    `Barcode ${barcodeData} not found in database.\n\nEnter product name to add manually:`,
                    async (name) => {
                        if (name && name.trim()) {
                            try {
                                await api.post('/api/v1/pantries', {
                                    pantry: {
                                        item_name: name.trim(),
                                        quantity: 1,
                                        barcode: barcodeData,
                                    }
                                });
                                Alert.alert('Success!', `Added "${name}" to your pantry`);
                                router.replace('/(tabs)/pantry');
                            } catch (error: any) {
                                Alert.alert('Error', error?.response?.data?.errors?.join(', ') || 'Failed to add item');
                            }
                        } else {
                            setScanned(false); // Allow scanning again
                        }
                    },
                    'plain-text'
                );
            }
        } catch (error: any) {
            console.error('Error adding to pantry:', error);

            if (error.name === 'AbortError') {
                Alert.alert(
                    'Request Timeout',
                    'Product lookup took too long. Would you like to try again or enter manually?',
                    [
                        { text: 'Retry', onPress: () => { setScanned(false); handleAddToPantry(barcodeData); } },
                        { text: 'Enter Manually', onPress: () => router.push('/manual-entry') },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
            } else {
                Alert.alert(
                    'Error',
                    error?.response?.data?.errors?.join(', ') || 'Failed to add item to pantry',
                    [
                        { text: 'Try Again', onPress: () => setScanned(false) },
                        { text: 'Cancel', onPress: () => router.back() },
                    ]
                );
            }

            setScanned(false);
        }
    };

    // Loading state while checking permissions
    if (!permission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2362FF" />
                <Text style={styles.message}>Loading camera...</Text>
            </View>
        );
    }

    // Permission not granted
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Ionicons name="camera-outline" size={64} color="#999" />
                <Text style={styles.title}>Camera Permission Required</Text>
                <Text style={styles.message}>
                    This app needs camera access to scan barcodes.
                </Text>
                <Pressable style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </Pressable>
                <Pressable
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => router.back()}
                >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    // Camera view with barcode scanning
    return (
        <View style={styles.cameraContainer}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39'],
                }}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.topOverlay}>
                    <Pressable
                        style={styles.closeButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="close" size={32} color="white" />
                    </Pressable>
                </View>

                <View style={styles.centerOverlay}>
                    <View style={styles.scanArea} />
                </View>

                <View style={styles.bottomOverlay}>
                    <Text style={styles.instructionText}>
                        {scanned ? 'Barcode scanned!' : 'Point camera at barcode'}
                    </Text>
                    {scanned && (
                        <Pressable
                            style={styles.rescanButton}
                            onPress={() => setScanned(false)}
                        >
                            <Text style={styles.rescanText}>Tap to scan again</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
        backgroundColor: '#fff',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
    },
    button: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#2362FF',
        borderRadius: 12,
        minWidth: 200,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#2362FF',
    },
    secondaryButtonText: {
        color: '#2362FF',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    centerOverlay: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    scanArea: {
        width: 300,
        height: 200,
        borderWidth: 2,
        borderColor: '#2362FF',
        backgroundColor: 'transparent',
        borderRadius: 10,
        marginHorizontal: 'auto',
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    instructionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    rescanButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#2362FF',
        borderRadius: 12,
    },
    rescanText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
