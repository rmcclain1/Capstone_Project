import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing,
    SafeAreaView, ScrollView, TextInput, Image, Platform
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit?: (item: {
        name: string;
        imageUri?: string;
        expiresAt?: string;
        manufacturer?: string;
        lotNumber?: string;
        country?: string;
        allergens?: string;
    }) => void;
};

const COUNTRIES = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'Japan'];

export default function AddItemModal({ visible, onClose, onSubmit }: Props) {
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

    const [name, setName] = useState('');
    const [imageUri, setImageUri] = useState<string | undefined>();
    const [expiresAt, setExpiresAt] = useState(''); // MM/DD/YYYY (UI-only)
    const [manufacturer, setManufacturer] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [country, setCountry] = useState<string | undefined>();
    const [allergens, setAllergens] = useState('');

    const [countryOpen, setCountryOpen] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const res = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!res.canceled) setImageUri(res.assets[0].uri);
    };

    const submit = () => {
        onSubmit?.({ name, imageUri, expiresAt, manufacturer, lotNumber, country, allergens });
        close();
    };

    const resetAndClose = () => {
        setName(''); setImageUri(undefined); setExpiresAt('');
        setManufacturer(''); setLotNumber(''); setCountry(undefined); setAllergens('');
        close();
    };

    return (
        <Modal visible={visible} transparent animationType="none" onShow={open} onRequestClose={close}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdrop }]} />
            <SafeAreaView style={styles.safe}>
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={resetAndClose} style={styles.roundIcon} hitSlop={12}>
                            <Ionicons name="close" size={20} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Add Item</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Item Name</Text>
                        <TextInput
                            placeholder="Enter item name"
                            placeholderTextColor="#A3A3A3"
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={{ marginTop: 14 }}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.image} />
                            ) : (
                                <View style={[styles.image, { backgroundColor: '#E5E7EB' }]} />
                            )}
                            <TouchableOpacity style={styles.smallBtn} onPress={pickImage}>
                                <Text style={styles.smallBtnText}>Add Image</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, { marginTop: 10 }]}>Expiration Date</Text>
                        <View style={styles.inputWithIcon}>
                            <TextInput
                                placeholder="MM/DD/YYYY"
                                placeholderTextColor="#A3A3A3"
                                style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                                value={expiresAt}
                                onChangeText={setExpiresAt}
                            />
                            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                        </View>

                        <Text style={styles.label}>Manufacturer</Text>
                        <TextInput
                            placeholder="Enter manufacturer"
                            placeholderTextColor="#A3A3A3"
                            style={styles.input}
                            value={manufacturer}
                            onChangeText={setManufacturer}
                        />

                        <Text style={styles.label}>Lot Number</Text>
                        <TextInput
                            placeholder="Enter lot number"
                            placeholderTextColor="#A3A3A3"
                            style={styles.input}
                            value={lotNumber}
                            onChangeText={setLotNumber}
                        />

                        <Text style={styles.label}>Country of Origin</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setCountryOpen((v) => !v)}
                            activeOpacity={0.9}
                        >
                            <Text style={{ color: country ? '#111827' : '#A3A3A3' }}>
                                {country || 'Select country'}
                            </Text>
                            <Ionicons name={countryOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                        </TouchableOpacity>
                        {countryOpen && (
                            <View style={styles.dropdown}>
                                {COUNTRIES.map(c => (
                                    <TouchableOpacity key={c} style={styles.dropdownRow} onPress={() => { setCountry(c); setCountryOpen(false); }}>
                                        <Text style={{ color: '#111827' }}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.label}>Allergens</Text>
                        <TextInput
                            placeholder="Enter allergens"
                            placeholderTextColor="#A3A3A3"
                            style={styles.input}
                            value={allergens}
                            onChangeText={setAllergens}
                        />

                        <View style={styles.footerRow}>
                            <TouchableOpacity onPress={resetAndClose} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submit} style={styles.addBtn}>
                                <Text style={styles.addText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        flex: 1,
        height: '92%',

        backgroundColor: '#FFF',
        borderRadius: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: -4 } },
            android: { elevation: 12 },
        }),
        overflow: 'hidden',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, marginVertical: 10 },
    roundIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#0F172A' },

    content: { paddingHorizontal: 16, paddingBottom: 24 },
    label: { color: '#111827', fontWeight: '700', marginTop: 12, marginBottom: 6 },
    input: {
        height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6',
        paddingHorizontal: 14, color: '#111827', marginBottom: 10,
    },
    inputWithIcon: {
        height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6',
        paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    },

    image: { width: '100%', height: 210, borderRadius: 12, marginTop: 6, marginBottom: 8 },
    smallBtn: {
        alignSelf: 'flex-start', height: 34, paddingHorizontal: 12, borderRadius: 8,
        backgroundColor: '#EFE9FF', borderWidth: 1, borderColor: '#E0D4FF', alignItems: 'center', justifyContent: 'center',
    },
    smallBtnText: { color: '#6E56CF', fontWeight: '700' },

    dropdown: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#FFF', marginTop: -4, marginBottom: 8,
    },
    dropdownRow: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },

    footerRow: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 8 },
    cancelBtn: {
        flex: 1, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
        alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { color: '#111827', fontWeight: '700' },
    addBtn: {
        flex: 1, height: 48, borderRadius: 12, backgroundColor: '#6E56CF',
        alignItems: 'center', justifyContent: 'center',
    },
    addText: { color: '#FFFFFF', fontWeight: '800' },
});
