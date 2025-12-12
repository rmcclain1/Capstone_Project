import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    Animated,
    Easing,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    ScrollView,
    TextInput,
    Switch,
    Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/app/context/auth_context';
import { useTheme } from '@/constants/theme_provider';

type ToggleMap = Record<string, boolean>;

type Props = {
    visible: boolean;
    onClose: () => void;
    onSave?: (p: {
        name?: string;
        username?: string;
        email?: string;
        phone?: string;
        birthday?: string;
        location?: string;
        profile_picture_url?: string;
        allergies?: ToggleMap;
        otherAllergy?: string;
    }) => void;
    initial?: {
        name?: string;
        username?: string;
        email?: string;
        phone?: string;
        birthday?: string;
        location?: string;
        profile_picture_url?: string;
        otherAllergy?: string;
        allergies?: ToggleMap;
    };
};

const ALLERGY_LIST = [
    'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Egg', 'Dairy', 'Gluten', 'Soy', 'Other',
] as const;

export default function EditProfileModal({ visible, onClose, onSave, initial }: Props) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const backdrop = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    const placeholder = theme?.muted ?? '#9AA3AF';

    const runOpen = () => {
        Animated.parallel([
            Animated.timing(backdrop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    };
    const runClose = () => {
        Animated.parallel([
            Animated.timing(backdrop, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 40, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(({ finished }) => finished && onClose());
    };

    // --- state (sync on open) ---
    const blank: ToggleMap = useMemo(
        () => ALLERGY_LIST.reduce((m, k) => { m[k] = false; return m; }, {} as ToggleMap),
        []
    );

    const [name, setName] = useState(initial?.name || '');
    const [username, setUsername] = useState(initial?.username || '');
    const [email, setEmail] = useState(initial?.email || '');
    const [phone, setPhone] = useState(initial?.phone || '');
    const [birthday, setBirthday] = useState(initial?.birthday || '');
    const [location, setLocation] = useState(initial?.location || '');
    const [profileUrl, setProfileUrl] = useState<string | undefined>(initial?.profile_picture_url);
    const [livePreview, setLivePreview] = useState<string | undefined>(initial?.profile_picture_url);
    const [otherAllergy, setOtherAllergy] = useState(initial?.otherAllergy || '');
    const [allergies, setAllergies] = useState<ToggleMap>({ ...blank, ...(initial?.allergies ?? {}) });

    // keep fields in sync when modal becomes visible or initial changes
    useEffect(() => {
        if (!visible) return;
        setName(initial?.name || '');
        setUsername(initial?.username || '');
        setEmail(initial?.email || '');
        setPhone(initial?.phone || '');
        setBirthday(initial?.birthday || '');
        setLocation(initial?.location || '');
        setProfileUrl(initial?.profile_picture_url);
        setLivePreview(initial?.profile_picture_url);
        setOtherAllergy(initial?.otherAllergy || '');
        setAllergies({ ...blank, ...(initial?.allergies ?? {}) });
    }, [visible, initial, blank]);

    const isValidImageUrl = (u?: string) => {

        if (!u) return false;

        const trimmed = u.trim();

        // Allow http/https URLs AND local file URIs (file://, ph://, content://, etc.)

        return /^(https?:\/\/.+|file:\/\/.+|ph:\/\/.+|content:\/\/.+)$/i.test(trimmed);

    };

    // live preview as user types a URL
    useEffect(() => {
        if (!profileUrl) { setLivePreview(undefined); return; }
        if (isValidImageUrl(profileUrl)) setLivePreview(profileUrl.trim());
        else setLivePreview(undefined);
    }, [profileUrl]);

    const toggleAllergy = (key: string) => {
        setAllergies((a) => {
            const next = { ...a, [key]: !a[key] };
            if (key === 'Other' && !next['Other']) setOtherAllergy('');
            return next;
        });
    };

    const handlePickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
                return;
            }
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                // 
                setProfileUrl(selectedImage.uri);
                setLivePreview(selectedImage.uri);
            }
        } catch (error) {
            console.error('[EditProfileModal] Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const save = () => {
        if (profileUrl && !isValidImageUrl(profileUrl)) {
            Alert.alert('Invalid image URL', 'Please enter a valid http(s) URL for your profile picture.');
            return;
        }
        onSave?.({
            name,
            username,
            email,
            phone,
            birthday,
            location,
            profile_picture_url: profileUrl?.trim(),
            allergies,
            otherAllergy: otherAllergy?.trim(),
        });
        runClose();
    };

    return (
        <Modal visible={visible} transparent animationType="none" onShow={runOpen} onRequestClose={runClose}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdrop }]} />
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding' })} style={styles.kav}>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable onPress={runClose} style={styles.iconBtn} hitSlop={12}>
                                <Ionicons name="chevron-back" size={20} color={theme.text} />
                            </Pressable>
                            <Text style={styles.title}>Edit Profile</Text>
                            <View style={{ width: 36 }} />
                        </View>

                        {/* Content */}
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Avatar */}
                            <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 10 }}>
                                <View style={styles.avatarWrap}>
                                    {livePreview || user?.profile_picture_url ? (
                                        <Image
                                            source={{ uri: livePreview || (user?.profile_picture_url as string) }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={[styles.avatar, { backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }]}>
                                            <Ionicons name="person" size={38} color={theme.iconDim} />
                                        </View>
                                    )}
                                </View>
                                {Platform.OS !== 'web' && (
                                    <Pressable onPress={handlePickImage} style={styles.uploadBtn}>
                                        <Ionicons name="camera" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                                        <Text style={styles.uploadBtnText}>Upload Photo</Text>
                                    </Pressable>
                                )}
                            </View>

                            <Text style={styles.section}>Personal Information</Text>

                            {Platform.OS === 'web' && (
                                <>
                                    <Label text="Profile Picture URL" />
                                    <Input
                                        value={profileUrl}
                                        onChangeText={setProfileUrl}
                                        placeholder="https://example.com/me.jpg"
                                        keyboardType="url"
                                        autoCapitalize="none"
                                    />
                                </>
                            )}

                            <Label text="Name" />
                            <Input value={name} onChangeText={setName} placeholder="Your name" />

                            <Label text="Username" />
                            <Input value={username} onChangeText={setUsername} autoCapitalize="none" />

                            <Label text="E-mail Address" />
                            <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

                            <Label text="Phone Number" />
                            <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                            <Label text="Birthday" />
                            <View style={styles.inputWithIcon}>
                                <TextInput
                                    value={birthday}
                                    onChangeText={setBirthday}
                                    placeholder="MM/DD/YYYY"
                                    placeholderTextColor={placeholder}
                                    style={styles.inputInner}
                                />
                                <Ionicons name="calendar-outline" size={18} color={theme.iconDim} />
                            </View>

                            <Label text="Location" />
                            <Input value={location} onChangeText={setLocation} />

                            <Text style={styles.section}>Food Allergies</Text>
                            <View style={{ gap: 10 }}>
                                {ALLERGY_LIST.map((k) => (
                                    <View key={k} style={styles.checkRow}>
                                        <Switch
                                            value={allergies[k]}
                                            onValueChange={() => toggleAllergy(k)}
                                            trackColor={{ false: theme.border, true: theme.primarySoft }}
                                            thumbColor={allergies[k] ? theme.primary : theme.onBg}
                                        />
                                        <Text style={styles.checkLabel}>{k}</Text>
                                    </View>
                                ))}
                            </View>

                            <Input
                                value={otherAllergy}
                                onChangeText={setOtherAllergy}
                                placeholder="Please specify"
                                placeholderColor={placeholder}
                                style={{ marginTop: 8, opacity: allergies['Other'] ? 1 : 0.5 }}
                                editable={allergies['Other']}
                            />
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Pressable onPress={runClose} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={save} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Save Changes</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

function Label({ text }: { text: string }) {
    const { theme } = useTheme();
    return <Text style={{ color: theme.text, fontWeight: '700', marginTop: 10, marginBottom: 6 }}>{text}</Text>;
}

function Input(props: any) {
    const { theme } = useTheme();
    return (
        <TextInput
            {...props}
            placeholderTextColor={props.placeholderColor}
            style={[
                {
                    height: 46,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.inputBg,
                    paddingHorizontal: 14,
                    color: theme.text,
                },
                props.style,
            ]}
        />
    );
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        safe: { flex: 1, justifyContent: 'flex-end' },
        kav: { flex: 1, justifyContent: 'flex-end' },
        sheet: {
            flex: 1,
            height: '92%',
            marginHorizontal: 10,
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
        header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
        iconBtn: {
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: t.inputBg, alignItems: 'center', justifyContent: 'center',
            borderWidth: StyleSheet.hairlineWidth, borderColor: t.border,
        },
        title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.text },

        avatarWrap: { width: 96, height: 96, borderRadius: 999, position: 'relative' },
        avatar: { width: '100%', height: '100%', borderRadius: 999 },

        uploadBtn: {
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: t.inputBg,
            borderWidth: 1,
            borderColor: t.border,
        },
        uploadBtnText: { color: t.primary, fontWeight: '600', fontSize: 14 },

        section: { marginTop: 14, marginBottom: 6, fontWeight: '800', color: t.text },

        inputWithIcon: {
            height: 46, borderRadius: 12, borderWidth: 1, borderColor: t.border,
            backgroundColor: t.inputBg, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center',
        },
        inputInner: { flex: 1, color: t.text },

        checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        checkLabel: { color: t.text },

        footer: {
            flexDirection: 'row', gap: 12, padding: 16,
            borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg,
        },
        cancelBtn: {
            flex: 1, height: 48, borderRadius: 12, backgroundColor: t.inputBg,
            borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center',
        },
        cancelText: { color: t.text, fontWeight: '700' },
        saveBtn: {
            flex: 1, height: 48, borderRadius: 12, backgroundColor: t.primary,
            alignItems: 'center', justifyContent: 'center',
        },
        saveText: { color: t.onPrimary ?? '#fff', fontWeight: '800' },
    });
