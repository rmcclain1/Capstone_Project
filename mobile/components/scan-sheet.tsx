import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    Platform,
    SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function ScanSheet({ visible, onClose }: Props) {
    const backdrop = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    const open = () => {
        Animated.parallel([
            Animated.timing(backdrop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    };
    const close = () => {
        Animated.parallel([
            Animated.timing(backdrop, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 40, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(({ finished }) => finished && onClose());
    };

    return (
        <Modal visible={visible} transparent animationType="none" onShow={open} onRequestClose={close}>
            {/* Dimmed backdrop */}
            <Animated.View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdrop }]}
            />

            {/* Bottom sheet */}
            <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    {/* Grabber */}
                    <View style={styles.grabberWrap}>
                        <View style={styles.grabber} />
                    </View>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={close} hitSlop={12} style={styles.iconBtn}>
                            <Ionicons name="close" size={20} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Scan Barcode</Text>
                        <View style={styles.iconBtn} />{/* spacer */}
                    </View>

                    <Text style={styles.subtitle}>Position barcode within the frame</Text>

                    {/* Camera frame placeholder */}
                    <View style={styles.frame}>
                        <View style={styles.frameBorder} />
                    </View>

                    {/* Suggestion card */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={styles.thumb} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>Organic Apple</Text>
                                <Text style={styles.itemSub}>Fresh from the orchard</Text>
                            </View>
                            <TouchableOpacity style={styles.pillBtn}>
                                <Text style={styles.pillText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionText}>Flashlight</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionText}>Upload from Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </Modal>
    );
}

const R = 22;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        flex: 1,
        margin: 10,            // leave small gap at top for grabber
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.10,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: -4 },
            },
            android: { elevation: 12 },
        }),
    },

    grabberWrap: { alignItems: 'center', paddingTop: 8 },
    grabber: { width: 36, height: 5, borderRadius: 999, backgroundColor: '#E5E7EB' },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 8,
    },
    iconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#0F172A' },
    subtitle: { textAlign: 'center', color: '#334155', marginTop: 8, marginBottom: 10, fontSize: 15 },

    frame: {
        marginHorizontal: 16,
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#CBD5E1',
    },
    frameBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },

    card: {
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    thumb: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    itemTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    itemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

    pillBtn: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    pillText: { color: '#6D28D9', fontWeight: '700' },

    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 12,
    },
    actionBtn: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    actionText: { color: '#111827', fontWeight: '700' },
});
