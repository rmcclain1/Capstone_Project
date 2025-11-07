// mobile/api/barcodes.ts
import http from '@/lib/http';

export type ProductDTO = {
    upc: string;
    name: string;
    brand?: string;
    category?: string;
    image_url?: string;
    size?: string;
};

export async function lookupBarcode(upc: string): Promise<ProductDTO | null> {
    const { data } = await http.post('/api/v1/barcodes/lookup', { upc });
    return data?.product ?? null;
}
