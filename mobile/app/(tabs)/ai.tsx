// mobile/app/(tabs)/ai.tsx
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';
import { chatWithAI, type AIMessage, type Role } from '@/lib/ai';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

function makeMsg(role: Role, content: string): AIMessage {
    return { role, content };
}

export default function AIScreen() {
    const { theme } = useTheme();
    const tabBarHeight = useBottomTabBarHeight(); // height of absolute tab bar

    const [messages, setMessages] = useState<AIMessage[]>([
        makeMsg(
            'assistant',
            'Hi! I can answer questions about FDA recalls, help you check if items in your pantry are affected, and suggest safe alternatives.'
        ),
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const listRef = useRef<FlatList<AIMessage>>(null);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        const next = [...messages, makeMsg('user', text)];
        setMessages(next);
        setLoading(true);

        try {
            const reply = await chatWithAI(next);
            setMessages([...next, reply]);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
        } catch {
            setMessages([...next, makeMsg('assistant', 'Sorry, I had trouble reaching the AI. Please try again.')]);
        } finally {
            setLoading(false);
        }
    }, [input, messages, loading]);

    // Extra space to keep the input and last message visible above the absolute tab bar
    const inputBarHeight = 64; // approx height of the input row
    const bottomReserve = Math.max(tabBarHeight, 0) + inputBarHeight + 12;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            <FlatList
                ref={listRef}
                style={{ flex: 1, paddingHorizontal: 16 }}
                data={messages}
                keyExtractor={(_, i) => String(i)}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                    <View
                        style={{
                            alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: item.role === 'user' ? theme.tint : theme.card,
                            borderRadius: 14,
                            padding: 12,
                            marginVertical: 6,
                            maxWidth: '85%',
                        }}
                    >
                        <Text style={{ color: item.role === 'user' ? '#fff' : theme.text }}>
                            {item.content}
                        </Text>
                    </View>
                )}
                ListFooterComponent={
                    loading ? (
                        <View style={{ padding: 8 }}>
                            <ActivityIndicator />
                        </View>
                    ) : null
                }
                contentContainerStyle={{
                    paddingBottom: bottomReserve, // <-- space for input + tab bar
                }}
            />

            {/* Input bar anchored above the absolute tab bar */}
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })}>
                <View
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: Math.max(tabBarHeight, 0),
                        backgroundColor: theme.bg,
                        paddingHorizontal: 12,
                        paddingTop: 8,
                        paddingBottom: 10,
                        borderTopWidth: 1,
                        borderTopColor: theme.border,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Ask about recalls, pantry safety, recipes..."
                            placeholderTextColor={theme.muted}
                            onSubmitEditing={send}
                            style={{
                                flex: 1,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                                color: theme.text,
                                backgroundColor: theme.card,
                            }}
                        />
                        <Pressable
                            onPress={send}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: theme.tint,
                            }}
                        >
                            <Ionicons name="send" size={18} color="#fff" />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
