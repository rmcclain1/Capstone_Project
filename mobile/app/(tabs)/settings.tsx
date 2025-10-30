// app/settings.tsx (or wherever your Settings screen lives)
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Switch,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/context/auth_context';
import { useTheme } from '@/constants/theme_provider';

type Preference = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const { theme, preference, setPreference } = useTheme(); // <-- theme + current pref
    const s = useMemo(() => makeStyles(theme), [theme]);

    const [pushEnabled, setPushEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            router.replace('/login');
        } catch (e: any) {
            Alert.alert('Logout Failed', e?.response?.data?.error ?? e?.message ?? 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Settings</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                <Text style={s.section}>Account</Text>
                <Row label="Change Password" onPress={() => {}} />
                <Row label="Privacy and Security" onPress={() => {}} />
                <Row label="Log Out" value={loading ? '…' : undefined} onPress={handleLogout} />

                <Text style={s.section}>Notifications</Text>
                <RowSwitch
                    label="Push Notifications"
                    value={pushEnabled}
                    onValueChange={setPushEnabled}
                />
                <RowSwitch
                    label="Sound"
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                />

                {/* Preferences */}
                <Text style={s.section}>App Preferences</Text>
                <Row label="Language" value="English" onPress={() => {}} />

                {/* Theme segmented control */}
                <View style={s.group}>
                    <Text style={s.groupLabel}>Theme</Text>
                    <ThemeSegment
                        value={preference}
                        onChange={setPreference}
                    />
                </View>

                {/* Help & Support */}
                <Text style={s.section}>Help & Support</Text>
                <Row label="FAQ" onPress={() => {}} />
                <Row label="Contact Us" onPress={() => {}} />

                {/* About */}
                <Text style={s.section}>About</Text>
                <Row label="App Version" value="1.2.3" />
                <Row label="Terms of Service" onPress={() => {}} />
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------------- small components ---------------- */

function Row({
                 label,
                 value,
                 onPress,
             }: {
    label: string;
    value?: string;
    onPress?: () => void;
}) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);
    return (
        <Pressable style={s.row} onPress={onPress}>
            <Text style={s.label}>{label}</Text>
            <View style={s.right}>
                {value && <Text style={s.value}>{value}</Text>}
                {onPress && <Ionicons name="chevron-forward" size={18} color={theme.textDim} />}
            </View>
        </Pressable>
    );
}

function RowSwitch({
                       label,
                       value,
                       onValueChange,
                   }: {
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
}) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);
    return (
        <View style={s.row}>
            <Text style={s.label}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
            />
        </View>
    );
}

/** System / Light / Dark segmented control */
function ThemeSegment({
                          value,
                          onChange,
                      }: {
    value: Preference;
    onChange: (p: Preference) => Promise<void> | void;
}) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const options: { key: Preference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
        { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
        { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
        { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
    ];

    return (
        <View style={s.segmentWrap}>
            {options.map((opt, idx) => {
                const active = value === opt.key;
                return (
                    <Pressable
                        key={opt.key}
                        onPress={() => onChange(opt.key)}
                        style={[
                            s.segmentBtn,
                            active && { backgroundColor: theme.primary + '26', borderColor: theme.primary },
                            idx === 0 && s.segmentLeft,
                            idx === options.length - 1 && s.segmentRight,
                        ]}
                    >
                        <Ionicons
                            name={opt.icon}
                            size={16}
                            color={active ? theme.primary : theme.textDim}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[s.segmentText, active && { color: theme.primary, fontWeight: '800' }]}>
                            {opt.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

/* ---------------- styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.bg },
        header: {
            height: 52,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerTitle: { fontSize: 18, fontWeight: '800', color: t.text },

        section: {
            marginTop: 24,
            marginBottom: 8,
            paddingHorizontal: 16,
            fontSize: 16,
            fontWeight: '800',
            color: t.text,
        },

        row: {
            paddingHorizontal: 16,
            height: 52,
            backgroundColor: t.card,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomColor: t.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
        },
        label: { fontSize: 16, fontWeight: '600', color: t.text },
        right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        value: { fontSize: 16, color: t.primary, fontWeight: '600' },

        group: {
            marginHorizontal: 16,
            marginTop: 8,
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        groupLabel: { color: t.text, fontWeight: '800', marginBottom: 10 },

        segmentWrap: {
            flexDirection: 'row',
            borderRadius: 10,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            backgroundColor: t.bg,
        },
        segmentBtn: {
            flex: 1,
            height: 40,
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            borderRightWidth: StyleSheet.hairlineWidth,
            borderRightColor: t.border,
        },
        segmentLeft: { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
        segmentRight: {
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            borderRightWidth: 0,
        },
        segmentText: { color: t.textDim, fontWeight: '700' },
    });
