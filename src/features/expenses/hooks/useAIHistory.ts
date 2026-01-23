
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useAIHistory = () => {
    const { user } = useAuth();

    const uploadReceipt = useCallback(async (file: File) => {
        if (!user) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(fileName, file);

        if (error) {
            console.error('Error uploading receipt:', error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

        return publicUrl;
    }, [user]);

    const saveSession = useCallback(async (imageUrls: string[], rawData: any) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_import_sessions')
            .insert({
                user_id: user.id,
                image_urls: imageUrls,
                raw_data: rawData
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving AI session:', error);
            return null;
        }

        return data;
    }, [user]);

    const getSessions = useCallback(async () => {
        if (!user) return [];

        const { data, error } = await supabase
            .from('ai_import_sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching AI history:', error);
            return [];
        }

        return data;
    }, [user]);

    const getSessionById = useCallback(async (sessionId: string) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_import_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error) {
            console.error('Error fetching AI session:', error);
            return null;
        }

        return data;
    }, [user]);

    const incrementReimportCount = useCallback(async (sessionId: string) => {
        if (!user) return null;

        const { data: current, error: currentError } = await supabase
            .from('ai_import_sessions')
            .select('reimport_count')
            .eq('id', sessionId)
            .single();

        if (currentError) {
            console.error('Error fetching reimport count:', currentError);
            return null;
        }

        const nextCount = (current?.reimport_count || 0) + 1;

        const { data, error } = await supabase
            .from('ai_import_sessions')
            .update({ reimport_count: nextCount })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) {
            console.error('Error updating reimport count:', error);
            return null;
        }

        return data;
    }, [user]);

    const updateSessionData = useCallback(async (sessionId: string, newData: any) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_import_sessions')
            .update({ raw_data: newData })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) {
            console.error('Error updating AI session:', error);
            return null;
        }

        return data;
    }, [user]);

    return { uploadReceipt, saveSession, getSessions, updateSessionData, getSessionById, incrementReimportCount };
};
