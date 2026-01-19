import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, User } from '@/types/index';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useGroups = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchGroups = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            // Fetch groups where the current user is a member
            const { data, error } = await supabase
                .from('groups')
                .select(`
          *,
          group_members!inner (
            user_id
          ),
          members:group_members (
            profiles (
              id,
              full_name,
              avatar_url
            )
          )
        `)
                .eq('group_members.user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match UI Group interface
            const validGroups: Group[] = data.map((g: any) => ({
                id: g.id,
                name: g.name,
                type: 'other', // Default as we don't have this column yet
                currency: g.currency,
                image: undefined, // No image column yet
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
            return { data: groupData, error: null };
        } catch (err: any) {
            console.error('[useGroups] Error:', err);
            return { data: null, error: err.message };
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    return {
        groups,
        loading,
        error,
        createGroup,
        refreshGroups: fetchGroups
    };
};
