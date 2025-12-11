// mobile/components/keyboard-aware-scroll.tsx
import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, Platform, StyleSheet, ViewStyle } from 'react-native';

type Props = {
    children: ReactNode;
    contentContainerStyle?: ViewStyle;
    showsVerticalScrollIndicator?: boolean;
};

export default function KeyboardAwareScrollView({
    children,
    contentContainerStyle,
    showsVerticalScrollIndicator = false
}: Props) {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <ScrollView
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});
