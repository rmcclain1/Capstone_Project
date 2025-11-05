import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TextInput,
    Pressable,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';

// pulls FDA events from the backend
import { fetchFoodEvents, type FoodEvent } from '../../lib/recalls';

type Recall = {
    id: string;
    title: string;
    issuer: 'FDA' | 'USDA' | string;
    image: string;
};

// quick thumbnail picker so cards aren’t empty
const pickImageFor = (desc?: string) => {
    const d = (desc || '').toLowerCase();
    if (d.includes('spinach') || d.includes('leaf')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80';
    }
    if (d.includes('beef')) {
        return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80';
    }
    if (d.includes('peanut')) {
        return 'https://images.unsplash.com/photo-1505575972945-270b6aebc74b?w=200&q=80';
    }
    if (d.includes('chicken') || d.includes('poultry')) {
        return 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=200&q=80';
    }
    return 'https://images.unsplash.com/photo-1584395630827-860eee694d7b?w=200&q=80';
};

// debounce so we don’t spam the API while typing
function useDebounced<T>(value: T, delayMs: number) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return v;
}

export default function RecallsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const [q, setQ] = useState('');
    const debouncedQ = useDebounced(q, 300);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Recall[]>([]);
    const mounted = useRef(true);

    // map backend row → card props
    const toRecall = (fe: FoodEvent): Recall => ({
        id: String(fe.id),
        title: fe.product_description || 'Recall',
        issuer: 'FDA',
        image: pickImageFor(fe.product_description ?? ''),
    });

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // fetch when the debounced query changes
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data } = await fetchFoodEvents({
                    q: debouncedQ || undefined,
                    per: 25,
                });
                if (!cancelled && mounted.current) {
                    setItems((data || []).map(toRecall));
                }
            } catch {
                if (!cancelled && mounted.current) setItems([]);
            } finally {
                if (!cancelled && mounted.current) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedQ]);

    // keep local filter too
    const results = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return items;
        return items.filter(
            r => r.title.toLowerCase().includes(term) || r.issuer.toLowerCase().includes(term),
        );
    }, [q, items]);

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Recalls</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* search */}
            <View style={s.searchWrap}>
                <Ionicons name="search" size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Search Recalls"
                    placeholderTextColor={theme.textDim}
                    style={s.searchInput}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* light loading hint under search */}
            {loading ? (
                <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    <ActivityIndicator />
                </View>
            ) : null}

            {/* list */}
            <FlatList
                data={results}
                keyExtractor={it => it.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                ListHeaderComponent={<Text style={s.section}>Recent Recalls</Text>}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    <Pressable
                        style={s.row}
                        android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                        onPress={() =>
                            router.push({
                                pathname: '/recalls/[id]',
                                params: {
                                    id: item.id,
                                    title: item.title,
                                    issuer: item.issuer,
                                    image: item.image,
                                },
                            })
                        }
                    >
                        <Image source={{ uri: item.image }} style={s.thumb} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.title} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={s.issuer}>Issued by {item.issuer}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.textDim} />
                    </Pressable>
                )}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
                            <Text style={{ color: theme.textDim }}>No recalls found.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

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

        searchWrap: {
            marginHorizontal: 16,
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.inputBg,
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        searchInput: { flex: 1, fontSize: 16, color: t.text },

        section: {
            marginTop: 16,
            marginBottom: 8,
            fontSize: 18,
            fontWeight: '800',
            color: t.text,
        },

        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: t.card,
            borderRadius: 16,
            padding: 12,
            shadowColor: '#000',
            shadowOpacity: t.name === 'light' ? 0.05 : 0.16,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            ...(Platform.OS === 'android' ? { elevation: 2 } : null),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.name === 'dark' ? t.border : 'transparent',
        },
        thumb: {
            width: 48,
            height: 48,
            borderRadius: 10,
            backgroundColor: t.border,
        },
        title: { fontSize: 16, fontWeight: '800', color: t.text },
        issuer: { marginTop: 2, color: t.primary, fontWeight: '700' },
    });
