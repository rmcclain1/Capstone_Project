// app/notifications/index.tsx
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';

type Notif = {
    id: string;
    title: string;
    timeAgo: string;
    image: string;
};

// static for now
const DATA: Notif[] = [
    {
        id: '1',
        title: 'Your order is on its way!',
        timeAgo: '10m ago',
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=200&q=80',
    },
    {
        id: '2',
        title: 'New recipe added: Spicy Chicken',
        timeAgo: '2h ago',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
    },
    {
        id: '3',
        title: 'Your friend, Alex, shared a recipe',
        timeAgo: '1d ago',
        image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&q=80',
    },
    {
        id: '4',
        title: 'New feature: Meal planning',
        timeAgo: '2d ago',
        image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=200&q=80',
    },
];

export default function NotificationsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={s.headerTitle}>Notifications</Text>
                <View style={{ width: 26 }} />
            </View>

            <FlatList
                data={DATA}
                keyExtractor={(it) => it.id}
                contentContainerStyle={{ paddingBottom: 24 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => <NotificationRow item={item} />}
                style={s.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

function NotificationRow({ item }: { item: Notif }) {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <Pressable
            style={s.row}
            android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
            onPress={() =>
                router.push({
                    pathname: '/notifications/[id]',
                    params: {
                        id: item.id,
                        title: item.title,
                        timeAgo: item.timeAgo,
                        image: item.image,
                        body:
                            'Chef Isabella Rossi just shared a new recipe for Spicy Chicken Tacos. It’s a must-try for your next Taco Tuesday!',
                        from: 'Chef Isabella Rossi',
                    },
                })
            }
        >
            <Image source={{ uri: item.image }} style={s.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={s.title} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={s.time}>{item.timeAgo}</Text>
            </View>
        </Pressable>
    );
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: t.bg,
        },
        header: {
            height: 52,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: t.text,
        },
        list: {
            paddingHorizontal: 16,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: t.card,
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOpacity: t.name === 'light' ? 0.05 : 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            ...(Platform.OS === 'android' ? { elevation: 2 } : null),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.name === 'light' ? 'transparent' : t.border,
        },
        thumb: {
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: t.border,
        },
        title: {
            fontSize: 16,
            fontWeight: '800',
            color: t.text,
        },
        time: {
            marginTop: 4,
            fontSize: 14,
            color: t.primary,
            fontWeight: '600',
        },
    });
