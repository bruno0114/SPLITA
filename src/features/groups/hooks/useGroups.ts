import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, User } from '@/types/index';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export const useGroups = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchGroups = useCallback(async () => {
        if (!user) {
            setGroups([]); // Clear groups if no user
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null); // Reset error state
        try {
            // Get group IDs where the user is a member
            const { data: membershipData, error: membershipError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (membershipError) throw membershipError;

            if (!membershipData || membershipData.length === 0) {
                setGroups([]);
                return;
            }

            const groupIds = membershipData.map(m => m.group_id);

            // Fetch actual group data and members
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

            // Transform data to match UI Group interface
            const validGroups: Group[] = (groupsData || []).map((g: any) => ({
                id: g.id,
                name: g.name,
                type: 'other', // Default as we don't have this column yet
                currency: g.currency,
                image: g.image_url,
                inviteCode: g.invite_code,
                createdBy: g.created_by,
                lastActivity: new Date(g.created_at).toLocaleDateString(), // Placeholder
                userBalance: 0, // Pivot calculation to be implemented later
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
            // 1. Create Group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name,
                    created_by: user.id,
                    currency: 'ARS' // Default for now
                })
                .select()
                .single();

            if (groupError) {
                console.error('[useGroups] Create group error:', groupError);
                throw groupError;
            }

            console.log('[useGroups] Group created:', groupData);

            // 2. Add creator as member (admin)
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupData.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) {
                console.error('[useGroups] Add member error:', memberError);
                throw memberError;
            }

            console.log('[useGroups] Creator added as admin');
            // Refresh list - AWAIT to ensure UI updates
            await fetchGroups();
            showToast('Grupo creado con éxito', 'success');
            return { data: groupData, error: null };
        } catch (err: any) {
            console.error('[useGroups] Error:', err);
            showToast(err.message || 'Error al crear el grupo', 'error');
            return { data: null, error: err.message };
        }
    };

    const getGroupByInviteCode = async (code: string) => {
        try {
            const { data, error } = await supabase
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
                .eq('invite_code', code)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    const joinGroup = async (groupId: string) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { error } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupId,
                    user_id: user.id,
                    role: 'member'
                });

            if (error) throw error;

            await fetchGroups();
            return { error: null };
        } catch (err: any) {
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
        if (!user) return { error: 'No authenticated user' };

        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchGroups();
            showToast('Grupo eliminado correctamente', 'success');
            return { error: null };
        } catch (err: any) {
            showToast(err.message || 'Error al eliminar el grupo', 'error');
            return { error: err.message };
        }
    };

    const refreshInviteCode = async (id: string) => {
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        return await updateGroup(id, { invite_code: newCode });
    };

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    return {
        groups,
        loading,
        error,
        createGroup,
        updateGroup,
        deleteGroup,
        refreshInviteCode,
        joinGroup,
        getGroupByInviteCode,
        refreshGroups: fetchGroups
    };
};
