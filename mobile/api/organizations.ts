// api/organizations.ts
import http from '@/lib/http';

export interface Organization {
    id: string;
    name: string;
    organization_type: 'restaurant' | 'store' | 'warehouse' | 'cafe' | 'bakery' | 'other';
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    member_limit: number;
    active: boolean;
    settings: {
        require_approval?: boolean;
        allow_bulk_entry?: boolean;
        track_who_added?: boolean;
        notification_preferences?: any;
    };
    total_items?: number;
    expiring_soon_count?: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationMembership {
    id: string;
    user_id: string;
    organization_id: string;
    role: 'owner' | 'manager' | 'member';
    status: 'active' | 'invited' | 'suspended';
    title?: string;
    permissions: {
        can_add_items: boolean;
        can_delete_items: boolean;
        can_edit_items: boolean;
        can_invite_members: boolean;
        can_manage_recalls: boolean;
        can_view_reports: boolean;
        can_manage_organization?: boolean;
    };
    user?: {
        id: string;
        email: string;
        username?: string;
        display_name?: string;
    };
    created_at: string;
}

export interface OrganizationInvitation {
    id: string;
    organization_id: string;
    email: string;
    role: 'owner' | 'manager' | 'member';
    token: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    expires_at: string;
    invited_by?: {
        email: string;
        username?: string;
    };
    organization?: {
        name: string;
        organization_type: string;
    };
    created_at: string;
}

export interface OrganizationActivity {
    id: string;
    organization_id: string;
    user_id?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    metadata: any;
    user?: {
        id: string;
        email: string;
        username?: string;
    };
    created_at: string;
}

export interface BulkCreateResponse {
    success: boolean;
    created: number;
    total: number;
    items: any[];
    errors: Array<{
        index: number;
        item_name?: string;
        errors: string[];
    }>;
}

// Organizations
export async function getOrganizations(): Promise<Organization[]> {
    const { data } = await http.get('/api/v1/organizations');
    return data;
}

export async function getOrganization(id: string): Promise<Organization> {
    const { data } = await http.get(`/api/v1/organizations/${id}`);
    return data;
}

export async function createOrganization(organization: Partial<Organization>): Promise<Organization> {
    const { data } = await http.post('/api/v1/organizations', { organization });
    return data;
}

export async function updateOrganization(id: string, organization: Partial<Organization>): Promise<Organization> {
    const { data } = await http.patch(`/api/v1/organizations/${id}`, { organization });
    return data;
}

export async function deleteOrganization(id: string): Promise<void> {
    await http.delete(`/api/v1/organizations/${id}`);
}

export async function leaveOrganization(id: string): Promise<void> {
    await http.post(`/api/v1/organizations/${id}/leave`);
}

// Members
export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMembership[]> {
    const { data } = await http.get(`/api/v1/organizations/${organizationId}/members`);
    return data;
}

export async function updateMember(
    organizationId: string,
    memberId: string,
    updates: Partial<OrganizationMembership>
): Promise<OrganizationMembership> {
    const { data } = await http.patch(
        `/api/v1/organizations/${organizationId}/members/${memberId}`,
        { member: updates }
    );
    return data;
}

export async function removeMember(organizationId: string, memberId: string): Promise<void> {
    await http.delete(`/api/v1/organizations/${organizationId}/members/${memberId}`);
}

// Invitations
export async function getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    const { data } = await http.get(`/api/v1/organizations/${organizationId}/invitations`);
    return data;
}

export async function createInvitation(
    organizationId: string,
    invitation: { email: string; role: string }
): Promise<OrganizationInvitation> {
    const { data } = await http.post(
        `/api/v1/organizations/${organizationId}/invitations`,
        { invitation }
    );
    return data;
}

export async function acceptInvitation(token: string): Promise<any> {
    const { data } = await http.post(`/api/v1/organization_invitations/${token}/accept`);
    return data;
}

export async function declineInvitation(token: string): Promise<void> {
    await http.post(`/api/v1/organization_invitations/${token}/decline`);
}

// Activities
export async function getOrganizationActivities(organizationId: string): Promise<OrganizationActivity[]> {
    const { data } = await http.get(`/api/v1/organizations/${organizationId}/activities`);
    return data;
}

// Pantry - Bulk Operations
export async function bulkCreatePantryItems(
    organizationId: string,
    items: Array<{
        item_name: string;
        quantity?: number;
        expiration_date?: string;
        manufacturer?: string;
        category?: string;
        location?: string;
        notes?: string;
    }>
): Promise<BulkCreateResponse> {
    const { data } = await http.post('/api/v1/pantries/bulk_create', {
        organization_id: organizationId,
        items,
    });
    return data;
}

// Pantry - Organization Items
export async function getOrganizationPantry(organizationId: string, params?: any) {
    const { data } = await http.get('/api/v1/pantries', {
        params: { organization_id: organizationId, ...params },
    });
    return data;
}

export async function getPantryStats(organizationId: string) {
    const { data } = await http.get('/api/v1/pantries/stats', {
        params: { organization_id: organizationId },
    });
    return data;
}

export async function getExpiringItems(organizationId: string, days: number = 3) {
    const { data } = await http.get('/api/v1/pantries/expiring_soon', {
        params: { organization_id: organizationId, days },
    });
    return data;
}

export async function getExpiredItems(organizationId: string) {
    const { data } = await http.get('/api/v1/pantries/expired', {
        params: { organization_id: organizationId },
    });
    return data;
}