import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface AIChatPrefsData {
    tone: string;
    humor: 'off' | 'soft' | 'high';
    verbosity: 'short' | 'normal' | 'detailed';
    custom_rules: string | null;
    interest_topics: string[];
    learning_opt_in: boolean;
}

export interface AIChatConsentData {
    chat_terms_accepted_at: string | null;
    chat_terms_version: string | null;
}

const DEFAULT_PREFS: AIChatPrefsData = {
    tone: 'porteño',
    humor: 'soft',
    verbosity: 'normal',
    custom_rules: null,
    interest_topics: [],
    learning_opt_in: false
};

export const useAIChatSettings = () => {
    const { user } = useAuth();
    const [prefs, setPrefs] = useState<AIChatPrefsData>(DEFAULT_PREFS);
    const [consent, setConsent] = useState<AIChatConsentData>({ chat_terms_accepted_at: null, chat_terms_version: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) {
            setPrefs(DEFAULT_PREFS);
            setConsent({ chat_terms_accepted_at: null, chat_terms_version: null });
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [{ data: prefsData }, { data: consentData }] = await Promise.all([
                supabase
                    .from('ai_user_prefs')
                    .select('tone, humor, verbosity, custom_rules, interest_topics, learning_opt_in')
                    .eq('user_id', user.id)
                    .maybeSingle(),
                supabase
                    .from('ai_user_consents')
                    .select('chat_terms_accepted_at, chat_terms_version')
                    .eq('user_id', user.id)
                    .maybeSingle()
            ]);

            setPrefs({
                tone: prefsData?.tone || DEFAULT_PREFS.tone,
                humor: prefsData?.humor || DEFAULT_PREFS.humor,
                verbosity: prefsData?.verbosity || DEFAULT_PREFS.verbosity,
                custom_rules: prefsData?.custom_rules || null,
                interest_topics: prefsData?.interest_topics || [],
                learning_opt_in: prefsData?.learning_opt_in ?? DEFAULT_PREFS.learning_opt_in
            });
            setConsent({
                chat_terms_accepted_at: consentData?.chat_terms_accepted_at || null,
                chat_terms_version: consentData?.chat_terms_version || null
            });
        } finally {
            setLoading(false);
        }
    }, [user]);

    const savePrefs = async (updates: AIChatPrefsData) => {
        if (!user) return { error: 'No authenticated user' };
        setSaving(true);
        try {
            const { error } = await supabase
                .from('ai_user_prefs')
                .upsert({
                    user_id: user.id,
                    ...updates,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (!error) {
                setPrefs(updates);
            }
            return { error };
        } finally {
            setSaving(false);
        }
    };

    const acceptTerms = async (version: string) => {
        if (!user) return { error: 'No authenticated user' };
        setSaving(true);
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('ai_user_consents')
                .upsert({
                    user_id: user.id,
                    chat_terms_accepted_at: now,
                    chat_terms_version: version,
                    updated_at: now
                }, { onConflict: 'user_id' });

            if (!error) {
                setConsent({ chat_terms_accepted_at: now, chat_terms_version: version });
            }
            return { error };
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        prefs,
        consent,
        loading,
        saving,
        refresh: fetchSettings,
        savePrefs,
        acceptTerms
    };
};
