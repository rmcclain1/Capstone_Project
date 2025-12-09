// mobile/lib/recalls.ts
import { api } from './api';

export type FoodEvent = {
    id: number;
    event_id?: string | null;
    recall_number?: string | null;
    status?: string | null;
    recalling_firm?: string | null;
    city?: string | null;
    state?: string | null;
    classification?: string | null;
    product_description?: string | null;
    reason_for_recall?: string | null;
    product_type?: string | null;
    report_date?: string | null;
    recall_initiation_date?: string | null;
    center_classification_date?: string | null;
    code_info?: string | null;
};

type IndexResponse = {
    data: FoodEvent[];
    meta?: { page: number; per: number; count: number };
};

export async function fetchFoodEvents(params?: {
    q?: string;
    status?: string;
    classification?: string;
    state?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per?: number;
}): Promise<IndexResponse> {
    console.log('[Recalls API] Fetching with params:', params);

    try {
        const res = await api.get('/api/v1/food_events', { params });
        console.log('[Recalls API] Response status:', res.status);
        console.log('[Recalls API] Data type:', Array.isArray(res.data) ? 'array' : typeof res.data);
        console.log('[Recalls API] Count:', Array.isArray(res.data) ? res.data.length : 'N/A');

        // Backend returns array directly, not { data, meta }
        if (Array.isArray(res.data)) {
            const events = res.data as FoodEvent[];
            console.log('[Recalls API] Returning', events.length, 'events');
            return {
                data: events,
                meta: {
                    page: 1,
                    per: events.length,
                    count: events.length
                }
            };
        }

        // Fallback if backend returns { data, meta } format
        console.log('[Recalls API] Using data.data format');
        return res.data as IndexResponse;
    } catch (error: any) {
        console.error('[Recalls API] Error:', error?.response?.data || error.message);
        throw error;
    }
}

export async function fetchFoodEvent(id: number): Promise<FoodEvent> {
    console.log('[Recalls API] Fetching single event:', id);
    const res = await api.get(`/api/v1/food_events/${id}`);
    return res.data as FoodEvent;
}