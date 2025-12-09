// app/organization/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme_provider';
import { useOrganization } from '@/app/context/organization_context';
import type { Organization } from '@/api/organizations';

export default function OrganizationsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { organizations, currentOrganization, selectOrganization, refreshOrganizations, loading } = useOrganization();
    const [refreshing, setRefreshing] = useState(false);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshOrganizations();
        setRefreshing(false);
    };

    const handleSelectOrganization = (org: Organization) => {
        selectOrganization(org);
        Alert.alert('Organization Selected', `Switched to ${org.name}`);
        router.back();
    };

    const handleCreateOrganization = () => {
        router.push('/organization/create');
    };

    const handleManageOrganization = (org: Organization) => {
        router.push(`/organization/${org.id}/manage` as any);
    };

    const getOrganizationIcon = (type: string) => {
        switch (type) {
            case 'restaurant': return 'restaurant';
            case 'store': return 'storefront';
            case 'warehouse': return 'cube';
            case 'cafe': return 'cafe';
            case 'bakery': return 'pizza';
            default: return 'business';
        }
    };

    const renderOrganization = ({ item }: { item: Organization }) => {
        const isSelected = currentOrganization?.id === item.id;

        return (
            <Pressable
                style={[styles.orgCard, isSelected && styles.selectedCard]}
                onPress={() => handleSelectOrganization(item)}
                android_ripple={{ color: theme.border }}
            >
                <View style={styles.orgHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons
                            name={getOrganizationIcon(item.organization_type) as any}
                            size={28}
                            color={theme.primary}
                        />
                    </View>

                    <View style={styles.orgInfo}>
                        <View style={styles.orgTitleRow}>
                            <Text style={styles.orgName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {isSelected && (
                                <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="checkmark" size={12} color="white" />
                                    <Text style={styles.selectedText}>Active</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.orgType}>
                            {item.organization_type?.charAt(0).toUpperCase() + item.organization_type?.slice(1) || 'Organization'}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => handleManageOrganization(item)}
                        style={styles.settingsBtn}
                        hitSlop={8}
                    >
                        <Ionicons name="settings-outline" size={22} color={theme.textDim} />
                    </Pressable>
                </View>

                <View style={styles.orgStats}>
                    <View style={styles.stat}>
                        <Ionicons name="cube-outline" size={16} color={theme.textDim} />
                        <Text style={styles.statText}>{item.total_items || 0} items</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="time-outline" size={16} color="#F59E0B" />
                        <Text style={styles.statText}>{item.expiring_soon_count || 0} expiring</Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    if (loading && organizations.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={styles.title}>Organizations</Text>
                <Pressable onPress={handleCreateOrganization} hitSlop={12}>
                    <Ionicons name="add" size={28} color={theme.primary} />
                </Pressable>
            </View>

            {/* Personal Pantry Option */}
            <Pressable
                style={[
                    styles.personalCard,
                    !currentOrganization && styles.selectedCard,
                ]}
                onPress={() => handleSelectOrganization(null as any)}
                android_ripple={{ color: theme.border }}
            >
                <View style={styles.orgHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="person" size={28} color={theme.primary} />
                    </View>

                    <View style={styles.orgInfo}>
                        <View style={styles.orgTitleRow}>
                            <Text style={styles.orgName}>Personal Pantry</Text>
                            {!currentOrganization && (
                                <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="checkmark" size={12} color="white" />
                                    <Text style={styles.selectedText}>Active</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.orgType}>Your personal inventory</Text>
                    </View>
                </View>
            </Pressable>

            {/* Organizations List */}
            {organizations.length > 0 ? (
                <FlatList
                    data={organizations}
                    renderItem={renderOrganization}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.primary}
                            colors={[theme.primary]}
                        />
                    }
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="business-outline" size={64} color={theme.textDim} />
                    <Text style={styles.emptyTitle}>No Organizations Yet</Text>
                    <Text style={styles.emptyText}>
                        Create an organization to collaborate with your team on inventory management.
                    </Text>
                    <Pressable style={styles.createBtn} onPress={handleCreateOrganization}>
                        <Ionicons name="add-circle" size={20} color="white" />
                        <Text style={styles.createBtnText}>Create Organization</Text>
                    </Pressable>
                </View>
            )}
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    title: { fontSize: 20, fontWeight: '800', color: theme.text },
    listContent: { padding: 16, gap: 12 },
    personalCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderWidth: 2,
        borderColor: theme.border,
    },
    orgCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.name === 'light' ? 0.05 : 0.15,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
    },
    selectedCard: {
        borderColor: theme.primary,
        borderWidth: 2,
    },
    orgHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orgInfo: { flex: 1 },
    orgTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orgName: { fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 },
    orgType: { fontSize: 14, color: theme.textDim, marginTop: 2 },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    selectedText: { color: 'white', fontSize: 12, fontWeight: '700' },
    settingsBtn: { padding: 8 },
    orgStats: { flexDirection: 'row', gap: 16 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 14, color: theme.textDim, fontWeight: '600' },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: theme.textDim,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    createBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});