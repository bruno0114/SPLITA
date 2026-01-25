import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { InvestmentAccount, InvestmentAsset, InvestmentSnapshot, SavingsAccount, RatePeriod, Currency } from '@/types/index';

const toDailyRate = (value: number, period: RatePeriod) => {
  if (!value) return 0;
  const rate = value / 100;
  if (period === 'daily') return rate;
  if (period === 'monthly') return Math.pow(1 + rate, 1 / 30) - 1;
  return Math.pow(1 + rate, 1 / 365) - 1;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export const useSavings = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [investments, setInvestments] = useState<InvestmentAccount[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [snapshots, setSnapshots] = useState<InvestmentSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSavings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: savingsData, error: savingsError } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (savingsError) throw savingsError;

      const { data: investmentData, error: investmentError } = await supabase
        .from('investment_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (investmentError) throw investmentError;

      const investmentIds = (investmentData || []).map((item: any) => item.id);
      let assetsData: any[] = [];
      let snapshotsData: any[] = [];

      if (investmentIds.length > 0) {
        const { data: assetRows, error: assetsError } = await supabase
          .from('investment_assets')
          .select('*')
          .in('investment_account_id', investmentIds);
        if (assetsError) throw assetsError;
        assetsData = assetRows || [];

        const { data: snapshotRows, error: snapshotsError } = await supabase
          .from('investment_snapshots')
          .select('*')
          .in('investment_account_id', investmentIds)
          .order('snapshot_date', { ascending: false });
        if (snapshotsError) throw snapshotsError;
        snapshotsData = snapshotRows || [];
      }

      setAccounts((savingsData || []) as SavingsAccount[]);
      setInvestments((investmentData || []) as InvestmentAccount[]);
      setAssets(assetsData as InvestmentAsset[]);
      setSnapshots(snapshotsData as InvestmentSnapshot[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateInvestmentBalances = useCallback(async () => {
    if (!user || investments.length === 0) return;

    const now = new Date();
    const today = todayKey();
    let didUpdate = false;

    for (const investment of investments) {
      const lastUpdated = investment.last_updated_at ? new Date(investment.last_updated_at) : null;
      const lastDateKey = lastUpdated ? lastUpdated.toISOString().slice(0, 10) : null;

      if (lastDateKey === today) continue;

      const daysElapsed = lastUpdated
        ? Math.max(1, Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

      const accountAssets = assets.filter(a => a.investment_account_id === investment.id);
      const allocated = accountAssets.reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0);
      const currentBalance = Number(investment.current_balance || 0);
      const unallocated = Math.max(0, currentBalance - allocated);

      let weightedDaily = 0;
      if (accountAssets.length > 0) {
        weightedDaily = accountAssets.reduce((sum, asset) => {
          const daily = asset.expected_return_value && asset.expected_return_period
            ? toDailyRate(asset.expected_return_value, asset.expected_return_period)
            : 0;
          return sum + (daily * (Number(asset.allocated_amount || 0) / Math.max(1, allocated)));
        }, 0);
      } else if (investment.return_rate_value && investment.return_rate_period) {
        weightedDaily = toDailyRate(investment.return_rate_value, investment.return_rate_period);
      }

      const growthFactor = Math.pow(1 + weightedDaily, daysElapsed);
      const baseForGrowth = accountAssets.length > 0 ? allocated : currentBalance;
      const grown = baseForGrowth * growthFactor;
      const nextBalance = accountAssets.length > 0 ? grown + unallocated : grown;

      const { error } = await supabase
        .from('investment_accounts')
        .update({
          current_balance: nextBalance,
          last_updated_at: now.toISOString()
        })
        .eq('id', investment.id);

      if (error) {
        console.error('[useSavings] Update investment balance error:', error);
        continue;
      }

      didUpdate = true;

      const monthKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const hasSnapshot = snapshots.some(s => s.investment_account_id === investment.id && s.snapshot_date === monthKey);

      if (!hasSnapshot) {
        const { error: snapshotError } = await supabase
          .from('investment_snapshots')
          .insert({
            investment_account_id: investment.id,
            snapshot_date: monthKey,
            balance: nextBalance
          });
        if (!snapshotError) {
          didUpdate = true;
        }
      }
    }

    if (didUpdate) {
      await refreshSavings();
    }
  }, [assets, investments, refreshSavings, snapshots, user]);

  useEffect(() => {
    refreshSavings();
  }, [refreshSavings]);

  useEffect(() => {
    updateInvestmentBalances();
  }, [updateInvestmentBalances]);

  const totalSavings = useMemo(() => accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0), [accounts]);
  const totalInvestments = useMemo(() => investments.reduce((sum, i) => sum + Number(i.current_balance || 0), 0), [investments]);

  const addSavingsAccount = async (payload: Omit<SavingsAccount, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: 'Missing user' };
    const { data, error } = await supabase
      .from('savings_accounts')
      .insert({
        user_id: user.id,
        name: payload.name,
        currency: payload.currency,
        current_balance: payload.current_balance,
        account_type: payload.account_type
      })
      .select()
      .single();
    if (error) return { error: error.message };
    await refreshSavings();
    return { data };
  };

  const updateSavingsAccount = async (id: string, updates: Partial<SavingsAccount>) => {
    const { error } = await supabase
      .from('savings_accounts')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    await refreshSavings();
    return { error: null };
  };

  const deleteSavingsAccount = async (id: string) => {
    const { error } = await supabase
      .from('savings_accounts')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };
    await refreshSavings();
    return { error: null };
  };

  const addInvestmentAccount = async (payload: Omit<InvestmentAccount, 'id' | 'user_id' | 'created_at' | 'last_updated_at'>) => {
    if (!user) return { error: 'Missing user' };
    const { data, error } = await supabase
      .from('investment_accounts')
      .insert({
        user_id: user.id,
        name: payload.name,
        currency: payload.currency,
        current_balance: payload.current_balance,
        return_rate_value: payload.return_rate_value || null,
        return_rate_period: payload.return_rate_period || null,
        source_savings_account_id: payload.source_savings_account_id || null,
        last_updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) return { error: error.message };
    await refreshSavings();
    return { data };
  };

  const updateInvestmentAccount = async (id: string, updates: Partial<InvestmentAccount>) => {
    const { error } = await supabase
      .from('investment_accounts')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    await refreshSavings();
    return { error: null };
  };

  const deleteInvestmentAccount = async (id: string) => {
    const { error } = await supabase
      .from('investment_accounts')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };
    await refreshSavings();
    return { error: null };
  };

  const createInvestmentFromSavings = async (payload: {
    name: string;
    currency: Currency;
    transferAmount: number;
    sourceSavingsId: string;
    returnRateValue?: number | null;
    returnRatePeriod?: RatePeriod | null;
  }) => {
    if (!user) return { error: 'Missing user' };
    const savings = accounts.find(a => a.id === payload.sourceSavingsId);
    if (!savings) return { error: 'Cuenta de ahorro no encontrada' };

    const available = Number(savings.current_balance || 0);
    if (payload.transferAmount > available) {
      return { error: 'Saldo insuficiente en la cuenta de ahorro' };
    }

    const nextBalance = available - payload.transferAmount;

    const { error: savingsError } = await supabase
      .from('savings_accounts')
      .update({ current_balance: nextBalance })
      .eq('id', savings.id);
    if (savingsError) return { error: savingsError.message };

    const { data, error } = await supabase
      .from('investment_accounts')
      .insert({
        user_id: user.id,
        name: payload.name,
        currency: payload.currency,
        current_balance: payload.transferAmount,
        return_rate_value: payload.returnRateValue || null,
        return_rate_period: payload.returnRatePeriod || null,
        source_savings_account_id: savings.id,
        last_updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) return { error: error.message };

    await supabase.from('savings_transfers').insert({
      savings_account_id: savings.id,
      investment_account_id: data.id,
      amount: payload.transferAmount,
      transfer_type: 'transfer_invest'
    });

    await refreshSavings();
    return { data };
  };

  const withdrawFromInvestment = async (payload: {
    investmentId: string;
    amount: number;
  }) => {
    const investment = investments.find(inv => inv.id === payload.investmentId);
    if (!investment) return { error: 'Inversión no encontrada' };
    if (!investment.source_savings_account_id) return { error: 'La inversión no tiene cuenta de origen' };

    const current = Number(investment.current_balance || 0);
    if (payload.amount > current) return { error: 'Saldo insuficiente en la inversión' };

    const { error: investmentError } = await supabase
      .from('investment_accounts')
      .update({ current_balance: current - payload.amount })
      .eq('id', investment.id);
    if (investmentError) return { error: investmentError.message };

    const source = accounts.find(a => a.id === investment.source_savings_account_id);
    if (source) {
      const { error: savingsError } = await supabase
        .from('savings_accounts')
        .update({ current_balance: Number(source.current_balance || 0) + payload.amount })
        .eq('id', source.id);
      if (savingsError) return { error: savingsError.message };
    }

    await supabase.from('savings_transfers').insert({
      savings_account_id: investment.source_savings_account_id,
      investment_account_id: investment.id,
      amount: payload.amount,
      transfer_type: 'transfer_back'
    });

    await refreshSavings();
    return { error: null };
  };

  const upsertInvestmentAssets = async (investmentAccountId: string, list: InvestmentAsset[]) => {
    const { error } = await supabase
      .from('investment_assets')
      .delete()
      .eq('investment_account_id', investmentAccountId);
    if (error) return { error: error.message };

    const payload = list.map(asset => ({
      investment_account_id: investmentAccountId,
      asset_name: asset.asset_name,
      allocated_amount: asset.allocated_amount,
      expected_return_value: asset.expected_return_value || null,
      expected_return_period: asset.expected_return_period || null
    }));

    if (payload.length > 0) {
      const { error: insertError } = await supabase
        .from('investment_assets')
        .insert(payload);
      if (insertError) return { error: insertError.message };
    }

    await refreshSavings();
    return { error: null };
  };

  return {
    accounts,
    investments,
    assets,
    snapshots,
    totalSavings,
    totalInvestments,
    loading,
    refreshSavings,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    addInvestmentAccount,
    updateInvestmentAccount,
    deleteInvestmentAccount,
    upsertInvestmentAssets,
    createInvestmentFromSavings,
    withdrawFromInvestment
  };
};

export const convertAmount = (amount: number, from: Currency, to: Currency, exchangeRate: number) => {
  if (from === to) return amount;
  if (from === 'ARS' && to === 'USD') return amount / exchangeRate;
  if (from === 'USD' && to === 'ARS') return amount * exchangeRate;
  if (from === 'ARS' && to === 'EUR') return amount / exchangeRate;
  if (from === 'EUR' && to === 'ARS') return amount * exchangeRate;
  if (from === 'USD' && to === 'EUR') return amount;
  if (from === 'EUR' && to === 'USD') return amount;
  return amount;
};
