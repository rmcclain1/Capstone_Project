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
import { useTheme } from '@/constants/theme_provider';


export default function RecallsScreen() {
    const router = useRouter();
    const [q, setQ] = useState('');
    const [recalls, setRecalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { theme } = useTheme();
    const styles = useMemo(() => s(theme), [theme]);

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
            <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recalls</Text>
                <View style={{ width: 26 }} />
            </View>

            <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color="#5F5F5F" style={{ marginRight: 8 }} />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Search Recalls"
                    placeholderTextColor="#5F5F5F"
                    style={styles.searchInput}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
            </View>

            <FlatList
                data={results}
                keyExtractor={it => it.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                ListHeaderComponent={<Text style={styles.section}>Recent Recalls</Text>}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.row}
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
                            style={styles.thumb}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title} numberOfLines={1}>
                                {item.product_description}
                            </Text>
                            <Text style={styles.issuer}>Issued by {item.recalling_firm}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#B8AEE0" />
                    </Pressable>
                )}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const s = (theme: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    header: {
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },

    searchWrap: {
        marginHorizontal: 16,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.inputBg,
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.text,
    },

    section: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: theme.name === 'light' ? 0.05 : 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    thumb: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: theme.border,
    },
    title: { fontSize: 16, fontWeight: '800', color: theme.text },
    issuer: { marginTop: 2, color: theme.text, fontWeight: '700' },
});