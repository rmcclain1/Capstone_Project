export function isLocalFileUri(uri?: string) {
    if (!uri) return false;
    // RN/Expo local files usually start with file://, content:// (Android)
    return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

export function guessContentType(filenameOrUri: string) {
    const lower = filenameOrUri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.heic')) return 'image/heic';
    return 'application/octet-stream';
}

export function extractFilename(uri: string) {
    try {
        const fromQuery = uri.split('?')[0];
        const name = fromQuery.split('/').pop() || 'avatar';
        return name.includes('.') ? name : `${name}.jpg`;
    } catch {
        return 'avatar.jpg';
    }
}

/** Convert your profile payload into FormData when there's a local file. */
export function buildProfileFormData(payload: {
    username?: string;
    email?: string;
    phone?: string;
    birthday?: string;
    location?: string;
    avatarUri?: string; // local or remote
    allergies?: Record<string, boolean>;
    otherAllergy?: string;
}, allergyArray: string[]) {
    const fd = new FormData();

    // text fields
    if (payload.username != null) fd.append('user[username]', String(payload.username));
    if (payload.email != null) fd.append('user[email]', String(payload.email));
    if (payload.phone != null) fd.append('user[phone_number]', String(payload.phone));
    if (payload.birthday != null) fd.append('user[birthday]', String(payload.birthday));
    if (payload.location != null) fd.append('user[location]', String(payload.location));

    // allergies[] (Rails strong params: allergies: [])
    allergyArray.forEach(a => fd.append('user[allergies][]', a));

    // avatar (file) — only if local file URI
    if (payload.avatarUri && isLocalFileUri(payload.avatarUri)) {
        const name = extractFilename(payload.avatarUri);
        const type = guessContentType(name);

        // @ts-ignore RN FormData file object
        fd.append('user[avatar]', { uri: payload.avatarUri, name, type });
    }

    return fd;
}
