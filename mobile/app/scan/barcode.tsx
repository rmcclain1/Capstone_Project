// app/scan/barcode.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BarcodeScan() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Ionicons name="barcode-outline" size={64} color="#999" />
            <Text style={styles.title}>Barcode Scanner</Text>
            <Text style={styles.message}>
                Barcode scanning requires a development build.{'\n'}
                It cannot run in Expo Go.
            </Text>
            <Text style={styles.info}>
                To enable scanning:{'\n'}
                • Run "npx expo run:ios" or{'\n'}
                • Run "npx expo run:android"
            </Text>
            <Pressable
                style={styles.button}
                onPress={() => router.back()}
            >
                <Text style={styles.buttonText}>Go Back</Text>
            </Pressable>
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
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
    },
    info: {
        fontSize: 13,
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    button: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#2362FF',
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
    },
});