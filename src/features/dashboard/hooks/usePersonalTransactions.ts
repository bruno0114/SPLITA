import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PersonalTransaction } from '@/types/index';


export interface PersonalFinanceSummary {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
    totalCount: number;
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
    const [fullTransactions, setFullTransactions] = useState<PersonalTransaction[]>([]);
    const [summary, setSummary] = useState<PersonalFinanceSummary>({
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalCount: 0
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
            .reduce((sum, t) => {
                const amt = Number(t.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }, 0);

        const totalExpenses = txs
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => {
                const amt = Number(t.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }, 0);

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            totalCount: txs.length
        };
    };

    const fetchTransactions = useCallback(async (isLoadMore = false) => {
        if (!user?.id) {
            console.log('[usePersonalTransactions] No user session, clearing data.');
            setTransactions([]);
            setSummary({ balance: 0, totalIncome: 0, totalExpenses: 0, totalCount: 0 });
            setLoading(false);
            setLoadingMore(false);
            setError(null);
            return;
        }

        console.log(`[usePersonalTransactions] Fetching for User ID: ${user.id} (LoadMore: ${isLoadMore})`);

        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        setError(null);
        try {
            console.log('[usePersonalTransactions] Fetching with filters:', filters);

            // 1. Fetch paged personal transactions
            const from = isLoadMore ? offsetRef.current : 0;
            const to = from + PAGE_SIZE - 1;

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

            // 1.1 Fetch ALL filtered personal data for global summary and charts
            let pFullQuery = supabase
                .from('personal_transactions')
                .select('*')
                .eq('user_id', user.id);

            if (filters.startDate) pFullQuery = pFullQuery.gte('date', filters.startDate);
            if (filters.endDate) pFullQuery = pFullQuery.lte('date', `${filters.endDate}T23:59:59.999Z`);
            if (filters.categories && filters.categories.length > 0) pFullQuery = pFullQuery.in('category', filters.categories);
            if (filters.types && filters.types.length > 0) pFullQuery = pFullQuery.in('type', filters.types);

            const { data: allPersonalData, error: pFullError } = await pFullQuery;
            if (pFullError) throw pFullError;

            // 2. Fetch group transaction splits for this user (separated to avoid blocking personal data)
            let mappedGroupTx: any[] = [];
            try {
                const { data: groupSplits, error: sError } = await supabase
                    .from('transaction_splits')
                    .select(`
                        id,
                        amount_owed,
                        transaction:transactions (
                            id,
                            title,
                            category,
                            date,
                            amount,
                            group:groups ( name )
                        )
                    `)
                    .eq('user_id', user.id);

                if (sError) {
                    console.error('[usePersonalTransactions] Group splits query ERROR:', sError);
                } else if (groupSplits) {
                    console.log(`[usePersonalTransactions] GROUP DATA: Found ${groupSplits.length} splits in DB`);
                    if (groupSplits.length > 0) {
                        console.log('[usePersonalTransactions] First Raw Split:', JSON.stringify(groupSplits[0], null, 2));
                    }
                    // 3. Map group splits to common format and filter
                    mappedGroupTx = groupSplits
                        .filter(s => s?.transaction)
                        .map((s: any) => ({
                            id: `split-${s.transaction.id}`,
                            user_id: user.id,
                            title: s.transaction.title,
                            amount: Number(s.amount_owed || 0),
                            category: s.transaction.category || 'Otros',
                            type: (s.transaction.amount >= 0 ? 'expense' : 'income') as 'income' | 'expense',
                            date: s.transaction.date,
                            payment_method: s.transaction.group?.name || 'Grupo',
                            is_group: true
                        }))
                        .filter((tx: any) => {
                            const inDateRange = (!filters.startDate || tx.date >= filters.startDate) &&
                                (!filters.endDate || tx.date <= `${filters.endDate}T23:59:59.999Z`);
                            const inCategory = !filters.categories || filters.categories.length === 0 || filters.categories.includes(tx.category);
                            const inType = !filters.types || filters.types.length === 0 || filters.types.includes(tx.type);

                            return inDateRange && inCategory && inType;
                        });

                    console.log(`[usePersonalTransactions] Mapped Group TXs after filters: ${mappedGroupTx.length}`);
                }
            } catch (splitErr) {
                console.error('[usePersonalTransactions] Error fetching/mapping splits:', splitErr);
            }

            // 4. Calculate Global Results
            const allItems = [...(allPersonalData || []), ...mappedGroupTx];
            const globalSummary = calculateSummary(allItems as any[]);

            console.log(`[usePersonalTransactions] User ID: ${user.id}`);
            console.log(`[usePersonalTransactions] Query Result - Personal: ${allPersonalData?.length || 0}, Groups: ${mappedGroupTx.length}`);
            if (allItems.length > 0) {
                console.log('[usePersonalTransactions] First items:', allItems.slice(0, 2));
            }
            console.log('[usePersonalTransactions] Calculated balance:', globalSummary.balance);

            setFullTransactions(allItems as any[]);
            setSummary(globalSummary);

            // 5. Update the paged list with deduplication
            if (isLoadMore) {
                setTransactions(prev => {
                    const next = [...prev, ...(personalData || [])];
                    const unique = Array.from(new Map(next.map(item => [item.id, item])).values());
                    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
                offsetRef.current = from + (personalData?.length || 0);
            } else {
                const initialMerged = [...(personalData || []), ...mappedGroupTx];
                const unique = Array.from(new Map(initialMerged.map(item => [item.id, item])).values());
                setTransactions(unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                offsetRef.current = personalData?.length || 0;
            }

            setHasMore(personalData?.length === PAGE_SIZE);

        } catch (err: any) {
            console.error('[usePersonalTransactions] Fetch Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user?.id, filters]);

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
                console.error('[usePersonalTransactions] Insert error (Supabase):', error);
                return { error: error.message || 'Error desconocido de base de datos' };
            }

            console.log('[usePersonalTransactions] Transaction added successfully:', newTx);

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

                // First delete splits (manual cascade for safety/clarity)
                await supabase
                    .from('transaction_splits')
                    .delete()
                    .eq('transaction_id', realTxId);

                // Then delete the parent transaction (Option A: Total Deletion)
                const { error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', realTxId);

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
                // First delete splits (manual cascade for safety/clarity)
                await supabase
                    .from('transaction_splits')
                    .delete()
                    .in('transaction_id', splitIds);

                // Option A: Total Deletion from parent transactions table
                const { error } = await supabase
                    .from('transactions')
                    .delete()
                    .in('id', splitIds);
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
        fullTransactions,
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
