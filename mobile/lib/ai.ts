// mobile/lib/ai.ts
import { authedFetch } from '@/api/session';
import { apiUrl } from '@/lib/env';

export type Role = 'system' | 'user' | 'assistant';
export type AIMessage = { role: Role; content: string };

export async function chatWithAI(history: AIMessage[], userId?: string | number): Promise<AIMessage> {
    const res = await authedFetch(apiUrl('/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`AI HTTP ${res.status}: ${data?.error || ''}`);
    return { role: 'assistant', content: data.reply ?? '' };
}
