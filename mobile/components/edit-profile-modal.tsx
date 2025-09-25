import React, { useRef, useState } from 'react';
import {
    Modal, Animated, Easing, SafeAreaView, KeyboardAvoidingView,
    Platform, View, Text, StyleSheet, TouchableOpacity, Image,
    ScrollView, TextInput, Switch
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSave?: (p: any) => void;
    initial?: {
        name?: string; username?: string; email?: string; phone?: string;
        birthday?: string; location?: string; avatarUri?: string;
        allergies?: Record<string, boolean>; otherAllergy?: string;
    };
};

const ALLERGY_LIST = [
    'Peanuts','Tree Nuts','Shellfish','Fish','Egg','Dairy','Gluten','Soy','Other',
];

export default function EditProfileModal({ visible, onClose, onSave, initial }: Props) {
    const backdrop = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

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

    // form state
    const [name, setName] = useState(initial?.name || 'Jane Doe');
    const [username, setUsername] = useState(initial?.username || 'janedoe');
    const [email, setEmail] = useState(initial?.email || 'jane.doe@example.com');
    const [phone, setPhone] = useState(initial?.phone || '+1 (555) 123-4567');
    const [birthday, setBirthday] = useState(initial?.birthday || '05/15/1990');
    const [location, setLocation] = useState(initial?.location || 'San Francisco, CA');
    const [avatarUri, setAvatarUri] = useState<string | undefined>(initial?.avatarUri);
    const [allergies, setAllergies] = useState<Record<string, boolean>>({
        ...ALLERGY_LIST.reduce((acc, k) => ({ ...acc, [k]: false }), {}),
        ...(initial?.allergies || {}),
    });
    const [otherAllergy, setOtherAllergy] = useState(initial?.otherAllergy || '');

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const res = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [1,1], quality: 0.8
        });
        if (!res.canceled) setAvatarUri(res.assets[0].uri);
    };

    const toggleAllergy = (key: string) =>
        setAllergies((a) => ({ ...a, [key]: !a[key] }));

    const save = () => {
        onSave?.({ name, username, email, phone, birthday, location, avatarUri, allergies, otherAllergy });
        runClose();
    };

    return (
        <Modal visible={visible} transparent animationType="none" onShow={runOpen} onRequestClose={runClose}>
            {/* Backdrop */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: backdrop }]} />

            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding' })} style={styles.kav}>
                    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={runClose} style={styles.iconBtn} hitSlop={12}>
                                <Ionicons name="chevron-back" size={20} color="#0F172A" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Edit Profile</Text>
                            <View style={{ width: 36 }} />
                        </View>

                        {/* Scrollable content */}
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Avatar */}
                            <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 10 }}>
                                <View style={styles.avatarWrap}>
                                    {avatarUri ? (
                                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                            <Ionicons name="person" size={38} color="#9CA3AF" />
                                        </View>
                                    )}
                                    <TouchableOpacity style={styles.editBadge} onPress={pickAvatar}>
                                        <Ionicons name="create-outline" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Fields */}
                            <Label text="Name" />
                            <Input value={name} onChangeText={setName} placeholder="Your name" />

                            <Label text="Username" />
                            <Input value={username} onChangeText={setUsername} autoCapitalize="none" />

                            <Text style={styles.section}>Personal Information</Text>

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
                                    placeholderTextColor="#A3A3A3"
                                    style={styles.inputInner}
                                />
                                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                            </View>

                            <Label text="Location" />
                            <Input value={location} onChangeText={setLocation} />

                            <Text style={styles.section}>Food Allergies</Text>
                            <View style={{ gap: 10 }}>
                                {ALLERGY_LIST.map((k) => (
                                    <View key={k} style={styles.checkRow}>
                                        <Switch
                                            value={!!allergies[k]}
                                            onValueChange={() => toggleAllergy(k)}
                                            trackColor={{ false: '#E5E7EB', true: '#DDD6FE' }}
                                            thumbColor={allergies[k] ? '#6E56CF' : '#F9FAFB'}
                                        />
                                        <Text style={styles.checkLabel}>{k}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Other specify */}
                            <Input
                                value={otherAllergy}
                                onChangeText={setOtherAllergy}
                                placeholder="Please specify"
                                style={{ marginTop: 8 }}
                            />
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={runClose} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={save} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

/* ---------- small presentational helpers ---------- */
function Label({ text }: { text: string }) {
    return <Text style={styles.label}>{text}</Text>;
}
function Input(props: any) {
    return <TextInput {...props} placeholderTextColor="#A3A3A3" style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
    safe: { flex: 1, justifyContent: 'flex-end' },
    kav: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        flex: 1,
        height: '92%',
        marginHorizontal: 10,
        backgroundColor: '#FFF',
        borderRadius: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: -4 } },
            android: { elevation: 12 },
        }),
        overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconBtn: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6',
        alignItems: 'center', justifyContent: 'center',
    },
    title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#0F172A' },

    avatarWrap: { width: 96, height: 96, borderRadius: 999, position: 'relative' },
    avatar: { width: '100%', height: '100%', borderRadius: 999 },
    editBadge: {
        position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 999,
        backgroundColor: '#6E56CF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF',
    },

    section: { marginTop: 14, marginBottom: 6, fontWeight: '800', color: '#111827' },

    label: { color: '#4B5563', fontWeight: '700', marginTop: 10, marginBottom: 6 },
    input: {
        height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        backgroundColor: '#F3F4F6', paddingHorizontal: 14, color: '#111827',
    },
    inputWithIcon: {
        height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        backgroundColor: '#F3F4F6', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center',
    },
    inputInner: { flex: 1, color: '#111827' },

    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkLabel: { color: '#111827' },

    footer: {
        flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#EEF2F7', backgroundColor: '#FFF',
    },
    cancelBtn: {
        flex: 1, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { color: '#111827', fontWeight: '700' },
    saveBtn: {
        flex: 1, height: 48, borderRadius: 12, backgroundColor: '#6E56CF',
        alignItems: 'center', justifyContent: 'center',
    },
    saveText: { color: '#FFF', fontWeight: '800' },
});
