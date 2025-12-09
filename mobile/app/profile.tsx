// mobile/app/profile.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View, Text, StyleSheet, Image, Pressable, ScrollView,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api'; // Use shared API client
import EditProfileModal from '@/components/edit-profile-modal';
import { useAuth } from '@/app/context/auth_context';
import { useTheme } from '@/constants/theme_provider';

/* -------------------- helpers -------------------- */

function toArray(raw: any): string[] {
    if (Array.isArray(raw)) {
        if (raw.length === 1 && typeof raw[0] === 'string') {
            const t = raw[0].trim();
            if (t.startsWith('[')) {
                try {
                    const parsed = JSON.parse(t);
                    if (Array.isArray(parsed)) return parsed.filter(x => typeof x === 'string');
                } catch { }
            }
        }
        return raw.filter(x => typeof x === 'string');
    }
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (t.startsWith('[')) {
            try {
                const parsed = JSON.parse(t);
                if (Array.isArray(parsed)) return parsed.filter(x => typeof x === 'string');
            } catch { }
        }
        return [t];
    }
    return [];
}

function splitName(full?: string) {
    const s = (full || '').trim();
    if (!s) return { first_name: '', last_name: '' };
    const parts = s.split(/\s+/);
    return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
}

function toISODateMaybe(val?: string) {
    if (!val) return undefined;
    const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return val;
    const [, MM, DD, YYYY] = m;
    return `${YYYY}-${MM.padStart(2, '0')}-${DD.padStart(2, '0')}`;
}

const FIXED_ALLERGIES = ['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Egg', 'Dairy', 'Gluten', 'Soy'] as const;

function allergiesToToggleMap(allergies: string[]) {
    const rec: Record<string, boolean> = {
        Peanuts: false, 'Tree Nuts': false, Shellfish: false, Fish: false,
        Egg: false, Dairy: false, Gluten: false, Soy: false, Other: false,
    };
    for (const a of allergies) {
        if (a in rec) rec[a] = true;
        else rec['Other'] = true;
    }
    return rec;
}

function firstOther(allergies: string[]) {
    const fixed = new Set(FIXED_ALLERGIES);
    return allergies.find(a => !fixed.has(a as any)) || '';
}

function modalToAllergyArray(record: Record<string, boolean> = {}, other?: string) {
    const out: string[] = [];
    FIXED_ALLERGIES.forEach(k => { if (record[k]) out.push(k); });
    if (record['Other'] && other?.trim()) out.push(other.trim());
    return out;
}

/* -------------------- screen -------------------- */

export default function Profile() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const { user, setUser, refreshUser, loading } = useAuth();
    const [editOpen, setEditOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const fullName = useMemo(() => {
        const fn = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
        return fn || user?.username || '';
    }, [user]);

    const allergies = useMemo(() => toArray(user?.allergies), [user]);

    // Fix Google profile images - remove size params and use larger size
    const avatarUrl = useMemo(() => {
        const url = user?.avatar_url || user?.profile_picture_url;
        if (!url) return 'https://i.pravatar.cc/100?img=12';

        // If it's a Google profile image, strip size params and use s200-c for better quality
        if (url.includes('googleusercontent.com')) {
            return url.replace(/=s\d+-c/, '=s200-c');
        }

        return url;
    }, [user]);

    const onRefresh = useCallback(async () => {
        if (!user) return;
        try {
            console.log('[Profile] Refreshing...');
            setRefreshing(true);
            await refreshUser();
            console.log('[Profile] Refreshed');
        } catch (e: any) {
            console.error('[Profile] Refresh error:', e?.response?.data || e.message);
            Alert.alert('Error', e?.message ?? 'Failed to refresh profile');
        } finally {
            setRefreshing(false);
        }
    }, [user, refreshUser]);

    const onSave = useCallback(async (payload: any) => {
        if (!user) return;
        try {
            console.log('[Profile] Saving...', payload);
            setSaving(true);

            const body = {
                user: {
                    ...splitName(payload.name),
                    username: payload.username,
                    email: payload.email,
                    phonenumber: payload.phone, // Note: backend uses 'phonenumber'
                    birthday: toISODateMaybe(payload.birthday),
                    location: payload.location,
                    avatar_url: payload.profile_picture_url, // Match what modal sends
                    allergies: modalToAllergyArray(payload.allergies, payload.otherAllergy),
                },
            };

            console.log('[Profile] Sending update:', body);
            const { data } = await api.put(`/api/v1/users/${user.id}`, body);
            console.log('[Profile] Update successful');

            setUser({ ...data, allergies: toArray(data.allergies) });
            setEditOpen(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (e: any) {
            console.error('[Profile] Update error:', e?.response?.data || e.message);
            Alert.alert('Update failed',
                e?.response?.data?.errors?.join(', ') ??
                e?.response?.data?.error ??
                e?.message ?? 'Unknown error'
            );
        } finally {
            setSaving(false);
        }
    }, [user, setUser]);

    if (loading) {
        return (
            <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: theme.text, marginBottom: 12 }}>You're signed out.</Text>
                <Pressable onPress={() => router.replace('/login')} style={s.editBtn}>
                    <Text style={s.editBtnText}>Sign in</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.screen} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Text style={s.back}>{'‹'}</Text>
                </Pressable>
                <Text style={s.headerTitle}>Profile</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
            >
                <View style={s.center}>
                    <Image
                        source={{ uri: avatarUrl }}
                        style={s.avatar}
                    />
                    <Text style={s.name}>{fullName || 'User'}</Text>
                    {user.username && <Text style={s.username}>@{user.username}</Text>}
                    <Pressable
                        onPress={() => setEditOpen(true)}
                        style={s.editBtn}
                        disabled={saving}
                    >
                        <Text style={s.editBtnText}>{saving ? 'Saving...' : 'Edit Profile'}</Text>
                    </Pressable>
                </View>

                <Text style={s.sectionTitle}>Personal Information</Text>
                <InfoRow label="Email" value={user.email || '—'} />
                <InfoRow label="Phone Number" value={user.phonenumber || user.phone_number || '—'} />
                <InfoRow label="Birthday" value={user.birthday || '—'} />
                <InfoRow label="Location" value={user.location || '—'} />

                <Text style={s.sectionTitle}>Allergies</Text>
                {allergies.length ? (
                    allergies.map((a, i) => <Text key={`${a}-${i}`} style={s.allergy}>{a}</Text>)
                ) : (
                    <Text style={[s.allergy, { color: theme.textDim }]}>None</Text>
                )}
            </ScrollView>

            {/* Edit Modal */}
            <EditProfileModal
                visible={editOpen}
                onClose={() => setEditOpen(false)}
                initial={{
                    name: fullName,
                    username: user.username || '',
                    email: user.email || '',
                    phone: user.phonenumber || user.phone_number || '',
                    birthday: user.birthday || '',
                    location: user.location || '',
                    profile_picture_url: avatarUrl,
                    allergies: allergiesToToggleMap(allergies),
                    otherAllergy: firstOther(allergies),
                }}
                onSave={onSave}
            />
        </SafeAreaView>
    );
}

/* -------------------- small components & styles -------------------- */

function InfoRow({ label, value }: { label: string; value: string }) {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);
    return (
        <View style={{ marginBottom: 30 }}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
        </View>
    );
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.bg },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            height: 56,
        },
        back: { fontSize: 28, color: t.text },
        headerTitle: { fontSize: 18, fontWeight: '700', color: t.text },

        center: { alignItems: 'center', marginTop: 12 },
        avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: t.border },
        name: { marginTop: 12, fontSize: 22, fontWeight: '800', color: t.text },
        username: { marginTop: 4, fontSize: 16, color: t.primary },

        editBtn: {
            marginTop: 16,
            backgroundColor: t.inputBg,
            paddingVertical: 10,
            paddingHorizontal: 24,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        editBtnText: { color: t.text, fontWeight: '600' },

        sectionTitle: {
            marginTop: 24,
            marginBottom: 24,
            paddingHorizontal: 16,
            fontSize: 18,
            fontWeight: '700',
            color: t.text,
        },
        infoLabel: {
            fontSize: 15,
            fontWeight: '600',
            color: t.text,
            opacity: 0.8,
            marginHorizontal: 16,
        },
        infoValue: { fontSize: 15, color: t.primary, marginHorizontal: 16 },
        allergy: { fontSize: 15, color: t.text, marginHorizontal: 16, marginBottom: 24 },
    });