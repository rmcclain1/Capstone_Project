import React, { useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Animated,
    Easing,
    ScrollView,
    Image,
    Platform,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme_provider';
import Ionicons from '@expo/vector-icons/Ionicons';

const COUNTRIES = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'Japan'];

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit?: (item: {
        name: string;
        imageUri?: string;
        expiresAt?: string;
        manufacturer?: string;
        lotNumber?: string;
        quantity?: string;
        country?: string;
        allergens?: string;
    }) => void;
    onUpdate?: (itemId: string, data: {
        name: string;
        imageUri?: string;
        expiresAt?: string;
        manufacturer?: string;
        lotNumber?: string;
        quantity?: string;
        country?: string;
        allergens?: string;
    }) => Promise<void>;
    item?: PantryItem | null;
    mode?: 'view' | 'edit' | 'add';
};

type PantryItem = {
    id: string;
    name: string;
    sub?: string;
    image?: string;
    status?: 'soon' | 'expired' | 'ok';
    expiring?: boolean;
    expiresAt?: string;
    manufacturer?: string;
    lotNumber?: string;
    quantity?: string;
    country?: string;
    allergens?: string;
};

export default function ItemDetailsModal({ visible, onClose, onSubmit, onUpdate, item, mode = 'view' }: Props) {
    const { theme } = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const backdrop = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;
    const placeholder = theme?.muted ?? '#9AA3AF';

    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'add');
    const [saving, setSaving] = useState(false);

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

    const [imageUri, setImageUri] = useState<string | undefined>();
    const [name, setName] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [quantity, setQuantity] = useState('');
    const [country, setCountry] = useState<string | undefined>();
    const [allergens, setAllergens] = useState('');
    const [notes, setNotes] = useState('');
    const [countryOpen, setCountryOpen] = useState(false);

    React.useEffect(() => {
        if (visible && item) {
            setImageUri(item.image || undefined);
            setName(item.name || '');
            setExpiresAt(item.expiresAt || '');
            setManufacturer(item.manufacturer || '');
            setLotNumber(item.lotNumber || '');
            setQuantity(item.quantity || '');
            setCountry(item.country);
            setAllergens(item.allergens || '');
            setIsEditing(mode === 'edit' || mode === 'add');
        } else if (visible && !item) {
            // Adding new item
            setIsEditing(true);
        }
    }, [visible, item, mode]);

    const resetAndClose = () => {
        setName('');
        setImageUri(undefined);
        setExpiresAt('');
        setManufacturer('');
        setLotNumber('');
        setQuantity('');
        setCountry(undefined);
        setAllergens('');
        setNotes('');
        setIsEditing(false);
        close();
    };

    const isValidImageUrl = (u?: string) => !!u && /^https?:\/\/.+/i.test(u.trim());

    const handleSave = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            Alert.alert('Missing name', 'Please enter an item name.');
            return;
        }

        if (imageUri && !isValidImageUrl(imageUri)) {
            Alert.alert('Invalid image URL', 'Please paste a valid http(s) image URL.');
            return;
        }

        const data = {
            name: trimmedName,
            imageUri: imageUri?.trim() || undefined,
            expiresAt: expiresAt.trim() || undefined,
            manufacturer: manufacturer.trim() || undefined,
            lotNumber: lotNumber.trim() || undefined,
            quantity: quantity.trim() || undefined,
            country: country?.trim() || undefined,
            allergens: allergens.trim() || undefined,
        };

        if (item?.id && onUpdate) {
            // Update existing item
            try {
                setSaving(true);
                await onUpdate(item.id, data);
                setIsEditing(false);
                resetAndClose();
            } catch (error) {
                // Error handled by parent
            } finally {
                setSaving(false);
            }
        } else if (onSubmit) {
            // Create new item
            onSubmit(data);
            resetAndClose();
        }
    };

    const getExpirationCountdown = (dateStr?: string) => {
        if (!dateStr) return 'No expiration date set';
        const today = new Date();
        const exp = new Date(dateStr);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
        if (diffDays === 0) return 'Expires today';
        return `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
    };

    return (
        <Modal visible={visible} transparent animationType="none" onShow={open} onRequestClose={close}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdrop }]} />
            <SafeAreaView style={styles.safe}>
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Pressable
                            onPress={resetAndClose}
                            style={styles.roundIcon}
                            hitSlop={12}
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </Pressable>
                        <Text style={styles.title}>
                            {isEditing ? (item ? 'Edit Item' : 'Add Item') : 'Item Details'}
                        </Text>
                        {!isEditing && item && (
                            <Pressable onPress={() => setIsEditing(true)} hitSlop={12}>
                                <Ionicons name="create-outline" size={24} color={theme.primary} />
                            </Pressable>
                        )}
                        {isEditing && <View style={{ width: 36 }} />}
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Image Preview */}
                        <Image
                            source={{
                                uri: imageUri && /^https?:\/\//.test(imageUri)
                                    ? imageUri
                                    : item?.image && /^https?:\/\//.test(item.image)
                                        ? item.image
                                        : 'https://www.thekeepingroomnc.com/wp-content/uploads/2020/04/image-placeholder.jpg',
                            }}
                            style={styles.image}
                            resizeMode="cover"
                        />

                        {isEditing ? (
                            /* EDIT MODE */
                            <>
                                <Text style={styles.label}>Item Name *</Text>
                                <TextInput
                                    placeholder="e.g., Milk, Bread, Eggs"
                                    placeholderTextColor={placeholder}
                                    value={name}
                                    onChangeText={setName}
                                    style={styles.input}
                                />

                                <Text style={styles.label}>Image URL</Text>
                                <TextInput
                                    placeholder="https://..."
                                    placeholderTextColor={placeholder}
                                    value={imageUri}
                                    onChangeText={setImageUri}
                                    style={styles.input}
                                    autoCapitalize="none"
                                />

                                <Text style={styles.label}>Expiration Date (MM/DD/YYYY)</Text>
                                <TextInput
                                    placeholder="12/31/2025"
                                    placeholderTextColor={placeholder}
                                    value={expiresAt}
                                    onChangeText={setExpiresAt}
                                    style={styles.input}
                                    keyboardType="numbers-and-punctuation"
                                />

                                <Text style={styles.label}>Manufacturer</Text>
                                <TextInput
                                    placeholder="e.g., Kraft, Nestle"
                                    placeholderTextColor={placeholder}
                                    value={manufacturer}
                                    onChangeText={setManufacturer}
                                    style={styles.input}
                                />

                                <Text style={styles.label}>Lot Number</Text>
                                <TextInput
                                    placeholder="e.g., 12345"
                                    placeholderTextColor={placeholder}
                                    value={lotNumber}
                                    onChangeText={setLotNumber}
                                    style={styles.input}
                                    keyboardType="numeric"
                                />

                                <Text style={styles.label}>Quantity</Text>
                                <TextInput
                                    placeholder="e.g., 1, 2, 3"
                                    placeholderTextColor={placeholder}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    style={styles.input}
                                    keyboardType="numeric"
                                />

                                <Text style={styles.label}>Country of Origin</Text>
                                <Pressable onPress={() => setCountryOpen(!countryOpen)} style={styles.inputWithIcon}>
                                    <Text style={{ flex: 1, color: country ? theme.text : placeholder }}>
                                        {country || 'Select a country...'}
                                    </Text>
                                    <Ionicons
                                        name={countryOpen ? 'chevron-up' : 'chevron-down'}
                                        size={18}
                                        color={theme.textDim}
                                    />
                                </Pressable>
                                {countryOpen && (
                                    <View style={styles.dropdown}>
                                        {COUNTRIES.map((c) => (
                                            <Pressable
                                                key={c}
                                                style={styles.dropdownRow}
                                                onPress={() => {
                                                    setCountry(c);
                                                    setCountryOpen(false);
                                                }}
                                            >
                                                <Text style={{ color: theme.text }}>{c}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}

                                <Text style={styles.label}>Allergens</Text>
                                <TextInput
                                    placeholder="e.g., Milk, Eggs, Nuts"
                                    placeholderTextColor={placeholder}
                                    value={allergens}
                                    onChangeText={setAllergens}
                                    style={styles.input}
                                />

                                <View style={styles.footerRow}>
                                    <Pressable style={styles.cancelBtn} onPress={resetAndClose}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable style={styles.addBtn} onPress={handleSave} disabled={saving}>
                                        {saving ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.addText}>{item ? 'Save' : 'Add'}</Text>
                                        )}
                                    </Pressable>
                                </View>
                            </>
                        ) : (
                            /* VIEW MODE */
                            <>
                                <View style={styles.infoContainer}>
                                    <Text style={styles.infoTitle}>{item?.name || 'Unnamed Item'}</Text>
                                    {!!item?.sub && <Text style={styles.infoSub}>{item.sub}</Text>}

                                    {item?.status && (
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                item.status === 'expired'
                                                    ? { backgroundColor: theme.danger || '#EF4444' }
                                                    : item.status === 'soon'
                                                        ? { backgroundColor: theme.primary }
                                                        : { backgroundColor: '#4CAF50' },
                                            ]}
                                        >
                                            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionHeader}>Time Remaining</Text>
                                    <View style={styles.countdownContainer}>
                                        <Ionicons name="time-outline" size={18} color={theme.primary} />
                                        <Text style={styles.countdownText}>
                                            {getExpirationCountdown(item?.expiresAt)}
                                        </Text>
                                    </View>
                                </View>

                                {(item?.status === 'soon' || item?.status === 'expired') && (
                                    <View style={styles.suggestionContainer}>
                                        <Text style={styles.sectionHeader}>Smart Suggestions</Text>

                                        {item?.status === 'soon' && (
                                            <Text style={styles.suggestionText}>
                                                This item is nearing expiration. You might want to use it soon, try adding it to a meal plan or sharing it.
                                            </Text>
                                        )}

                                        {item?.status === 'expired' && (
                                            <Text style={styles.suggestionText}>
                                                This item appears to be expired. Dispose of it safely and check if it can be recycled or composted.
                                            </Text>
                                        )}

                                        <View style={styles.disclaimerContainer}>
                                            <Ionicons name="alert-circle-outline" size={16} color={theme.textDim} />
                                            <Text style={styles.disclaimerText}>
                                                These suggestions are informational only and may not reflect actual freshness or safety.
                                                Always verify expiration labels and use your best judgment.
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionHeader}>Notes</Text>
                                    <TextInput
                                        placeholder="Add notes about this item..."
                                        placeholderTextColor={theme.textDim}
                                        multiline
                                        value={notes}
                                        onChangeText={setNotes}
                                        style={styles.notesInput}
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </Modal>
    );
}

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
            justifyContent: 'space-between',
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
        title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.text, marginHorizontal: 8 },

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

        infoContainer: {
            backgroundColor: t.card ?? t.inputBg,
            borderRadius: 14,
            padding: 16,
            marginTop: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },

        infoTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: t.text,
            marginBottom: 4,
        },

        infoSub: {
            fontSize: 14,
            color: t.textDim,
            marginBottom: 8,
        },

        statusBadge: {
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            marginBottom: 0,
        },

        statusText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 12,
        },

        notesInput: {
            height: 80,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.inputBg,
            padding: 10,
            fontSize: 15,
            color: t.text,
        },

        countdownContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 2,
            backgroundColor: t.card ?? t.inputBg,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },

        countdownText: {
            fontSize: 15,
            fontWeight: '700',
            color: t.text,
            marginLeft: 8,
        },

        sectionCard: {
            backgroundColor: t.card ?? t.inputBg,
            borderRadius: 14,
            padding: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            marginTop: 20,
            marginBottom: 10,
        },

        suggestionContainer: {
            backgroundColor: t.card ?? t.inputBg,
            borderRadius: 14,
            padding: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            marginTop: 10,
        },

        sectionHeader: {
            fontSize: 16,
            fontWeight: '800',
            color: t.text,
            marginBottom: 8,
        },

        suggestionText: {
            fontSize: 14,
            color: t.text,
            lineHeight: 20,
            marginBottom: 10,
        },

        disclaimerContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: t.inputBg,
            borderRadius: 10,
            padding: 10,
            marginTop: 0,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            gap: 8,
        },

        disclaimerText: {
            flex: 1,
            fontSize: 13,
            color: t.textDim,
            lineHeight: 18,
        },
    });
