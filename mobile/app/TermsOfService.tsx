import { useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'; // Ensures UI elements are displayed within safe boundaries.
import { useRouter } from 'expo-router'; // for handling screen-to-screen navigation
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@/constants/theme_provider'; // 'useTheme' is used to re-render components with updated color palettes.


/* -------------------- screen: Terms of Service -------------------- */
/*
   Displays the app’s Terms of Service text. 
   This screen respects the current light/dark theme from `useTheme`
   and uses `useRouter` for navigation control (e.g., back button).
*/
export default function TermsOfService() {
    const { theme } = useTheme();
    const s = useMemo(() => makeStyles(theme), [theme]);
    const router = useRouter();

    return (
        <SafeAreaView style={s.screen} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Text style={s.back}>{'‹'}</Text>
                </Pressable>
                <Text style={s.headerTitle}>Terms of Service</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                <Text style={s.sectionTitle}>Acceptance of Terms</Text>
                <Text style={s.section}>
                    By accessing or using this application (“the App”),
                    you agree to be bound by these Terms of Service.
                    If you do not agree, do not use the App.
                </Text>

                <Text style={s.sectionTitle}>Description of Service</Text>
                <Text style={s.section}>
                    The App allows users to maintain a personal inventory (“Pantry”)
                    and monitors those items against public recall notices provided by the U.S. Food and Drug Administration (FDA).
                    The App does not provide professional food safety, medical, or legal advice. It is intended for informational purposes only.
                </Text>

                <Text style={s.sectionTitle}>User Responsibilities</Text>
                <Text style={s.section}>
                    You are responsible for entering accurate product information.
                    The App’s recall detection accuracy depends on the quality and completeness of the data you provide.
                    You must use the App in compliance with applicable laws and regulations.
                </Text>

                <Text style={s.sectionTitle}>Data Sources and Accuracy</Text>
                <Text style={s.section}>
                    Recall data is obtained from public FDA datasets and is not controlled or verified by the App developers.
                    We make no guarantees regarding the timeliness, accuracy, or completeness of recall information.
                </Text>

                <Text style={s.sectionTitle}>Notifications and Limitations</Text>
                <Text style={s.section}>
                    The App may send recall alerts and notifications; however, we cannot guarantee immediate delivery or absolute accuracy of those alerts.
                    Users should always verify recall information directly from official sources such as the FDA.
                </Text>

                <Text style={s.sectionTitle}>Privacy</Text>
                <Text style={s.section}>
                    User-provided information such as pantry items is stored locally or in the connected account database
                    and is not shared with third parties, except as required by law.
                    No personal identifying data is shared with the FDA.
                </Text>

                <Text style={s.sectionTitle}>Limitation of Liability</Text>
                <Text style={s.section}>
                    The developers are not liable for any losses, damages, or injuries
                    resulting from reliance on the App’s data or from missed recall alerts.
                    Use of the App is at your own risk.
                </Text>

                <Text style={s.sectionTitle}>Intellectual Property</Text>
                <Text style={s.section}>
                    The App and its content (excluding FDA data) are owned by the developers.
                    You may not reproduce, modify, or distribute the App’s content without permission.
                </Text>

                <Text style={s.sectionTitle}>Changes to These Terms</Text>
                <Text style={s.section}>
                    We may update these Terms periodically. Continued use of the App after updates constitutes acceptance of the revised Terms.
                </Text>

                <Text style={s.sectionTitle}>Contact</Text>
                <Text style={s.section}>
                    For questions or concerns about these Terms, contact the development team.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}


/* ---------------- Styles ---------------- */

const makeStyles = (t: any) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: t.bg
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
            color: t.text
        },

        section: {
            marginTop: 2,
            marginBottom: 8,
            paddingHorizontal: 16,
            fontSize: 14,
            fontWeight: '600',
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

        label: {
            fontSize: 16,
            fontWeight: '600',
            color: t.text
        },

        right: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
        },

        value: {
            fontSize: 16,
            color: t.primary,
            fontWeight: '600'
        },

        group: {
            marginHorizontal: 16,
            marginTop: 8,
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
        },

        groupLabel: {
            color: t.text,
            fontWeight: '800',
            marginBottom: 10
        },

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

        segmentLeft: {
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10
        },

        segmentRight: {
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            borderRightWidth: 0,
        },

        segmentText: {
            color: t.textDim,
            fontWeight: '700'
        },

        back: {
            fontSize: 28,
            color: t.text
        },

        sectionTitle: {
            marginTop: 24,
            marginBottom: 4,
            paddingHorizontal: 16,
            fontSize: 28,
            fontWeight: '900',
            color: t.text,
        },
    });
