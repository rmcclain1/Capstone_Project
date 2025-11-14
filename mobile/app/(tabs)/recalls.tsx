import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TextInput,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#2362ffff';
const BG = '#F5F3FA';


export default function RecallsScreen() {
    const router = useRouter();
    const [q, setQ] = useState('');
    const [recalls, setRecalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecalls() {
            try {
                const res = await fetch('http://localhost:3000/api/v1/food_events');
                const data = await res.json();
                setRecalls(data);
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
                r.product_description?.toLowerCase().includes(term) ||
                r.recalling_firm?.toLowerCase().includes(term)
        );
    }, [q, recalls]);

    if (loading) {
        return (
            <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={PURPLE} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Recalls</Text>
                <View style={{ width: 26 }} />
            </View>

            <View style={s.searchWrap}>
                <Ionicons name="search" size={18} color="#5F5F5F" style={{ marginRight: 8 }} />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Search Recalls"
                    placeholderTextColor="#5F5F5F"
                    style={s.searchInput}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
            </View>

            <FlatList
                data={results}
                keyExtractor={it => it.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                ListHeaderComponent={<Text style={s.section}>Recent Recalls</Text>}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    <Pressable
                        style={s.row}
                        android_ripple={{ color: '#eee' }}
                        onPress={() =>
                            router.push({
                                pathname: '/recalls/[id]',
                                params: {
                                    id: item.id,
                                    title: item.product_description,
                                    image: 'https://images.unsplash.com/photo-1585238342023-78df9f2601e4?w=200&q=80', // optional placeholder
                                    reason: item.reason_for_recall,
                                    manufacturer: item.recalling_firm,
                                    authority: item.product_type,
                                    affectedDates: item.report_date,
                                },
                            })
                        }
                    >
                        <Image
                            source={{
                                uri:
                                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTinceT4qU-by39MTOb6iTSCedX1w_PLrds3g&s',
                            }}
                            style={s.thumb}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={s.title} numberOfLines={1}>
                                {item.product_description}
                            </Text>
                            <Text style={s.issuer}>Issued by {item.recalling_firm}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#B8AEE0" />
                    </Pressable>
                )}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

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

    searchWrap: {
        marginHorizontal: 16,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9e9f5ff',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1523',
    },

    section: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1523',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    thumb: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#EDEDED',
    },
    title: { fontSize: 16, fontWeight: '800', color: '#1A1523' },
    issuer: { marginTop: 2, color: PURPLE, fontWeight: '700' },
});