import React, { useRef, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Modal, Animated, Easing,
    SafeAreaView, ScrollView, TextInput, Image, Platform, Pressable, Alert,
    KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/constants/theme_provider';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit?: (item: {
        name: string;
        imageUri?: string;
        expiresAt?: string;     // MM/DD/YYYY
        manufacturer?: string;
        lotNumber?: string;
        quantity?: string;      // send as string to let backend decide numeric vs textual
        country?: string;
        allergens?: string;
    }) => void;
};

const COUNTRIES = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'Japan'];

export default function AddItemModal({ visible, onClose, onSubmit }: Props) {
    const { theme } = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const backdrop = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    const placeholder = theme?.muted ?? '#9AA3AF';

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
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [manufacturer, setManufacturer] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [quantity, setQuantity] = useState('');
    const [country, setCountry] = useState<string | undefined>();
    const [allergens, setAllergens] = useState('');
    const [countryOpen, setCountryOpen] = useState(false);

    const isValidImageUrl = (u?: string) =>
        !!u && /^https?:\/\/.+/i.test(u.trim());

    const formatDate = (date: Date): string => {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const handleDateChange = (event: any, date?: Date) => {
        // On Android, the picker closes automatically
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (date) {
            setSelectedDate(date);
            setExpiresAt(formatDate(date));
        }
    };

    const openDatePicker = () => {
        setShowDatePicker(true);
    };

    const closeDatePicker = () => {
        setShowDatePicker(false);
    };

    const submit = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Missing name', 'Please enter an item name.');
            return;
        }
        if (imageUri && !isValidImageUrl(imageUri)) {
            Alert.alert('Invalid image URL', 'Please paste a valid http(s) image URL.');
            return;
        }
        onSubmit?.({
            name: trimmedName,
            imageUri: imageUri?.trim() || undefined,
            expiresAt: expiresAt.trim() || undefined,
            manufacturer: manufacturer.trim() || undefined,
            lotNumber: lotNumber.trim() || undefined,
            quantity: quantity.trim() || undefined,
            country: country?.trim() || undefined,
            allergens: allergens.trim() || undefined,
        });
        resetAndClose();
    };

    const resetAndClose = () => {
        setName('');
        setImageUri(undefined);
        setExpiresAt('');
        setSelectedDate(undefined);
        setManufacturer('');
        setLotNumber('');
        setQuantity('');
        setCountry(undefined);
        setAllergens('');
        close();
    };

    const disabled = name.trim().length === 0;

    return (
        <Modal visible={visible} transparent animationType="none" onShow={open} onRequestClose={close}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdrop }]} />
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                        {/* Header */}
                        <View style={styles.headerRow}>
                            <Pressable
                                onPress={resetAndClose}
                                style={styles.roundIcon}
                                hitSlop={12}
                                android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                            >
                                <Ionicons name="close" size={20} color={theme.text} />
                            </Pressable>
                            <Text style={styles.title}>Add Item</Text>
                            <View style={{ width: 36 }} />
                        </View>

                        {/* Content */}
                        <ScrollView
                            contentContainerStyle={styles.content}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.label}>Item Name</Text>
                            <TextInput
                                placeholder="Enter item name"
                                placeholderTextColor={placeholder}
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                            />

                            {/* Image */}
                            <View style={{ marginTop: 14 }}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={styles.image} />
                                ) : (
                                    <View style={[styles.image, { backgroundColor: theme.surface }]} />
                                )}
                                <Text style={styles.label}>Image URL (optional)</Text>
                                <TextInput
                                    placeholder="https://example.com/image.jpg"
                                    placeholderTextColor={placeholder}
                                    style={styles.input}
                                    value={imageUri}
                                    onChangeText={setImageUri}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                            </View>

                            {/* Expiration Date with Clickable Calendar Icon */}
                            <Text style={[styles.label, { marginTop: 10 }]}>Expiration Date</Text>
                            {Platform.OS === 'web' ? (
                                <View style={styles.inputWithIcon}>
                                    <input
                                        type="date"
                                        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                        onChange={(e: any) => {
                                            const dateValue = e.target.value;
                                            if (dateValue) {
                                                const newDate = new Date(dateValue);
                                                setSelectedDate(newDate);
                                                setExpiresAt(formatDate(newDate));
                                            } else {
                                                setSelectedDate(undefined);
                                                setExpiresAt('');
                                            }
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{
                                            flex: 1,
                                            height: 44,
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            color: theme.text,
                                            fontSize: 15,
                                            outline: 'none',
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ pointerEvents: 'none' }} />
                                </View>
                            ) : (
                                <>
                                    <Pressable style={styles.inputWithIcon} onPress={openDatePicker}>
                                        <TextInput
                                            placeholder="MM/DD/YYYY"
                                            placeholderTextColor={placeholder}
                                            style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                                            value={expiresAt}
                                            onChangeText={setExpiresAt}
                                            keyboardType="numbers-and-punctuation"
                                            autoCapitalize="none"
                                            editable={false}
                                            pointerEvents="none"
                                        />
                                        <Pressable onPress={openDatePicker} hitSlop={12}>
                                            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                        </Pressable>
                                    </Pressable>

                                    {/* Date Picker */}
                                    {showDatePicker && (
                                        <>
                                            <DateTimePicker
                                                value={selectedDate || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={handleDateChange}
                                                minimumDate={new Date()}
                                            />
                                            {/* iOS needs a Done button */}
                                            {Platform.OS === 'ios' && (
                                                <Pressable style={styles.doneButton} onPress={closeDatePicker}>
                                                    <Text style={styles.doneButtonText}>Done</Text>
                                                </Pressable>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {/* Manufacturer */}
                            <Text style={styles.label}>Manufacturer</Text>
                            <TextInput
                                placeholder="Enter manufacturer"
                                placeholderTextColor={placeholder}
                                style={styles.input}
                                value={manufacturer}
                                onChangeText={setManufacturer}
                            />

                            {/* Lot */}
                            <Text style={styles.label}>Lot Number</Text>
                            <TextInput
                                placeholder="Enter lot number"
                                placeholderTextColor={placeholder}
                                style={styles.input}
                                value={lotNumber}
                                onChangeText={setLotNumber}
                                autoCapitalize="none"
                            />

                            {/* Quantity */}
                            <Text style={styles.label}>Quantity</Text>
                            <TextInput
                                placeholder="e.g., 3, 2 packs, 500g"
                                placeholderTextColor={placeholder}
                                style={styles.input}
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="default"
                            />

                            {/* Country */}
                            <Text style={styles.label}>Country of Origin</Text>
                            <Pressable
                                style={[styles.input, styles.selectRow]}
                                onPress={() => setCountryOpen(v => !v)}
                                android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                            >
                                <Text style={{ color: country ? theme.text : placeholder }}>
                                    {country || 'Select country'}
                                </Text>
                                <Ionicons name={countryOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.iconDim} />
                            </Pressable>
                            {countryOpen && (
                                <View style={styles.dropdown}>
                                    {COUNTRIES.map(c => (
                                        <Pressable
                                            key={c}
                                            style={styles.dropdownRow}
                                            onPress={() => { setCountry(c); setCountryOpen(false); }}
                                            android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                                        >
                                            <Text style={{ color: theme.text }}>{c}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Allergens */}
                            <Text style={styles.label}>Allergens</Text>
                            <TextInput
                                placeholder="e.g., Peanuts, Soy"
                                placeholderTextColor={placeholder}
                                style={styles.input}
                                value={allergens}
                                onChangeText={setAllergens}
                            />

                            {/* Footer */}
                            <View style={styles.footerRow}>
                                <Pressable
                                    onPress={resetAndClose}
                                    style={styles.cancelBtn}
                                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={submit}
                                    style={[styles.addBtn, disabled && { opacity: 0.6 }]}
                                    disabled={disabled}
                                    android_ripple={Platform.OS === 'android' ? { color: theme.primary } : undefined}
                                >
                                    <Text style={styles.addText}>Add</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        safe: { flex: 1, justifyContent: 'flex-end' },
        sheet: {
            flex: 1,
            height: '92%',
            backgroundColor: t.bg,
            borderRadius: 24,
            ...Platform.select({
                ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: -4 } },
                android: { elevation: 12 },
            }),
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 6,
            marginVertical: 10,
        },
        roundIcon: {
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: t.inputBg,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.text },

        content: { paddingHorizontal: 16, paddingBottom: 24 },
        label: { color: t.text, fontWeight: '700', marginTop: 12, marginBottom: 6 },
        input: {
            height: 46,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.inputBg,
            paddingHorizontal: 14,
            color: t.text,
            marginBottom: 10,
        },
        inputWithIcon: {
            height: 46,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.inputBg,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        image: { width: '100%', height: 210, borderRadius: 12, marginTop: 6, marginBottom: 8, backgroundColor: t.surface },
        selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        dropdown: {
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            backgroundColor: t.bg,
            marginTop: -4,
            marginBottom: 8,
            overflow: 'hidden',
        },
        dropdownRow: {
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: t.border,
        },
        doneButton: {
            backgroundColor: t.primary,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 10,
        },
        doneButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },

        footerRow: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 8 },
        cancelBtn: {
            flex: 1, height: 48, borderRadius: 12, backgroundColor: t.inputBg,
            borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center',
        },
        cancelText: { color: t.text, fontWeight: '700' },
        addBtn: {
            flex: 1, height: 48, borderRadius: 12, backgroundColor: t.primary,
            alignItems: 'center', justifyContent: 'center',
        },
        addText: { color: t.onPrimary ?? '#fff', fontWeight: '800' },
    });
