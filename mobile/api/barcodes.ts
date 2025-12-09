// mobile/api/barcodes.ts
import http from '@/lib/http';

export type ProductDTO = {
    upc: string;
    name: string;
    brand?: string;
    category?: string;
    image_url?: string;
    size?: string;
    ingredients?: string;
    nutrition?: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        serving_size?: string;
    };
};

export type LookupBarcodeOptions = {
    /** Timeout for lookup request in milliseconds (default: 10000) */
    timeout?: number;
    /** Whether to retry on failure (default: true) */
    retry?: boolean;
    /** Number of retry attempts (default: 2) */
    maxRetries?: number;
};

/**
 * Look up product information by UPC/barcode
 * @param upc Universal Product Code (8, 12, or 13 digits)
 * @param options Lookup configuration options
 * @returns Product information or null if not found
 * @throws Error if UPC is invalid or request fails
 */
export async function lookupBarcode(
    upc: string,
    options: LookupBarcodeOptions = {}
): Promise<ProductDTO | null> {
    const { timeout = 10000, retry = true, maxRetries = 2 } = options;

    // Validate UPC format
    const cleanUpc = upc.replace(/\D/g, '');
    if (!isValidUPC(cleanUpc)) {
        throw new Error('Invalid UPC format. Must be 8, 12, or 13 digits.');
    }

    let lastError: any;
    const attempts = retry ? maxRetries + 1 : 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            // NOTE: Your controller expects GET with query params, not POST with body
            const { data } = await http.get('/api/v1/barcodes/lookup', {
                params: { upc: cleanUpc },
                timeout,
            });

            return data?.product ?? null;
        } catch (error: any) {
            lastError = error;

            // Don't retry on certain errors
            if (error.response?.status === 404) {
                // Product not found - don't retry
                return null;
            }

            if (error.response?.status === 422) {
                // Invalid UPC - don't retry
                throw new Error(error.response.data?.error || 'Invalid UPC');
            }

            // Retry on network errors or 5xx errors
            if (attempt < attempts - 1) {
                await sleep(500 * (attempt + 1)); // Exponential backoff
                continue;
            }
        }
    }

    // All retries failed
    throw new Error(
        lastError?.response?.data?.error ||
        lastError?.message ||
        'Failed to lookup barcode'
    );
}

/**
 * Batch lookup multiple barcodes
 * @param upcs Array of UPC codes to lookup
 * @param options Lookup configuration options
 * @returns Map of UPC to product data (null if not found)
 */
export async function lookupBarcodes(
    upcs: string[],
    options: LookupBarcodeOptions = {}
): Promise<Map<string, ProductDTO | null>> {
    const results = new Map<string, ProductDTO | null>();

    // Lookup in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < upcs.length; i += concurrency) {
        const batch = upcs.slice(i, i + concurrency);
        const promises = batch.map(async (upc) => {
            try {
                const product = await lookupBarcode(upc, options);
                return { upc, product };
            } catch (error) {
                console.warn(`Failed to lookup ${upc}:`, error);
                return { upc, product: null };
            }
        });

        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ upc, product }) => {
            results.set(upc, product);
        });
    }

    return results;
}

/**
 * Search for products by name or keyword
 * Note: This would require a new backend endpoint
 * @param query Search query string
 * @returns Array of matching products
 */
export async function searchProducts(query: string): Promise<ProductDTO[]> {
    if (!query.trim()) {
        return [];
    }

    try {
        const { data } = await http.get('/api/v1/barcodes/search', {
            params: { q: query },
            timeout: 10000,
        });
        return data?.products ?? [];
    } catch (error: any) {
        if (error.response?.status === 404) {
            // Endpoint not implemented yet
            throw new Error('Search not implemented yet');
        }
        throw error;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate UPC format
 * @param upc UPC string (should be numeric only)
 * @returns true if valid UPC-A (12 digits), UPC-E (8 digits), or EAN-13 (13 digits)
 */
export function isValidUPC(upc: string): boolean {
    const cleaned = upc.replace(/\D/g, '');
    const length = cleaned.length;

    // Valid UPC formats: UPC-E (8), UPC-A (12), EAN-13 (13)
    if (![8, 12, 13].includes(length)) {
        return false;
    }

    // All digits
    if (!/^\d+$/.test(cleaned)) {
        return false;
    }

    // Optional: Validate check digit
    // For now, just check length and numeric
    return true;
}

/**
 * Validate UPC check digit using the standard algorithm
 * @param upc UPC string (numeric only)
 * @returns true if check digit is valid
 */
export function validateCheckDigit(upc: string): boolean {
    const cleaned = upc.replace(/\D/g, '');
    if (![8, 12, 13].includes(cleaned.length)) {
        return false;
    }

    const digits = cleaned.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        // Alternate between 3x and 1x multiplier (from right to left)
        const multiplier = (digits.length - i) % 2 === 0 ? 1 : 3;
        sum += digits[i] * multiplier;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
}

/**
 * Format UPC for display (adds dashes)
 * @param upc Raw UPC string
 * @returns Formatted UPC string
 */
export function formatUPC(upc: string): string {
    const cleaned = upc.replace(/\D/g, '');

    switch (cleaned.length) {
        case 12:
            // UPC-A: 0-12345-67890-1
            return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 6)}-${cleaned.slice(6, 11)}-${cleaned.slice(11)}`;
        case 13:
            // EAN-13: 123-4567890123
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        case 8:
            // UPC-E: 0123-4567
            return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
        default:
            return cleaned;
    }
}

/**
 * Extract UPC from various barcode formats
 * @param raw Raw barcode data (may include prefixes/suffixes)
 * @returns Cleaned UPC string
 */
export function extractUPC(raw: string): string {
    // Remove common prefixes/suffixes
    let cleaned = raw.replace(/^0+/, ''); // Remove leading zeros
    cleaned = cleaned.replace(/\D/g, ''); // Remove non-digits

    // Pad to standard length if needed
    if (cleaned.length === 11) {
        cleaned = '0' + cleaned; // UPC-A with missing leading zero
    }

    return cleaned;
}

/**
 * Check if a barcode string looks like a valid UPC
 * More lenient than isValidUPC - for initial validation
 * @param barcode Raw barcode string
 * @returns true if it might be a UPC
 */
export function looksLikeUPC(barcode: string): boolean {
    const cleaned = barcode.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 14;
}

/**
 * Get barcode type from UPC length
 * @param upc UPC string
 * @returns Barcode type name
 */
export function getBarcodeType(upc: string): string {
    const length = upc.replace(/\D/g, '').length;

    switch (length) {
        case 8:
            return 'UPC-E';
        case 12:
            return 'UPC-A';
        case 13:
            return 'EAN-13';
        default:
            return 'Unknown';
    }
}

/**
 * Format product name for display
 * @param product Product data
 * @returns Formatted name with brand
 */
export function formatProductName(product: ProductDTO): string {
    if (product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase())) {
        return `${product.brand} ${product.name}`;
    }
    return product.name;
}

/**
 * Get product image URL with fallback
 * @param product Product data
 * @param fallbackUrl Optional fallback image URL
 * @returns Image URL or fallback
 */
export function getProductImageUrl(
    product: ProductDTO,
    fallbackUrl?: string
): string | undefined {
    return product.image_url || fallbackUrl;
}

/**
 * Check if product has complete information
 * @param product Product data
 * @returns true if product has name, brand, and image
 */
export function isCompleteProduct(product: ProductDTO): boolean {
    return !!(product.name && product.brand && product.image_url);
}

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cache for recently looked up products
 * Helps avoid duplicate API calls
 */
class BarcodeCache {
    private cache = new Map<string, { product: ProductDTO | null; timestamp: number }>();
    private readonly ttl = 5 * 60 * 1000; // 5 minutes

    get(upc: string): ProductDTO | null | undefined {
        const entry = this.cache.get(upc);
        if (!entry) return undefined;

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(upc);
            return undefined;
        }

        return entry.product;
    }

    set(upc: string, product: ProductDTO | null): void {
        this.cache.set(upc, {
            product,
            timestamp: Date.now(),
        });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Export singleton cache instance
export const barcodeCache = new BarcodeCache();

/**
 * Cached barcode lookup - checks cache first
 * @param upc Universal Product Code
 * @param options Lookup options
 * @returns Product data or null
 */
export async function lookupBarcodeWithCache(
    upc: string,
    options: LookupBarcodeOptions = {}
): Promise<ProductDTO | null> {
    const cleanUpc = upc.replace(/\D/g, '');

    // Check cache first
    const cached = barcodeCache.get(cleanUpc);
    if (cached !== undefined) {
        return cached;
    }

    // Lookup and cache
    const product = await lookupBarcode(cleanUpc, options);
    barcodeCache.set(cleanUpc, product);

    return product;
}