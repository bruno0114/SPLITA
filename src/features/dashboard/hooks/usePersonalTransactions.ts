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
        if (!user) {
            setTransactions([]);
            setLoading(false);
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
    }, [user]);

    const addTransaction = async (data: {
        title: string;
        amount: number;
        category?: string;
        type: 'income' | 'expense';
        date?: string;
        payment_method?: string;
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
                    payment_method: data.payment_method || null
                })
                .select()
                .single();

            if (error) throw error;

            // Refresh list
            fetchTransactions();
            return { data: newTx, error: null };
        } catch (err: any) {
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

            if (error) throw error;

            fetchTransactions();
            return { error: null };
        } catch (err: any) {
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
        deleteTransaction,
        refreshTransactions: fetchTransactions
    };
};
