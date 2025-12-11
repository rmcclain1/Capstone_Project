// mobile/app/(tabs)/ai.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme_provider';
import { chatWithAI, type AIMessage, type Role } from '@/lib/ai';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/app/context/auth_context';

function makeMsg(role: Role, content: string): AIMessage {
    return { role, content };
}

export default function AIScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const tabBarHeight = useBottomTabBarHeight();

    const [messages, setMessages] = useState<AIMessage[]>([
        makeMsg(
            'assistant',
            'Hi! I can answer questions about FDA recalls, help you check if items in your pantry are affected, and suggest safe alternatives.'
        ),
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const listRef = useRef<FlatList<AIMessage>>(null);

    // Auto-scroll when messages change
    useEffect(() => {
        const timer = setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        console.log('[AI] Sending message:', text);
        setInput('');
        const userMsg = makeMsg('user', text);
        const next = [...messages, userMsg];
        setMessages(next);
        setLoading(true);

        try {
            console.log('[AI] Calling AI API...');
            const reply = await chatWithAI(next);
            console.log('[AI] Got reply:', reply.content.substring(0, 50) + '...');
            setMessages([...next, reply]);
        } catch (error: any) {
            console.error('[AI] Error:', error?.response?.data || error.message);
            const errorMsg = makeMsg(
                'assistant',
                'Sorry, I had trouble reaching the AI. Please try again.'
            );
            setMessages([...next, errorMsg]);
        } finally {
            setLoading(false);
        }
    }, [input, messages, loading]);

    const inputBarHeight = 72;
    const bottomPadding = tabBarHeight + inputBarHeight + 8;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>AI Assistant</Text>
                {user && (
                    <Text style={[styles.headerSubtitle, { color: theme.textDim }]}>
                        Hello, {user.first_name || user.email?.split('@')[0] || 'there'}!
                    </Text>
                )}
            </View>

            {/* Messages */}
            <FlatList
                ref={listRef}
                style={styles.messageList}
                data={messages}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageBubble,
                            {
                                alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: item.role === 'user' ? theme.primary : theme.card,
                            },
                        ]}
                    >
                        <Text style={{ color: item.role === 'user' ? '#fff' : theme.text }}>
                            {item.content}
                        </Text>
                    </View>
                )}
                ListFooterComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={theme.primary} />
                            <Text style={[styles.loadingText, { color: theme.textDim }]}>
                                Thinking...
                            </Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={{
                    paddingBottom: bottomPadding,
                    paddingTop: 8,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />

            {/* Input bar - wrapped with KeyboardAvoidingView for smooth keyboard handling */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : 'height'}
                keyboardVerticalOffset={0}
                style={styles.keyboardView}
            >
                <View
                    style={[
                        styles.inputBar,
                        {
                            bottom: tabBarHeight,
                            backgroundColor: theme.bg,
                            borderTopColor: theme.border,
                        },
                    ]}
                >
                    <View style={styles.inputRow}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Ask about recalls, pantry safety, recipes..."
                            placeholderTextColor={theme.textDim}
                            onSubmitEditing={send}
                            returnKeyType="send"
                            multiline
                            maxLength={500}
                            editable={!loading}
                            style={[
                                styles.input,
                                {
                                    borderColor: theme.border,
                                    color: theme.text,
                                    backgroundColor: theme.card,
                                },
                            ]}
                        />
                        <Pressable
                            onPress={send}
                            disabled={loading || !input.trim()}
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: theme.primary,
                                    opacity: loading || !input.trim() ? 0.5 : 1,
                                },
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color="#fff" />
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messageBubble: {
        borderRadius: 16,
        padding: 12,
        marginVertical: 4,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
    },
    keyboardView: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    inputBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 10,
        borderTopWidth: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
