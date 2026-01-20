import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction, User } from '@/types/index';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useTransactions = (groupId?: string | null) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchTransactions = useCallback(async () => {
        if (!groupId || !user) return;

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
          *,
          payer:profiles!payer_id (
            id,
            full_name,
            avatar_url
          ),
          splits:transaction_splits (
            user_id,
            amount_owed,
            paid,
            user:profiles (
               id,
               full_name,
               avatar_url
            )
          )
        `)
                .eq('group_id', groupId)
                .order('date', { ascending: false });

            if (error) throw error;

            // Transform data
            const validTransactions: Transaction[] = data.map((t: any) => ({
                id: t.id,
                date: t.date,
                merchant: t.title, // Mapping title to merchant for now
                category: t.category,
                amount: t.amount,
                payer: {
                    id: t.payer.id,
                    name: t.payer.full_name || 'Desconocido',
                    avatar: t.payer.avatar_url,
                },
                splitWith: t.splits.map((s: any) => ({
                    id: s.user.id,
                    name: s.user.full_name,
                    avatar: s.user.avatar_url
                })),
                icon: 'Receipt', // Default
                iconColor: 'text-blue-400',
                iconBg: 'bg-blue-500/10',
                categoryColor: 'text-slate-500',
                categoryBg: 'bg-slate-100',
            }));

            setTransactions(validTransactions);
        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [groupId, user]);

    const addTransaction = async (data: {
        amount: number;
        title: string;
        category: string;
        date: string;
        splitBetween: string[]; // User IDs
        customSplits?: { userId: string; amount: number }[];
        original_amount?: number;
        original_currency?: string;
        exchange_rate?: number;
        is_recurring?: boolean;
        installments?: string | null;
    }) => {
        if (!user || !groupId) return { error: 'Missing user or group' };

        try {
            // 1. Insert Transaction
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .insert({
                    group_id: groupId,
                    payer_id: user.id,
                    created_by: user.id,
                    amount: data.amount,
                    title: data.title,
                    category: data.category,
                    date: data.date,
                    original_amount: data.original_amount,
                    original_currency: data.original_currency,
                    exchange_rate: data.exchange_rate,
                    is_recurring: data.is_recurring,
                    recurring_pattern: data.installments
                })
                .select()
                .single();

            if (txError) throw txError;

            // 2. Insert Splits
            let splitInserts = [];

            if (data.customSplits && data.customSplits.length > 0) {
                splitInserts = data.customSplits.map(s => ({
                    transaction_id: txData.id,
                    user_id: s.userId,
                    amount_owed: s.amount,
                    paid: s.userId === user.id
                }));
            } else {
                const splitAmount = data.amount / data.splitBetween.length;
                splitInserts = data.splitBetween.map(uid => ({
                    transaction_id: txData.id,
                    user_id: uid,
                    amount_owed: splitAmount,
                    paid: uid === user.id
                }));
            }

            const { error: splitError } = await supabase
                .from('transaction_splits')
                .insert(splitInserts);

            if (splitError) throw splitError;

            await fetchTransactions();
            return { data: txData, error: null };

        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const updateTransaction = async (id: string, data: {
        title: string;
        amount: number;
        category: string;
        date: string;
        splitBetween: string[];
        customSplits?: { userId: string; amount: number }[];
    }) => {
        if (!user || !groupId) return { error: 'Missing user or group' };

        try {
            // 1. Update Transaction
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .update({
                    title: data.title,
                    amount: data.amount,
                    category: data.category,
                    date: data.date
                })
                .eq('id', id)
                .select()
                .single();

            if (txError) throw txError;

            // 2. Refresh Splits
            const { error: splitDeleteError } = await supabase
                .from('transaction_splits')
                .delete()
                .eq('transaction_id', id);

            if (splitDeleteError) throw splitDeleteError;

            let splitInserts = [];

            if (data.customSplits && data.customSplits.length > 0) {
                splitInserts = data.customSplits.map(s => ({
                    transaction_id: id,
                    user_id: s.userId,
                    amount_owed: s.amount,
                    paid: s.userId === user.id
                }));
            } else {
                const splitAmount = data.amount / data.splitBetween.length;
                splitInserts = data.splitBetween.map(uid => ({
                    transaction_id: id,
                    user_id: uid,
                    amount_owed: splitAmount,
                    paid: uid === user.id
                }));
            }

            const { error: splitInsertError } = await supabase
                .from('transaction_splits')
                .insert(splitInserts);

            if (splitInsertError) throw splitInsertError;

            await fetchTransactions();
            return { data: txData, error: null };
        } catch (err: any) {
            console.error('[useTransactions] Update error:', err);
            return { data: null, error: err.message };
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user || !groupId) return { error: 'Missing user or group' };

        try {
            // Splits should be deleted by cascade if configured, but manually for safety
            await supabase
                .from('transaction_splits')
                .delete()
                .eq('transaction_id', id);

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchTransactions();
            return { error: null };
        } catch (err: any) {
            console.error('[useTransactions] Delete error:', err);
            return { error: err.message };
        }
    };

    const updateSplitCategory = async (transactionId: string, category: string) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const { error } = await supabase
                .from('transaction_splits')
                .update({ category })
                .eq('transaction_id', transactionId)
                .eq('user_id', user.id);

            if (error) throw error;

            await fetchTransactions();
            return { error: null };
        } catch (err: any) {
            console.error('[useTransactions] Update split category error:', err);
            return { error: err.message };
        }
    };

    return {
        transactions,
        loading,
        error,
        addTransaction,
        updateTransaction,
        updateSplitCategory,
        deleteTransaction,
        refreshTransactions: fetchTransactions
    };
};
