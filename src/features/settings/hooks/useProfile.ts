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
                .select('id, full_name, avatar_url, email, updated_at')
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

            const { data: secretsData, error: secretsError } = await supabase
                .from('user_secrets')
                .select('gemini_api_key')
                .eq('user_id', user.id)
                .maybeSingle();

            if (secretsError) {
                console.warn('[useProfile] Failed to fetch user secrets:', secretsError);
            }

            setProfile({
                ...data,
                gemini_api_key: secretsData?.gemini_api_key || null
            });
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
            const profileUpdates: Record<string, unknown> = {};
            if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
            if (updates.email !== undefined) profileUpdates.email = updates.email;
            if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

            let profileData: Profile | null = profile;

            if (Object.keys(profileUpdates).length > 0) {
                const { data, error } = await supabase
                    .from('profiles')
                    .update({
                        ...profileUpdates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)
                    .select('id, full_name, avatar_url, email, updated_at')
                    .single();

                if (error) throw error;
                profileData = {
                    ...data,
                    gemini_api_key: profile?.gemini_api_key ?? null
                };
            }

            if (updates.gemini_api_key !== undefined) {
                const { error: secretsError } = await supabase
                    .from('user_secrets')
                    .upsert({
                        user_id: user.id,
                        gemini_api_key: updates.gemini_api_key,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });

                if (secretsError) throw secretsError;
                clearModelCache();
            }

            const mergedProfile: Profile = {
                id: profileData?.id || user.id,
                full_name: profileData?.full_name ?? profile?.full_name ?? null,
                avatar_url: profileData?.avatar_url ?? profile?.avatar_url ?? null,
                email: profileData?.email ?? profile?.email ?? null,
                updated_at: profileData?.updated_at ?? profile?.updated_at ?? null,
                gemini_api_key: updates.gemini_api_key !== undefined
                    ? updates.gemini_api_key
                    : (profileData?.gemini_api_key ?? profile?.gemini_api_key ?? null)
            };

            setProfile(mergedProfile);

            return { data: profileData, error: null };
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
