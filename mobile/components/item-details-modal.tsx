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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme_provider';
import Ionicons from '@expo/vector-icons/Ionicons';

// this would be used to keep track of the country of origin.
const COUNTRIES = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'Japan'];

// this represents a blueprint for what data the component expects.
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
    item?: PantryItem | null;
};

type PantryItem = {
    id: string;
    name: string;
    sub?: string;
    image?: string;
    status?: 'soon' | 'expired' | 'ok';
    expiring?: boolean;
    expiresAt?: string;
};

// React Funtional Component - This is our modal.
// Destructures the incoming props according to the Props type defined earlier.
export default function ItemDetailsModal({ visible, onClose, onSubmit, item }: Props) {

    // We have a structure ... now we begin developing the modal
    // Visuals:
    const { theme } = useTheme();

    // this line is performing two things - memoization and dynamic styling
    // this is used to caches results and recomputes them when 'theme' changes.
    // 'makeStyles' generates a style object.
    const styles = useMemo(() => makeStyles(theme), [theme]);

    // Animations
    const backdrop = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    // Placeholder Color Scheme
    const placeholder = theme?.muted ?? '#9AA3AF';

    // Animations - These handle the opening and closing animations for the modal we're developinng in this file.
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

    // These are properties of the modal, this will be used to display and/or modify the data.
    const [imageUri, setImageUri] = useState<string | undefined>();
    const [name, setName] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [quantity, setQuantity] = useState('');
    const [country, setCountry] = useState<string | undefined>();
    const [allergens, setAllergens] = useState('');
    const [countryOpen, setCountryOpen] = useState(false);

    React.useEffect(() => {
        if (visible && item) {
            setImageUri(item.image || undefined);
            setName(item.name || '');
        }
    }, [visible, item]);

    /**
     * This is a helper function designed to reset the modal's state then close it.
     * Very straightforward, we're simply altering every value and assigning, essentially, nothing! Blank space.
     * After each field is changed, we close the modal.
     */
    const resetAndClose = () => {
        setName('');
        setImageUri(undefined);
        setExpiresAt('');
        setManufacturer('');
        setLotNumber('');
        setQuantity('');
        setCountry(undefined);
        setAllergens('');
        close();
    };

    /**
     * This is an arrow function, this returns a boolean to tell if a string looks like a valid image URL.
     */
    const isValidImageUrl = (u?: string) => !!u && /^https?:\/\/.+/i.test(u.trim());

    const submit = () => {

        const trimmedName = name.trim();

        // Error-Handling
        if (!trimmedName) {
            Alert.alert('Missing name', 'Please enter an item name.');
            return;
        }

        // Error-Handling
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

        // Submitting will reset the field inputs and close the modal
        // NOTE - THIS MAY NEED TO BE MODIFIED, WE MAY NOT WANT THIS DESIRED OUTPUT.
        resetAndClose();
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
                            android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </Pressable>
                        <Text style={styles.title}>Item Summary</Text>
                        <View style={{ width: 36 }} />
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

                        {/* Main Info */}
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

                        {/* Countdown */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionHeader}><Text style={{ fontWeight: '800' }}>Time Remaining</Text></Text>
                            <View style={styles.countdownContainer}>
                                <Ionicons name="time-outline" size={18} color={theme.primary} />
                                <Text style={styles.countdownText}>
                                    {getExpirationCountdown(item?.expiresAt)}
                                </Text>
                            </View>
                        </View>

                        {/* 🧠 Smart Suggestions */}
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

                                {/* ⚠️ Disclaimer */}
                                <View style={styles.disclaimerContainer}>
                                    <Ionicons name="alert-circle-outline" size={16} color={theme.textDim} />
                                    <Text style={styles.disclaimerText}>
                                        These suggestions are informational only and may not reflect actual freshness or safety.
                                        Always verify expiration labels and use your best judgment.
                                    </Text>
                                </View>
                            </View>
                        )}


                        {/* Notes */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionHeader}><Text style={{ fontWeight: '800' }}>Notes</Text></Text>
                            <TextInput
                                placeholder="Add notes about this item..."
                                placeholderTextColor={theme.textDim}
                                multiline
                                style={styles.notesInput}
                            />
                        </View>
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </Modal>
    );
}


/* ---------------- Styling ---------------- */

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

        detailsGrid: {
            marginTop: 16,
            backgroundColor: t.card ?? t.inputBg,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 18,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },

        detailRow: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: 16,
        },

        detailLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: t.textDim,
            marginBottom: 4,
        },

        detailValue: {
            fontSize: 16,
            fontWeight: '700',
            color: t.text,
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

        highlight: {
            fontWeight: '700',
            color: t.primary,
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
