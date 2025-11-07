// mobile/api/receipts.ts
import * as FileSystem from 'expo-file-system';
import http from '@/lib/http';

export type ReceiptStatus = 'processing' | 'done' | 'failed';

export type ReceiptUpload = {
    id: string;
    status: ReceiptStatus;
    vendor?: string;
    purchased_at?: string;
    total_cents?: number;
    items: Array<{
        raw: string;
        qty?: number;
        name?: string;
        matched?: { upc?: string; name: string; brand?: string };
        confidence?: number;
    }>;
};

export async function uploadReceipt(uri: string): Promise<ReceiptUpload> {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) throw new Error('File not found: ' + uri);

    const form = new FormData();
    form.append('image', {
        uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
    } as any);

    const { data } = await http.post('/api/v1/receipts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as ReceiptUpload;
}

export async function getReceipt(id: string): Promise<ReceiptUpload> {
    const { data } = await http.get(`/api/v1/receipts/${id}`);
    return data as ReceiptUpload;
}
