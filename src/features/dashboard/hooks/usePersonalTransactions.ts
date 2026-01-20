import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface PersonalTransaction {
    id: string;
    user_id: string;
    title: string;
    amount: number;
    category: string | null;
    type: 'income' | 'expense';
    date: string;
    payment_method: string | null;
    created_at: string;
}

export interface PersonalFinanceSummary {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
}

export const usePersonalTransactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
    const [summary, setSummary] = useState<PersonalFinanceSummary>({
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const calculateSummary = (txs: PersonalTransaction[]): PersonalFinanceSummary => {
        const totalIncome = txs
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpenses = txs
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses
        };
    };

    const fetchTransactions = useCallback(async () => {
        if (!user?.id) { // Check for user.id specifically
            setTransactions([]);
            setSummary({ balance: 0, totalIncome: 0, totalExpenses: 0 }); // Reset summary as well
            setLoading(false);
            setError(null); // Clear any previous errors
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('personal_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            setTransactions(data || []);
            setSummary(calculateSummary(data || []));
        } catch (err: any) {
            console.error('Error fetching personal transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id]); // Depend on user.id specifically

    const addTransaction = async (data: {
        title: string;
        amount: number;
        category?: string;
        type: 'income' | 'expense';
        date?: string;
        payment_method?: string;
        original_amount?: number;
        original_currency?: string;
        exchange_rate?: number;
        is_recurring?: boolean;
        installments?: string | null;
    }) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { data: newTx, error } = await supabase
                .from('personal_transactions')
                .insert({
                    user_id: user.id,
                    title: data.title,
                    amount: data.amount,
                    category: data.category || null,
                    type: data.type,
                    date: data.date || new Date().toISOString(),
                    payment_method: data.payment_method || null,
                    original_amount: data.original_amount,
                    original_currency: data.original_currency,
                    exchange_rate: data.exchange_rate,
                    is_recurring: data.is_recurring,
                    recurring_pattern: data.installments
                })
                .select()
                .single();

            if (error) {
                console.error('[usePersonalTransactions] Insert error:', error);
                throw error;
            }

            console.log('[usePersonalTransactions] Transaction added:', newTx);
            // Refresh list - AWAIT to ensure UI updates
            await fetchTransactions();
            return { data: newTx, error: null };
        } catch (err: any) {
            console.error('[usePersonalTransactions] Error:', err);
            return { data: null, error: err.message };
        }
    };

    const updateTransaction = async (id: string, data: Partial<Omit<PersonalTransaction, 'id' | 'user_id' | 'created_at'>>) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { data: updatedTx, error } = await supabase
                .from('personal_transactions')
                .update(data)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                console.error('[usePersonalTransactions] Update error:', error);
                throw error;
            }

            console.log('[usePersonalTransactions] Transaction updated:', updatedTx);
            await fetchTransactions();
            return { data: updatedTx, error: null };
        } catch (err: any) {
            console.error('[usePersonalTransactions] Error:', err);
            return { data: null, error: err.message };
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { error } = await supabase
                .from('personal_transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                console.error('[usePersonalTransactions] Delete error:', error);
                throw error;
            }

            console.log('[usePersonalTransactions] Transaction deleted:', id);
            await fetchTransactions();
            return { error: null };
        } catch (err: any) {
            console.error('[usePersonalTransactions] Error:', err);
            return { error: err.message };
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return {
        transactions,
        summary,
        loading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refreshTransactions: fetchTransactions
    };
};
