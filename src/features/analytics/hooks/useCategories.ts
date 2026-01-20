import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Category } from '@/types/index';

export const useCategories = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;
            setCategories(data || []);
        } catch (err: any) {
            console.error('[useCategories] Error fetching categories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();

        // Optional: Real-time subscription
        const channel = supabase
            .channel('public:categories')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const addCategory = async (category: Omit<Category, 'id' | 'user_id' | 'is_system'>) => {
        try {
            if (!user) throw new Error('Debes estar autenticado');

            const { data, error: insertError } = await supabase
                .from('categories')
                .upsert([{
                    user_id: user.id,
                    name: category.name.trim(),
                    icon: category.icon,
                    color: category.color,
                    bg_color: category.bg_color,
                    is_system: false
                }], {
                    onConflict: 'user_id, name' // This assumes the unique index is named correctly or matches these columns
                })
                .select()
                .single();

            if (insertError) {
                // If it fails due to unique constraint, try to get existing one
                if (insertError.code === '23505') {
                    const { data: existing } = await supabase
                        .from('categories')
                        .select()
                        .eq('user_id', user.id)
                        .ilike('name', category.name.trim())
                        .single();
                    if (existing) return existing;
                }
                throw insertError;
            }
            return data;
        } catch (err: any) {
            console.error('[useCategories] Error adding category:', err);
            throw err;
        }
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        try {
            const { error: updateError } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;
        } catch (err: any) {
            console.error('[useCategories] Error updating category:', err);
            throw err;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
        } catch (err: any) {
            console.error('[useCategories] Error deleting category:', err);
            throw err;
        }
    };

    const getCategoryByName = (name: string) => {
        const normalized = name.trim().toLowerCase();
        return categories.find(c => c.name.toLowerCase() === normalized);
    };

    return {
        categories,
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryByName,
        refresh: fetchCategories
    };
};
