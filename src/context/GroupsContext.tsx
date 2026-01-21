import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Group } from '@/types/index';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

interface GroupsContextValue {
    groups: Group[];
    loading: boolean;
    error: string | null;
    createGroup: (name: string, type: string) => Promise<{ data?: any; error: any }>;
    updateGroup: (id: string, updates: Partial<{ name: string; currency: string; image_url: string; invite_code?: string }>) => Promise<{ data?: any; error: any }>;
    deleteGroup: (id: string) => Promise<{ error: any; success: boolean }>;
    leaveGroup: (groupId: string) => Promise<{ error: any; success: boolean }>;
    refreshInviteCode: (id: string) => Promise<{ data?: any; error: any }>;
    joinGroup: (groupId: string) => Promise<{ error?: string }>;
    getGroupByInviteCode: (code: string) => Promise<{ data?: any; error?: string }>;
    refreshGroups: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchGroups = useCallback(async () => {
        if (!user) {
            setGroups([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data: membershipData, error: membershipError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (membershipError) throw membershipError;

            if (!membershipData || membershipData.length === 0) {
                setGroups([]);
                setLoading(false);
                return;
            }

            const groupIds = membershipData.map(m => m.group_id);

            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select(`
          *,
          members:group_members (
            profiles (
              id,
              full_name,
              avatar_url
            )
          )
        `)
                .in('id', groupIds)
                .order('created_at', { ascending: false });

            if (groupsError) throw groupsError;

            const validGroups: Group[] = (groupsData || []).map((g: any) => ({
                id: g.id,
                name: g.name,
                type: 'other',
                currency: g.currency,
                image: g.image_url,
                inviteCode: g.invite_code,
                createdBy: g.created_by,
                lastActivity: new Date(g.created_at).toLocaleDateString(),
                userBalance: 0,
                members: g.members.map((m: any) => ({
                    id: m.profiles.id,
                    name: m.profiles.full_name || 'Sin nombre',
                    avatar: m.profiles.avatar_url,
                    email: ''
                }))
            }));

            setGroups(validGroups);
        } catch (err: any) {
            console.error('Error fetching groups:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createGroup = async (name: string, type: string) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name,
                    created_by: user.id,
                    currency: 'ARS'
                })
                .select()
                .single();

            if (groupError) throw groupError;

            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupData.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) throw memberError;

            await fetchGroups();
            showToast('Grupo creado con éxito', 'success');
            return { data: groupData, error: null };
        } catch (err: any) {
            showToast(err.message || 'Error al crear el grupo', 'error');
            return { data: null, error: err.message };
        }
    };

    const getGroupByInviteCode = async (code: string) => {
        try {
            // Use Secure RPC (Security Definer)
            const { data, error } = await supabase
                .rpc('get_group_details_by_code', { p_code: code })
                .single();

            if (error) throw error;

            const groupData = data as { id: string; name: string; image_url: string; member_count: number };

            // Transform RPC result to match expected shape for UI preview
            // Note: RPC returns { id, name, image_url, member_count }
            const transformedData = {
                id: data.id,
                name: data.name,
                image_url: data.image_url,
                invite_code: code, // Pass back the code so UI has it
                members: Array(data.member_count).fill({ profiles: { id: 'preview', avatar_url: '' } }) // Dummy members for valid length
            };

            return { data: transformedData, error: null };
        } catch (err: any) {
            console.error('[GroupsContext] getGroupByInviteCode error:', err);
            return { data: null, error: err.message };
        }
    };

    const joinGroup = async (inviteCode: string) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            // Use Secure RPC
            const { error } = await supabase
                .rpc('join_group_by_code', { p_code: inviteCode });

            if (error) throw error;

            await fetchGroups(); // Refresh data immediately
            return { error: undefined };
        } catch (err: any) {
            console.error('[GroupsContext] joinGroup error:', err);
            return { error: err.message };
        }
    };

    const updateGroup = async (id: string, updates: Partial<{ name: string; currency: string; image_url: string; invite_code?: string }>) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { data, error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await fetchGroups();
            showToast('Grupo actualizado', 'success');
            return { data, error: null };
        } catch (err: any) {
            showToast(err.message || 'Error al actualizar el grupo', 'error');
            return { data: null, error: err.message };
        }
    };

    const deleteGroup = async (id: string) => {
        if (!user) return { error: 'No authenticated user', success: false };

        // Optimistically remove from local state FIRST
        const previousGroups = [...groups];
        setGroups(prev => prev.filter(g => g.id !== id));

        try {
            // We use 'count: exact' to see if rows were actually affected
            const { error, count } = await supabase
                .from('groups')
                .delete({ count: 'exact' })
                .eq('id', id);

            if (error) throw error;

            if (count === 0) {
                // This happens if RLS policy fails (non-owner) or group doesn't exist
                throw new Error('No tenés permisos para eliminar este grupo o no existe.');
            }

            showToast('Grupo eliminado correctamente', 'success');
            return { error: null, success: true };
        } catch (err: any) {
            console.error('[GroupsContext] Delete error:', err);
            // Rollback optimistic update
            setGroups(previousGroups);
            showToast(err.message || 'Error al eliminar el grupo', 'error');
            return { error: err.message, success: false };
        }
    };

    const leaveGroup = async (groupId: string) => {
        if (!user) return { error: 'No authenticated user', success: false };

        // Optimistically remove
        const previousGroups = [...groups];
        setGroups(prev => prev.filter(g => g.id !== groupId));

        try {
            const { error, count } = await supabase
                .from('group_members')
                .delete({ count: 'exact' })
                .eq('group_id', groupId)
                .eq('user_id', user.id);

            if (error) throw error;

            if (count === 0) {
                throw new Error('No sos miembro de este grupo o ya saliste.');
            }

            showToast('Saliste del grupo correctamente', 'success');
            return { error: null, success: true };
        } catch (err: any) {
            setGroups(previousGroups);
            showToast(err.message || 'Error al salir del grupo', 'error');
            return { error: err.message, success: false };
        }
    };

    const refreshInviteCode = async (id: string) => {
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        return await updateGroup(id, { invite_code: newCode });
    };

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    return (
        <GroupsContext.Provider value={{
            groups,
            loading,
            error,
            createGroup,
            updateGroup,
            deleteGroup,
            leaveGroup,
            refreshInviteCode,
            joinGroup,
            getGroupByInviteCode,
            refreshGroups: fetchGroups
        }}>
            {children}
        </GroupsContext.Provider>
    );
};

export const useGroups = (): GroupsContextValue => {
    const context = useContext(GroupsContext);
    if (!context) {
        throw new Error('useGroups must be used within a GroupsProvider');
    }
    return context;
};
