import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/constants/theme_provider';
import { fetchFoodEvent, type FoodEvent } from '../../lib/recalls'

// detail screen pulls full record by id; uses params as initial fallback
export default function RecallDetails() {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    const params = useLocalSearchParams<{ id: string; title?: string; issuer?: string; image?: string }>();
    const [item, setItem] = useState<FoodEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const fe = await fetchFoodEvent(Number(params.id));
                if (!cancelled) setItem(fe);
            } catch {
                // noop
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [params.id]);

    const title = item?.product_description || params.title || 'Recall';

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Recall Details</Text>
                <View style={{ width: 26 }} />
            </View>

            {loading ? (
                <View style={{ paddingTop: 24 }}>
                    <ActivityIndicator />
                </View>
            ) : !item ? (
                <View style={{ padding: 16 }}>
                    <Text style={{ color: theme.text }}>Couldn’t load this recall.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Text style={s.title}>{title}</Text>

                    <Text style={s.meta}>Firm: {item.recalling_firm || '—'}</Text>
                    <Text style={s.meta}>Classification: {item.classification || '—'}</Text>
                    <Text style={s.meta}>Status: {item.status || '—'}</Text>
                    <Text style={s.meta}>Report Date: {item.report_date || '—'}</Text>
                    <Text style={s.meta}>State: {item.state || '—'}</Text>

                    <Text style={s.section}>Reason for Recall</Text>
                    <Text style={s.body}>{item.reason_for_recall || '—'}</Text>

                    <Text style={s.section}>Code Info</Text>
                    <Text style={s.body}>{item.code_info || '—'}</Text>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: t.bg },
        header: {
            height: 52,
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        headerTitle: { fontSize: 18, fontWeight: '800', color: t.text },
        title: { fontSize: 18, fontWeight: '800', color: t.text, marginBottom: 8 },
        meta: { fontSize: 14, color: t.textDim, marginBottom: 4 },
        section: { marginTop: 16, marginBottom: 6, fontSize: 15, fontWeight: '700', color: t.text },
        body: { fontSize: 14, color: t.text },
    });
