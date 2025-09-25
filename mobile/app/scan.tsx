import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ScanScreen() {
    const [torchOn, setTorchOn] = useState(false);

    return (
        <SafeAreaView style={styles.backdrop}>
            {/* Sheet / Card */}
            <View style={styles.sheet}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                        <Ionicons name="close" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan Barcode</Text>
                    {/* spacer to balance the close icon */}
                    <View style={{ width: 24 }} />
                </View>

                <Text style={styles.subtitle}>Position barcode within the frame</Text>

                {/* Scanner frame (UI only) */}
                <View style={styles.frame}>
                    {/* Put camera preview here later */}
                </View>

                {/* Suggested item row */}
                <View style={styles.itemRow}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=150&q=80' }}
                        style={styles.thumb}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Organic Apple</Text>
                        <Text style={styles.itemSub}>Fresh from the orchard</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn}>
                        <Text style={styles.addText}>Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, torchOn && styles.actionBtnActive]}
                        onPress={() => setTorchOn(!torchOn)}
                    >
                        <Ionicons
                            name={torchOn ? 'flashlight' : 'flashlight-outline'}
                            size={18}
                            color="#1F2937"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.actionText}>Flashlight</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            // TODO: open Image Picker (UI-only for now)
                        }}
                    >
                        <Ionicons
                            name="image-outline"
                            size={18}
                            color="#1F2937"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.actionText}>Upload from Gallery</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const R = 20;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)', // dim behind the sheet
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    sheet: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: R,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        // soft shadow
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    subtitle: {
        textAlign: 'center',
        color: '#374151',
        marginTop: 8,
        marginBottom: 10,
        fontSize: 16,
    },
    frame: {
        height: 180,
        borderRadius: 14,
        backgroundColor: '#9EB39C', // placeholder greenish preview
        opacity: 0.7,
        marginHorizontal: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
        marginBottom: 14,
    },
    thumb: {
        width: 44,
        height: 44,
        borderRadius: 8,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    itemSub: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    addBtn: {
        paddingHorizontal: 16,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F2ECFE',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5D9FF',
        marginLeft: 10,
    },
    addText: {
        color: '#6E56CF',
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    actionBtnActive: {
        backgroundColor: '#EDE9FE',
        borderColor: '#DDD6FE',
    },
    actionText: {
        color: '#1F2937',
        fontWeight: '700',
    },
});
