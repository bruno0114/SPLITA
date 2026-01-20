import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { clearModelCache } from '@/services/ai';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    gemini_api_key: string | null;
    updated_at: string | null;
}

export const useProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Social Login Sync Logic:
            // If the profile is missing name or avatar, but we have them in user_metadata,
            // we update the profile automatically.
            const metadata = user.user_metadata;
            const socialName = metadata?.full_name || metadata?.name;
            const socialAvatar = metadata?.picture || metadata?.avatar_url;

            let needsUpdate = false;
            const updates: any = {};

            if (!data.full_name && socialName) {
                updates.full_name = socialName;
                needsUpdate = true;
            }

            if (!data.avatar_url && socialAvatar) {
                updates.avatar_url = socialAvatar;
                needsUpdate = true;
            }

            if (needsUpdate) {
                const { data: updatedData, error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)
                    .select()
                    .single();

                if (!updateError) {
                    setProfile(updatedData);
                    return;
                }
            }

            setProfile(data);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateProfile = async (updates: Partial<Omit<Profile, 'id'>>) => {
        if (!user) return { error: 'No authenticated user' };

        setSaving(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            // If the API key was updated, clear the model cache
            if (updates.gemini_api_key !== undefined) {
                clearModelCache();
            }

            setProfile(data);
            return { data, error: null };
        } catch (err: any) {
            setError(err.message);
            return { data: null, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile,
        loading,
        error,
        saving,
        updateProfile,
        refreshProfile: fetchProfile
    };
};
