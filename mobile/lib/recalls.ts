// tiny client for the recalls endpoints
import { api } from './api';

export type FoodEvent = {
    id: number;
    event_id: string | null;
    recall_number: string | null;
    status: string | null;
    recalling_firm: string | null;
    city: string | null;
    state: string | null;
    classification: string | null;
    product_description: string | null;
    reason_for_recall: string | null;
    product_type: string | null;
    report_date: string | null; // ISO date like "2025-10-12"
    recall_initiation_date: string | null;
    center_classification_date: string | null;
    code_info: string | null;
};

type IndexResponse = {
    data: FoodEvent[];
    meta: { page: number; per: number; count: number };
};

// server supports q/status/classification/state/date_from/date_to/page/per
export async function fetchFoodEvents(params?: {
    q?: string;
    status?: string;
    classification?: string;
    state?: string;
    date_from?: string; // YYYY-MM-DD
    date_to?: string;   // YYYY-MM-DD
    page?: number;
    per?: number;
}): Promise<IndexResponse> {
    const res = await api.get('/api/v1/food_events', { params });
    return res.data as IndexResponse;
}

export async function fetchFoodEvent(id: number): Promise<FoodEvent> {
    const res = await api.get(`/api/v1/food_events/${id}`);
    return res.data as FoodEvent;
}
