
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useAIHistory = () => {
    const { user } = useAuth();

    const uploadReceipt = async (file: File) => {
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
    };

    const saveSession = async (imageUrls: string[], rawData: any) => {
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
    };

    const getSessions = async () => {
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
    };

    const updateSessionData = async (sessionId: string, newData: any) => {
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
    };

    return { uploadReceipt, saveSession, getSessions, updateSessionData };
};
