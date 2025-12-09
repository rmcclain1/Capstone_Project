// mobile/api/receipts.ts
import * as FileSystem from 'expo-file-system';
import http from '@/lib/http';

export type ReceiptStatus = 'processing' | 'done' | 'failed';

export type ReceiptItem = {
    raw: string;
    qty?: number;
    name?: string;
    matched?: {
        upc?: string;
        name: string;
        brand?: string;
        category?: string;
        image_url?: string;
    };
    confidence?: number;
};

export type ReceiptUpload = {
    id: string;
    status: ReceiptStatus;
    vendor?: string;
    purchased_at?: string;
    total_cents?: number;
    items: ReceiptItem[];
    created_at?: string;
    updated_at?: string;
};

export type UploadReceiptOptions = {
    /** Maximum file size in bytes (default: 10MB) */
    maxFileSizeBytes?: number;
    /** Timeout for upload in milliseconds (default: 30000) */
    timeout?: number;
};

export type PollReceiptOptions = {
    /** Maximum number of polling attempts (default: 20) */
    maxAttempts?: number;
    /** Delay between polling attempts in milliseconds (default: 2000) */
    pollInterval?: number;
    /** Callback for status updates */
    onStatusUpdate?: (status: ReceiptStatus, attempt: number) => void;
};

/**
 * Upload a receipt image for processing
 * @param uri Local file URI of the image
 * @param options Upload configuration options
 * @returns Receipt upload object with initial status
 * @throws Error if file doesn't exist, is too large, or upload fails
 */
export async function uploadReceipt(
    uri: string,
    options: UploadReceiptOptions = {}
): Promise<ReceiptUpload> {
    const {
        maxFileSizeBytes = 10 * 1024 * 1024, // 10MB default
        timeout = 30000
    } = options;

    // Validate file exists
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
        throw new Error('File not found: ' + uri);
    }

    // Check file size
    if (info.size && info.size > maxFileSizeBytes) {
        const sizeMB = (info.size / (1024 * 1024)).toFixed(2);
        const maxMB = (maxFileSizeBytes / (1024 * 1024)).toFixed(2);
        throw new Error(`File too large: ${sizeMB}MB (max: ${maxMB}MB)`);
    }

    // Determine MIME type from URI
    const mimeType = getMimeType(uri);

    const form = new FormData();
    form.append('image', {
        uri,
        name: getFileName(uri),
        type: mimeType,
    } as any);

    try {
        const { data } = await http.post('/api/v1/receipts', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout,
        });
        return data as ReceiptUpload;
    } catch (error: any) {
        // Enhanced error handling
        if (error.response?.status === 413) {
            throw new Error('File too large for server');
        }
        if (error.response?.status === 422) {
            throw new Error(error.response.data?.error || 'Invalid file format');
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Upload timeout - please try again');
        }
        throw error;
    }
}

/**
 * Get the current status and data of a receipt upload
 * @param id Receipt upload ID
 * @returns Receipt upload object with current status and items
 */
export async function getReceipt(id: string): Promise<ReceiptUpload> {
    const { data } = await http.get(`/api/v1/receipts/${id}`);
    return data as ReceiptUpload;
}

/**
 * Poll receipt status until processing is complete or fails
 * @param id Receipt upload ID
 * @param options Polling configuration options
 * @returns Final receipt upload object
 * @throws Error if polling times out or receipt processing fails
 */
export async function pollReceiptStatus(
    id: string,
    options: PollReceiptOptions = {}
): Promise<ReceiptUpload> {
    const {
        maxAttempts = 20,
        pollInterval = 2000,
        onStatusUpdate
    } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const receipt = await getReceipt(id);

        // Notify callback if provided
        onStatusUpdate?.(receipt.status, attempt);

        if (receipt.status === 'done') {
            return receipt;
        }

        if (receipt.status === 'failed') {
            throw new Error('Receipt processing failed');
        }

        // Still processing, wait before next poll
        if (attempt < maxAttempts) {
            await sleep(pollInterval);
        }
    }

    throw new Error(`Receipt processing timeout after ${maxAttempts} attempts`);
}

/**
 * Upload a receipt and wait for processing to complete
 * @param uri Local file URI of the image
 * @param uploadOptions Upload configuration options
 * @param pollOptions Polling configuration options
 * @returns Completed receipt with parsed items
 */
export async function uploadAndProcessReceipt(
    uri: string,
    uploadOptions?: UploadReceiptOptions,
    pollOptions?: PollReceiptOptions
): Promise<ReceiptUpload> {
    const upload = await uploadReceipt(uri, uploadOptions);

    // If already done, return immediately
    if (upload.status === 'done') {
        return upload;
    }

    // If failed immediately, throw
    if (upload.status === 'failed') {
        throw new Error('Receipt upload failed');
    }

    // Otherwise, poll until complete
    return await pollReceiptStatus(upload.id, pollOptions);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get MIME type from file URI
 */
function getMimeType(uri: string): string {
    const extension = uri.toLowerCase().split('.').pop();

    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'pdf':
            return 'application/pdf';
        case 'heic':
            return 'image/heic';
        default:
            return 'image/jpeg'; // Default fallback
    }
}

/**
 * Extract filename from URI
 */
function getFileName(uri: string): string {
    const parts = uri.split('/');
    const filename = parts[parts.length - 1];

    // If no extension, add .jpg
    if (!filename.includes('.')) {
        return 'receipt.jpg';
    }

    return filename;
}

/**
 * Format receipt total for display
 */
export function formatReceiptTotal(totalCents?: number): string {
    if (totalCents === undefined || totalCents === null) {
        return 'N/A';
    }
    return `$${(totalCents / 100).toFixed(2)}`;
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: ReceiptStatus): string {
    switch (status) {
        case 'processing':
            return 'Processing receipt...';
        case 'done':
            return 'Complete';
        case 'failed':
            return 'Processing failed';
        default:
            return 'Unknown status';
    }
}

/**
 * Check if receipt has items
 */
export function hasItems(receipt: ReceiptUpload): boolean {
    return receipt.items && receipt.items.length > 0;
}

/**
 * Get total item count from receipt
 */
export function getTotalItemCount(receipt: ReceiptUpload): number {
    return receipt.items.reduce((sum, item) => sum + (item.qty || 1), 0);
}

/**
 * Filter items by minimum confidence score
 */
export function filterByConfidence(
    items: ReceiptItem[],
    minConfidence: number = 50
): ReceiptItem[] {
    return items.filter(item =>
        !item.confidence || item.confidence >= minConfidence
    );
}

/**
 * Group items by category (if available)
 */
export function groupByCategory(items: ReceiptItem[]): Record<string, ReceiptItem[]> {
    return items.reduce((groups, item) => {
        const category = item.matched?.category || 'Uncategorized';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {} as Record<string, ReceiptItem[]>);
}