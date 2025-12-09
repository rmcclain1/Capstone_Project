// app/context/organization_context.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth_context';
import { getOrganizations, type Organization } from '@/api/organizations'; 

interface OrganizationContextType {
    organizations: Organization[];
    currentOrganization: Organization | null;
    loading: boolean;
    selectOrganization: (org: Organization | null) => void;
    refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
    organizations: [],
    currentOrganization: null,
    loading: true,
    selectOrganization: () => { },
    refreshOrganizations: async () => { },
});

export function useOrganization() {
    return useContext(OrganizationContext);
}

interface Props {
    children: ReactNode;
}

export function OrganizationProvider({ children }: Props) {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadOrganizations();
        } else {
            setOrganizations([]);
            setCurrentOrganization(null);
            setLoading(false);
        }
    }, [user]);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const orgs = await getOrganizations();
            setOrganizations(orgs);

            // Auto-select first organization if none selected
            if (orgs.length > 0 && !currentOrganization) {
                setCurrentOrganization(orgs[0]);
            }
        } catch (error) {
            console.error('Failed to load organizations:', error);
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    };

    const selectOrganization = (org: Organization | null) => {
        setCurrentOrganization(org);
    };

    const refreshOrganizations = async () => {
        await loadOrganizations();
    };

    return (
        <OrganizationContext.Provider
            value={{
                organizations,
                currentOrganization,
                loading,
                selectOrganization,
                refreshOrganizations,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}