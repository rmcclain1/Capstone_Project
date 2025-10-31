// app/modal.tsx (or wherever your modal route lives)
import React, { useMemo } from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/constants/theme_provider';

export default function ModalScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);

    return (
        <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
            <ThemedView style={s.container}>
                {/* Close */}
                <Pressable
                    style={s.closeBtn}
                    onPress={() => router.back()}
                    android_ripple={Platform.OS === 'android' ? { color: theme.border } : undefined}
                    hitSlop={12}
                >
                    <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>

                {/* Content */}
                <ThemedText type="title" style={s.title}>This is a modal</ThemedText>

                <Link href="/" dismissTo style={s.link}>
                    <ThemedText type="link" style={{ color: theme.primary }}>
                        Go to home screen
                    </ThemedText>
                </Link>
            </ThemedView>
        </SafeAreaView>
    );
}

const makeStyles = (t: any) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: t.bg },
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: t.bg,
        },
        closeBtn: {
            position: 'absolute',
            top: 12,
            right: 12,
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.inputBg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },
        title: {
            textAlign: 'center',
            color: t.text,
        },
        link: {
            marginTop: 15,
            paddingVertical: 15,
        },
    });
