// app/recalls/index.tsx
import React, { useMemo, useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';

type Recall = {
    id: string;
    title: string;
    issuer: 'FDA' | 'USDA' | string;
    image: string;
};

const DATA: Recall[] = [
    {
        id: 'r1',
        title: 'Spinach Recall',
        issuer: 'FDA',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80',
    },
    {
        id: 'r2',
        title: 'Ground Beef Recall',
        issuer: 'USDA',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
    },
    {
        id: 'r3',
        title: 'Peanut Butter Recall',
        issuer: 'FDA',
        image: 'https://images.unsplash.com/photo-1505575972945-270b6aebc74b?w=200&q=80',
    },
    {
        id: 'r4',
        title: 'Chicken Recall',
        issuer: 'USDA',
        image: 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=200&q=80',
    },
];

export default function RecallsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const [q, setQ] = useState('');
    const [recalls, setRecalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecalls() {
            try {
                const res = await fetch('http://localhost:3000/api/v1/food_events');
                const data = await res.json();

                const mapped = data.map((r: any) => ({
                    id: r.id.toString(),
                    title: r.product_description || 'Unnamed Recall',
                    issuer: r.recalling_firm || 'Unknown',
                    image: 'https://images.unsplash.com/photo-1585238342023-78df9f2601e4?w=200&q=80',
                    reason: r.reason_for_recall,
                    type: r.product_type,
                    report_date: r.report_date,
            }));

            setRecalls(mapped);
            } catch (error) {
            console.error('Error fetching recalls:', error);
            } finally {
            setLoading(false);
            }
        }

        fetchRecalls();
    }, []);

    const results = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return recalls;
        return recalls.filter(
            r =>
                r.title.toLowerCase().includes(term) ||
                r.issuer.toLowerCase().includes(term),
        );
    }, [q, recalls]);

    if (loading) {
    return (
      <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Recalls</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* Search */}
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

            {/* List */}
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
                                    title: item.product_description,
                                    image: 'https://images.unsplash.com/photo-1585238342023-78df9f2601e4?w=200&q=80', // optional placeholder
                                    reason: item.reason_for_recall,
                                    manufacturer: item.recalling_firm,
                                    authority: 'FDA',
                                    affectedDates: item.recall_initiation_date,
                                    batchLot: item.code_info,
                                    upc: 'N/A',
                                    },
                                })
                        }
                    >
                        <Image source={require('../../assets/images/FDA_LOGO.png')} style={[s.thumb, { backgroundColor: 'white' }]} resizeMode="contain" />
                        <View style={{ flex: 1 }}>
                            <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                            <Text style={s.issuer}>Issued by {item.issuer}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.textDim} />
                    </Pressable>
                )}
                showsVerticalScrollIndicator={false}
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
