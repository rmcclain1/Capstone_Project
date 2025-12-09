// app/scan/barcode.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

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
        // TODO: Look up product info from barcode API
        // For now, just navigate back
        console.log('Adding barcode to pantry:', barcodeData);
        Alert.alert('Coming Soon', 'Barcode lookup feature will be added in a future update!');
        router.back();
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
