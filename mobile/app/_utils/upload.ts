// mobile/app/_utils/upload.ts 
export function isLocalFileUri(uri?: string) {
    if (!uri) return false;
    return uri.startsWith('file://') || uri.startsWith('content://');
}

export function filenameFromUri(uri: string) {
    try {
        const q = uri.split('?')[0];
        return q.split('/').pop() || 'upload';
    } catch {
        return 'upload';
    }
}
