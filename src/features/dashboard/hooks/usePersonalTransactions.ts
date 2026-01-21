import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PersonalTransaction } from '@/types/index';


export interface PersonalFinanceSummary {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
}

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    categories?: string[];
    types?: ('income' | 'expense')[];
}

export const usePersonalTransactions = (initialFilters?: TransactionFilters) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
    const [summary, setSummary] = useState<PersonalFinanceSummary>({
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0
    });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const offsetRef = useRef(0);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

    const PAGE_SIZE = 20;

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

    const fetchTransactions = useCallback(async (isLoadMore = false) => {
        if (!user?.id) {
            setTransactions([]);
            setSummary({ balance: 0, totalIncome: 0, totalExpenses: 0 });
            setLoading(false);
            setLoadingMore(false);
            setError(null);
            return;
        }

        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        setError(null);
        try {
            const from = isLoadMore ? offsetRef.current : 0;
            const to = from + PAGE_SIZE - 1;

            // 1. Fetch personal transactions with filters
            let pQuery = supabase
                .from('personal_transactions')
                .select('*')
                .eq('user_id', user.id);

            if (filters.startDate) pQuery = pQuery.gte('date', filters.startDate);
            if (filters.endDate) pQuery = pQuery.lte('date', `${filters.endDate}T23:59:59.999Z`);
            if (filters.categories && filters.categories.length > 0) pQuery = pQuery.in('category', filters.categories);
            if (filters.types && filters.types.length > 0) pQuery = pQuery.in('type', filters.types);

            const { data: personalData, error: pError } = await pQuery
                .order('date', { ascending: false })
                .range(from, to);

            if (pError) throw pError;

            // 2. Fetch group transaction splits for this user
            // We apply date filters to splits too
            let sQuery = supabase
                .from('transaction_splits')
                .select(`
                    amount_owed,
                    category,
                    transaction:transactions (
                        id,
                        title,
                        category,
                        date,
                        group:groups ( name )
                    )
                `)
                .eq('user_id', user.id);

            const { data: groupSplits, error: sError } = await sQuery;

            if (sError) throw sError;

            // 3. Map group splits to common format and filter by date/category
            const mappedGroupTx = (groupSplits || [])
                .filter(s => s.transaction)
                .map((s: any) => ({
                    id: `split-${s.transaction.id}`,
                    user_id: user.id,
                    title: s.transaction.title,
                    amount: Number(s.amount_owed),
                    category: s.category || s.transaction.category, // Use split category if available
                    type: 'expense',
                    date: s.transaction.date,
                    payment_method: s.transaction.group?.name || 'Grupo',
                    is_group: true
                }))
                .filter((tx: any) => {
                    if (filters.startDate && tx.date < filters.startDate) return false;
                    // Comparison with endDate date-string only
                    if (filters.endDate) {
                        const endDateTime = `${filters.endDate}T23:59:59.999Z`;
                        if (tx.date > endDateTime) return false;
                    }
                    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(tx.category)) return false;
                    if (filters.types && filters.types.length > 0 && !filters.types.includes(tx.type)) return false;
                    return true;
                });

            // 4. Merge and sort
            // Note: Since personalData is paginated but mappedGroupTx is not (currently), 
            // the infinite scroll behavior might be slightly inconsistent for group splits.
            // In a real production app, we would paginate a unified view or unify the logs.
            // For now, we merge and the user sees their recent items.

            const merged = [...(personalData || []), ...mappedGroupTx].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            if (isLoadMore) {
                setTransactions(prev => [...prev, ...merged]);
                offsetRef.current = from + personalData.length;
            } else {
                setTransactions(merged as any[]);
                offsetRef.current = personalData.length;
                setSummary(calculateSummary(merged as any[]));
            }

            // Check if we might have more
            setHasMore(personalData.length === PAGE_SIZE);

        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user?.id, filters]); // Removed 'page' to avoid loop, we manage it inside based on isLoadMore

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
    }, options?: { skipRefresh?: boolean }) => {
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

            if (!options?.skipRefresh) {
                await fetchTransactions();
            }

            return { data: newTx, error: null };
        } catch (err: any) {
            console.error('[usePersonalTransactions] Error:', err);
            return { data: null, error: err.message };
        }
    };

    const updateTransaction = async (id: string, data: any) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            // Check if it's a group split
            if (id.startsWith('split-')) {
                const realTxId = id.replace('split-', '');

                // For splits, we currently only support updating the category
                if (data.category) {
                    const { error } = await supabase
                        .from('transaction_splits')
                        .update({ category: data.category })
                        .eq('transaction_id', realTxId)
                        .eq('user_id', user.id);

                    if (error) throw error;
                }

                await fetchTransactions();
                return { data: { ...data, id }, error: null };
            }

            // Map and sanitize data for personal_transactions
            const updateData: any = {};
            if (data.title !== undefined) updateData.title = data.title;
            if (data.amount !== undefined) updateData.amount = data.amount;
            if (data.category !== undefined) updateData.category = data.category;
            if (data.type !== undefined) updateData.type = data.type;
            if (data.date !== undefined) updateData.date = data.date;
            if (data.payment_method !== undefined) updateData.payment_method = data.payment_method;
            if (data.original_amount !== undefined) updateData.original_amount = data.original_amount;
            if (data.original_currency !== undefined) updateData.original_currency = data.original_currency;
            if (data.exchange_rate !== undefined) updateData.exchange_rate = data.exchange_rate;
            if (data.is_recurring !== undefined) updateData.is_recurring = data.is_recurring;

            // Map installments to recurring_pattern for DB
            if (data.installments !== undefined) updateData.recurring_pattern = data.installments;

            const { data: updatedTx, error } = await supabase
                .from('personal_transactions')
                .update(updateData)
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
            // Check if it's a group split
            if (id.startsWith('split-')) {
                const realTxId = id.replace('split-', '');
                const { error } = await supabase
                    .from('transaction_splits')
                    .delete()
                    .eq('transaction_id', realTxId)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('personal_transactions')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id);

                if (error) throw error;
            }

            console.log('[usePersonalTransactions] Transaction deleted:', id);
            await fetchTransactions();
            return { error: null };
        } catch (err: any) {
            console.error('[usePersonalTransactions] Error:', err);
            return { error: err.message };
        }
    };

    const deleteTransactions = async (ids: string[]) => {
        if (!user) return { error: 'No authenticated user' };

        try {
            const splitIds = ids.filter(id => id.startsWith('split-')).map(id => id.replace('split-', ''));
            const personalIds = ids.filter(id => !id.startsWith('split-'));

            if (personalIds.length > 0) {
                const { error } = await supabase
                    .from('personal_transactions')
                    .delete()
                    .in('id', personalIds)
                    .eq('user_id', user.id);
                if (error) throw error;
            }

            if (splitIds.length > 0) {
                const { error } = await supabase
                    .from('transaction_splits')
                    .delete()
                    .in('transaction_id', splitIds)
                    .eq('user_id', user.id);
                if (error) throw error;
            }

            await fetchTransactions();
            return { error: null };
        } catch (err: any) {
            console.error('[usePersonalTransactions] Bulk Delete Error:', err);
            return { error: err.message };
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const loadMore = useCallback(() => fetchTransactions(true), [fetchTransactions]);
    const refreshTransactions = useCallback(() => fetchTransactions(false), [fetchTransactions]);

    return {
        transactions,
        summary,
        loading,
        loadingMore,
        hasMore,
        filters,
        setFilters,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        loadMore,
        refreshTransactions
    };
};
