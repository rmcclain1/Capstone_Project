import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    Image,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import ScanSheet from '@/components/scan-sheet';
import AddItemModal from '@/components/add-item-modal';
import { useAuth } from '@/app/context/auth_context';

const PURPLE = '#6E56CF';
const BG = '#F5F3FA';

type ApiPantry = {
    id: number;
    user_id: number;
    item_name: string;
    expiration_date?: string | null;
    bestby_date?: string | null;
    manufacturer?: string | null;
    lot_number?: number | null;
    country_of_origin?: string | null;
    allergen?: string | null;
    expired?: boolean | null;
    category?: string | null;
    image_url?: string | null;   // <— add this
};

type PantryItem = {
    id: string;
    name: string;
    sub?: string;
    image?: string;
    status?: 'soon' | 'expired' | 'ok';
    expiring?: boolean;
};

/* ---------------- helpers ---------------- */

function getBaseUrl() {
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api/v1';
    return 'http://127.0.0.1:3000/api/v1';
}
const API_BASE = getBaseUrl();

function useDebounced<T>(value: T, delay = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

/** Parse 'YYYY-MM-DD' safely */
function parseISODate(s?: string | null): Date | null {
    if (!s) return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
}

/** Compute status from expiration + expired flag */
function computeStatus(expiration_date?: string | null, expiredFlag?: boolean | null): 'soon' | 'expired' | 'ok' {
    if (expiredFlag) return 'expired';
    const exp = parseISODate(expiration_date);
    if (!exp) return 'ok';
    const today = new Date();
    const td = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const ed = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
    if (ed < td) return 'expired';
    const diffDays = Math.round((ed - td) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 ? 'soon' : 'ok';
}

function mapToUI(i: ApiPantry) {
    const status = computeStatus(i.expiration_date, i.expired ?? undefined);
    const parts: string[] = [];
    if (i.category) parts.push(String(i.category));
    if (i.manufacturer) parts.push(String(i.manufacturer));
    if (i.expiration_date) parts.push(`EXP ${i.expiration_date}`);
    if (i.lot_number != null) parts.push(`Lot ${i.lot_number}`);

    return {
        id: String(i.id),
        name: i.item_name,
        sub: parts.join(' • '),
        status,
        expiring: status === 'soon',
        image: i.image_url || undefined
    };
}

/** AddItemModal → server payload helpers */
function toISODateMaybe(mmddyyyy?: string | null) {
    if (!mmddyyyy) return null;
    const m = String(mmddyyyy).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const [, MM, DD, YYYY] = m;
    return `${YYYY}-${MM.padStart(2, '0')}-${DD.padStart(2, '0')}`;
}
function isExpiredFromMMDDYYYY(mmddyyyy?: string) {
    const iso = toISODateMaybe(mmddyyyy);
    if (!iso) return false;
    const [Y, M, D] = iso.split('-').map(Number);
    const exp = new Date(Y, M - 1, D);
    const today = new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const e = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
    return e < t;
}

/* ---------------- screen ---------------- */

export default function PantryScreen() {
    const { token } = useAuth();
    const [q, setQ] = useState('');
    const dq = useDebounced(q, 250);
    const [tab, setTab] = useState<'all' | 'soon' | 'expired'>('all');

    const [items, setItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [scanOpen, setScanOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);

    const api = useMemo(() => {
        const inst = axios.create({ baseURL: API_BASE });
        if (token) inst.defaults.headers.common.Authorization = `Bearer ${token}`;
        return inst;
    }, [token]);

    const fetchPantry = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);

            // If you add backend filters later, pass them here via params.
            const { data } = await api.get('/pantries');
            const raw: ApiPantry[] = Array.isArray(data) ? data : data?.items || [];
            const mapped = raw.map(mapToUI);

            // Client-side filtering for now (search + tabs)
            const filtered = mapped.filter((it) => {
                if (tab === 'soon' && it.status !== 'soon') return false;
                if (tab === 'expired' && it.status !== 'expired') return false;
                if (dq.trim()) {
                    const t = dq.toLowerCase();
                    const hay = (it.name + ' ' + (it.sub || '')).toLowerCase();
                    if (!hay.includes(t)) return false;
                }
                return true;
            });

            setItems(filtered);
        } catch (e: any) {
            console.log('Fetch pantries failed:', e?.response?.data || e?.message);
            setError(e?.response?.data?.error || e?.message || 'Failed to load pantry');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [api, dq, tab]);

    useEffect(() => {
        fetchPantry();
    }, [fetchPantry]);

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchPantry();
        } finally {
            setRefreshing(false);
        }
    };

    const onSubmitNew = async (form: {
        name: string;
        imageUri?: string;        // remote URL only for Option B
        expiresAt?: string;       // MM/DD/YYYY
        manufacturer?: string;
        lotNumber?: string;
        country?: string;
        allergens?: string;
    }) => {
        try {
            const item_name = (form.name || '').trim();
            if (!item_name) {
                Alert.alert('Missing name', 'Please enter an item name.');
                return;
            }

            const expiration_date = toISODateMaybe(form.expiresAt);
            const lot_number =
                form.lotNumber && form.lotNumber.trim() !== '' ? Number(form.lotNumber) : null;
            if (form.lotNumber && Number.isNaN(lot_number)) {
                Alert.alert('Invalid lot number', 'Lot number must be numeric.');
                return;
            }

            const body: any = {
                pantry: {
                    item_name,
                    expiration_date,
                    bestby_date: null,
                    manufacturer: form.manufacturer?.trim() || null,
                    lot_number,
                    country_of_origin: form.country?.trim() || null,
                    allergen: form.allergens?.trim() || null,
                    expired: isExpiredFromMMDDYYYY(form.expiresAt),
                    category: null,
                },
            };

            // Only attach if it's clearly a remote URL
            if (form.imageUri && /^https?:\/\//i.test(form.imageUri)) {
                body.pantry.image_url = form.imageUri.trim();
            }

            await api.post('/pantries', body);
            setAddOpen(false);
            await fetchPantry();
        } catch (e: any) {
            console.log('Create pantry failed:', e?.response?.data || e?.message);
            Alert.alert(
                'Add Failed',
                e?.response?.data?.errors?.join(', ') ??
                e?.response?.data?.error ??
                e?.message ?? 'Unknown error'
            );
        }
    };

    console.log(items)

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            <View style={s.header}>
                <Pressable onPress={() => setScanOpen(true)}>
                    <Ionicons name="qr-code-outline" size={24} color={PURPLE} />
                </Pressable>
                <Text style={s.headerTitle}>Pantry</Text>
                <Pressable onPress={() => setAddOpen(true)}>
                    <Text style={s.add}>Add</Text>
                </Pressable>
            </View>

            <View style={s.searchWrap}>
                <Ionicons name="search" size={18} color="#7A6A9A" style={{ marginRight: 8 }} />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Search pantry"
                    placeholderTextColor="#9A8FBF"
                    style={s.searchInput}
                    returnKeyType="search"
                />
            </View>

            <View style={s.tabs}>
                {(['all', 'soon', 'expired'] as const).map((key) => (
                    <Pressable key={key} onPress={() => setTab(key)} style={s.tabBtn}>
                        <Text
                            style={[
                                s.tabText,
                                tab === key && { color: PURPLE, fontWeight: '700' },
                            ]}
                        >
                            {key === 'all' ? 'All' : key === 'soon' ? 'Expires Soon' : 'Expired'}
                        </Text>
                        {tab === key && <View style={s.tabIndicator} />}
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={PURPLE} />
                    {!!error && <Text style={{ marginTop: 10, color: '#B00020' }}>{error}</Text>}
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: '#7A6A9A' }}>
                                {dq || tab !== 'all'
                                    ? 'No items match your filters.'
                                    : 'Your pantry is empty. Add your first item!'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={s.row}>
                            <Image
                                source={{ uri: item.image }}
                                style={s.thumb}
                            />

                            <View style={{ flex: 1 }}>
                                <Text style={s.name}>{item.name}</Text>
                                {!!item.sub && <Text style={s.sub}>{item.sub}</Text>}
                            </View>
                            {item.status === 'expired' ? (
                                <Ionicons name="alert-circle-outline" size={20} color="#B00020" />
                            ) : item.status === 'soon' ? (
                                <Ionicons name="warning-outline" size={20} color={PURPLE} />
                            ) : null}
                        </View>
                    )}
                />
            )}

            <ScanSheet visible={scanOpen} onClose={() => setScanOpen(false)} />

            <AddItemModal
                visible={addOpen}
                onClose={() => setAddOpen(false)}
                onSubmit={onSubmitNew}
            />
        </SafeAreaView>
    );
}

/* ---------------- styles ---------------- */

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG },
    header: {
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1523' },
    add: { color: PURPLE, fontWeight: '700', fontSize: 16 },

    searchWrap: {
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEE9F7',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
    },
    searchInput: { flex: 1, fontSize: 16, color: '#1A1523' },

    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomColor: '#EEE9F7',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabBtn: { alignItems: 'center', paddingVertical: 8, flex: 1 },
    tabText: { fontSize: 15, color: '#7A6A9A' },
    tabIndicator: {
        marginTop: 4,
        width: 20,
        height: 3,
        borderRadius: 2,
        backgroundColor: PURPLE,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
    },
    thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#EEE' },
    name: { fontSize: 16, fontWeight: '700', color: '#1A1523' },
    sub: { fontSize: 13, color: '#7A6A9A', marginTop: 2 },
});
