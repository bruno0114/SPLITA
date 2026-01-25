import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Wallet, TrendingUp, Info, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useSavings, convertAmount } from '@/features/savings/hooks/useSavings';
import { InvestmentAccount, InvestmentAsset, RatePeriod, Currency, SavingsAccount } from '@/types/index';
import { useCurrency } from '@/context/CurrencyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonBlock from '@/components/ui/Skeleton';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import PremiumConfirmModal from '@/components/ui/PremiumConfirmModal';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { apyToDailyRate, compoundWithApy } from '@/lib/expert-math';

const Savings: React.FC = () => {
  const {
    accounts,
    investments,
    assets,
    snapshots,
    loading,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    updateInvestmentAccount,
    deleteInvestmentAccount,
    upsertInvestmentAssets,
    createInvestmentFromSavings,
    withdrawFromInvestment
  } = useSavings();
  const { summary, loading: summaryLoading } = usePersonalTransactions();
  const { user } = useAuth();
  const { currency: displayCurrency, exchangeRate } = useCurrency();
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [editingSavings, setEditingSavings] = useState<SavingsAccount | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentAccount | null>(null);
  const [deleteSavingsConfirm, setDeleteSavingsConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [deleteInvestmentConfirm, setDeleteInvestmentConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBalanceRateModal, setShowBalanceRateModal] = useState(false);
  const [balanceApy, setBalanceApy] = useState(0);
  const [balanceApyInput, setBalanceApyInput] = useState('');
  const [savingsTopUp, setSavingsTopUp] = useState('');
  const [investmentTopUp, setInvestmentTopUp] = useState('');
  const [investmentTopUpError, setInvestmentTopUpError] = useState('');

  const [savingsForm, setSavingsForm] = useState({ name: '', currency: 'ARS', balance: '' });
  const [investmentForm, setInvestmentForm] = useState({ name: '', currency: 'ARS', balance: '', returnRate: '', returnPeriod: 'annual' as RatePeriod, sourceSavingsId: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [investmentError, setInvestmentError] = useState<string | null>(null);
  const [assetRows, setAssetRows] = useState<InvestmentAsset[]>([]);
  const [customYears, setCustomYears] = useState('');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');

  const formatCurrency = (value: number, currency: Currency) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'ARS' ? 0 : 2
    }).format(value);
  };

  const toDisplayCurrency = (value: number, from: Currency) => {
    return convertAmount(value, from, displayCurrency, exchangeRate);
  };

  const { savingsConverted, investmentsConverted, totalConverted } = useMemo(() => {
    const savingsConverted = accounts.reduce((sum, a) => sum + toDisplayCurrency(Number(a.current_balance || 0), a.currency), 0);
    const investmentsConverted = investments.reduce((sum, inv) => sum + toDisplayCurrency(Number(inv.current_balance || 0), inv.currency), 0);
    return {
      savingsConverted,
      investmentsConverted,
      totalConverted: savingsConverted + investmentsConverted
    };
  }, [accounts, investments, displayCurrency, exchangeRate]);

  const investedMap = useMemo(() => {
    const map = new Map<string, number>();
    investments.forEach(inv => {
      if (inv.source_savings_account_id) {
        map.set(inv.source_savings_account_id, (map.get(inv.source_savings_account_id) || 0) + Number(inv.current_balance || 0));
      }
    });
    return map;
  }, [investments]);

  const savingsNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach(acc => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  const savingsMap = useMemo(() => {
    const map = new Map<string, SavingsAccount>();
    accounts.forEach(acc => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const selectedInvestment = useMemo(() => {
    if (selectedInvestmentId) return investments.find(i => i.id === selectedInvestmentId) || null;
    return investments[0] || null;
  }, [investments, selectedInvestmentId]);

  const selectedAssets = useMemo(() => {
    if (!selectedInvestment) return [];
    return assets.filter(a => a.investment_account_id === selectedInvestment.id);
  }, [assets, selectedInvestment]);

  const selectedSnapshots = useMemo(() => {
    if (!selectedInvestment) return [];
    return snapshots
      .filter(s => s.investment_account_id === selectedInvestment.id)
      .sort((a, b) => (a.snapshot_date < b.snapshot_date ? 1 : -1))
      .slice(0, 6);
  }, [selectedInvestment, snapshots]);

  const unallocatedAmount = useMemo(() => {
    if (!selectedInvestment) return 0;
    const allocated = selectedAssets.reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0);
    return Math.max(0, Number(selectedInvestment.current_balance || 0) - allocated);
  }, [selectedAssets, selectedInvestment]);

  const balancePrincipal = summary.balance;
  const balanceYieldPrincipal = Math.max(0, balancePrincipal);
  const balanceDailyRate = useMemo(() => apyToDailyRate(balanceApy), [balanceApy]);
  const balanceInterestToday = useMemo(() => balanceYieldPrincipal * balanceDailyRate, [balanceYieldPrincipal, balanceDailyRate]);
  const balanceMonthInterest = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysElapsed = Math.max(0, Math.floor((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
    const monthTotal = compoundWithApy(balanceYieldPrincipal, balanceApy, daysElapsed);
    return Math.max(0, monthTotal - balanceYieldPrincipal);
  }, [balanceYieldPrincipal, balanceApy]);

  const getDailyRate = (value: number, period: RatePeriod) => {
    const rate = value / 100;
    if (period === 'daily') return rate;
    if (period === 'monthly') return Math.pow(1 + rate, 1 / 30) - 1;
    return apyToDailyRate(value);
  };

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`splita-balance-apy-${user.id}`);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setBalanceApy(parsed);
        setBalanceApyInput(String(parsed));
      }
    }
  }, [user]);

  const projectionData = useMemo(() => {
    if (!selectedInvestment) return [];

    const timelineBase = [1, 3, 5, 10];
    const timelineSet = new Set(timelineBase);
    if (customYears) timelineSet.add(Math.max(1, Number(customYears)));
    const timeline = Array.from(timelineSet).sort((a, b) => a - b);

    const selectedAsset = selectedAssets.find(asset => asset.id === selectedAssetId);
    const assetsToUse = selectedAssetId === 'all'
      ? selectedAssets
      : (selectedAsset ? [selectedAsset] : []);
    const allocated = selectedAssets.reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0);
    const baseBalance = Number(selectedInvestment.current_balance || 0);
    const unallocated = selectedAssetId === 'all' ? Math.max(0, baseBalance - allocated) : 0;

    const fallbackRate = selectedInvestment.return_rate_value && selectedInvestment.return_rate_period
      ? getDailyRate(selectedInvestment.return_rate_value, selectedInvestment.return_rate_period)
      : 0;

    return timeline.map(year => {
      const days = year * 365;
      let total = 0;
      let principal = 0;
      const breakdown: { label: string; total: number; gain: number; principal: number }[] = [];

      if (assetsToUse.length > 0) {
        assetsToUse.forEach(asset => {
          const assetPrincipal = Number(asset.allocated_amount || 0);
          const assetDaily = asset.expected_return_value && asset.expected_return_period
            ? getDailyRate(asset.expected_return_value, asset.expected_return_period)
            : fallbackRate;
          const assetTotal = assetPrincipal * Math.pow(1 + assetDaily, days);
          total += assetTotal;
          principal += assetPrincipal;
          breakdown.push({
            label: asset.asset_name || 'Activo',
            total: assetTotal,
            gain: assetTotal - assetPrincipal,
            principal: assetPrincipal
          });
        });

        if (unallocated > 0) {
          total += unallocated;
          principal += unallocated;
          breakdown.push({
            label: 'Cash no asignado',
            total: unallocated,
            gain: 0,
            principal: unallocated
          });
        }
      } else {
        const accountPrincipal = baseBalance;
        const accountTotal = accountPrincipal * Math.pow(1 + fallbackRate, days);
        total = accountTotal;
        principal = accountPrincipal;
        breakdown.push({
          label: selectedInvestment.name,
          total: accountTotal,
          gain: accountTotal - accountPrincipal,
          principal: accountPrincipal
        });
      }

      return {
        label: `${year} año${year === 1 ? '' : 's'}`,
        total,
        principal,
        gain: Math.max(0, total - principal),
        breakdown
      };
    });
  }, [selectedInvestment, selectedAssets, selectedAssetId, customYears]);

  const handleOpenInvestment = (investment?: InvestmentAccount) => {
    setInvestmentError(null);
    setWithdrawAmount('');
    setInvestmentTopUp('');
    setInvestmentTopUpError('');
    if (investment) {
      setEditingInvestment(investment);
      setInvestmentForm({
        name: investment.name,
        currency: investment.currency,
        balance: String(investment.current_balance),
        returnRate: investment.return_rate_value ? String(investment.return_rate_value) : '',
        returnPeriod: (investment.return_rate_period || 'annual') as RatePeriod,
        sourceSavingsId: investment.source_savings_account_id || ''
      });
      const list = assets.filter(a => a.investment_account_id === investment.id);
      setAssetRows(list.map(a => ({ ...a } as InvestmentAsset)));
    } else {
      setEditingInvestment(null);
      setInvestmentForm({ name: '', currency: 'ARS', balance: '', returnRate: '', returnPeriod: 'annual', sourceSavingsId: '' });
      setAssetRows([]);
    }
    setShowInvestmentModal(true);
  };

  const handleOpenSavings = (account?: SavingsAccount) => {
    if (account) {
      setEditingSavings(account);
      setSavingsForm({
        name: account.name,
        currency: account.currency,
        balance: String(account.current_balance || '')
      });
    } else {
      setEditingSavings(null);
      setSavingsForm({ name: '', currency: 'ARS', balance: '' });
    }
    setSavingsTopUp('');
    setShowSavingsModal(true);
  };

  const handleCloseSavingsModal = () => {
    setShowSavingsModal(false);
    setEditingSavings(null);
  };

  const handleSaveInvestment = async () => {
    if (!investmentForm.name || !investmentForm.balance) return;
    if (!editingInvestment && !investmentForm.sourceSavingsId) {
      setInvestmentError('Seleccioná una cuenta de ahorro para vincular la inversión.');
      return;
    }
    setIsRefreshing(true);
    setShowInvestmentModal(false);
    const payload = {
      name: investmentForm.name.trim(),
      currency: investmentForm.currency as Currency,
      current_balance: Number(investmentForm.balance),
      return_rate_value: investmentForm.returnRate ? Number(investmentForm.returnRate) : null,
      return_rate_period: investmentForm.returnRate ? investmentForm.returnPeriod : null
    };
    try {
      let investmentId = editingInvestment?.id;
      if (editingInvestment) {
        await updateInvestmentAccount(editingInvestment.id, payload as any);
      } else {
        const result = await createInvestmentFromSavings({
          name: payload.name,
          currency: payload.currency,
          transferAmount: Number(investmentForm.balance),
          sourceSavingsId: investmentForm.sourceSavingsId,
          returnRateValue: payload.return_rate_value || null,
          returnRatePeriod: payload.return_rate_period || null
        });
        investmentId = (result.data as InvestmentAccount)?.id;
      }

      if (investmentId) {
        await upsertInvestmentAssets(investmentId, assetRows.map(a => ({
          ...a,
          investment_account_id: investmentId
        })));
      }
    } finally {
      setEditingInvestment(null);
      setIsRefreshing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!editingInvestment || !withdrawAmount) return;
    await withdrawFromInvestment({
      investmentId: editingInvestment.id,
      amount: Number(withdrawAmount)
    });
    setWithdrawAmount('');
  };

  if (loading) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto space-y-8">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
        <SkeletonBlock className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      </div>
    );
  }

  const handleSaveSavings = async () => {
    if (!savingsForm.name || !savingsForm.balance) return;
    if (editingSavings) {
      const current = Number(savingsForm.balance);
      const topUp = Number(savingsTopUp || 0);
      const nextBalance = current + (Number.isNaN(topUp) ? 0 : topUp);
      await updateSavingsAccount(editingSavings.id, {
        name: savingsForm.name.trim(),
        currency: savingsForm.currency as Currency,
        current_balance: nextBalance
      });
    } else {
      await addSavingsAccount({
        name: savingsForm.name.trim(),
        currency: savingsForm.currency as Currency,
        current_balance: Number(savingsForm.balance),
        account_type: 'cash'
      });
    }
    handleCloseSavingsModal();
  };

  const handleInvestmentTopUp = async () => {
    if (!editingInvestment || !editingInvestment.source_savings_account_id) return;
    const amount = Number(investmentTopUp || 0);
    if (!amount || amount <= 0) return;
    const source = savingsMap.get(editingInvestment.source_savings_account_id);
    const available = Number(source?.current_balance || 0);
    if (amount > available) {
      setInvestmentTopUpError('Saldo insuficiente en la cuenta de ahorro de origen.');
      return;
    }
    setInvestmentTopUpError('');
    setIsRefreshing(true);
    try {
      await updateSavingsAccount(editingInvestment.source_savings_account_id, {
        current_balance: available - amount
      });
      await updateInvestmentAccount(editingInvestment.id, {
        current_balance: Number(editingInvestment.current_balance || 0) + amount
      });
      setEditingInvestment(prev => prev ? {
        ...prev,
        current_balance: Number(prev.current_balance || 0) + amount
      } : prev);
      setInvestmentForm(prev => ({
        ...prev,
        balance: String(Number(prev.balance || 0) + amount)
      }));
      setInvestmentTopUp('');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenBalanceRate = () => {
    setBalanceApyInput(balanceApy ? String(balanceApy) : '');
    setShowBalanceRateModal(true);
  };

  const handleSaveBalanceRate = () => {
    const parsed = Number(balanceApyInput);
    if (Number.isNaN(parsed)) return;
    const nextValue = Math.max(0, parsed);
    setBalanceApy(nextValue);
    if (user) {
      localStorage.setItem(`splita-balance-apy-${user.id}`, String(nextValue));
    }
    setShowBalanceRateModal(false);
  };

  return (
    <div className="px-6 md:px-12 py-6 md:py-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Ahorros</h2>
            <div className="relative group">
              <Info className="w-4 h-4 text-slate-400" />
              <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-72 rounded-xl bg-slate-900 text-white text-xs font-medium px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Las inversiones se fondean desde una cuenta de ahorro. Flujo recomendado: 1) crea tu cuenta de ahorro, 2) transferi un monto al crear la inversion, 3) asigna capital a los activos para proyectar retornos.
              </div>
            </div>
          </div>
          <p className="text-slate-500">Gestioná tus reservas y tus inversiones.</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleOpenSavings()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Nueva cuenta
            </button>
          <button
            onClick={() => handleOpenInvestment()}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <TrendingUp className="w-4 h-4" /> Nueva inversión
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-[2rem] p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ahorros totales</p>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalConverted, displayCurrency)}
          </div>
          <p className="text-xs text-slate-500 mt-2">Convertido a {displayCurrency}</p>
        </div>
        <div className="glass-panel rounded-[2rem] p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo en inversiones</p>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatCurrency(investmentsConverted, displayCurrency)}
          </div>
          <p className="text-xs text-slate-500 mt-2">Incluye retornos acumulados</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cuentas de ahorro</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryLoading ? (
            <SkeletonBlock className="h-36" />
          ) : (
            <div className="glass-panel rounded-2xl p-5 border border-blue-500/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Balance general</p>
                  <p className="text-[10px] text-slate-400 mt-1">Actualizado desde Finanzas · Siempre disponible</p>
                </div>
                <button
                  onClick={handleOpenBalanceRate}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600"
                >
                  Configurar tasa
                </button>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
                {formatCurrency(balancePrincipal, displayCurrency)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-2 border border-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interes diario</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(balanceInterestToday, displayCurrency)}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-2 border border-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interes del mes</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(balanceMonthInterest, displayCurrency)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Tasa APY</span>
                <span>{balanceApy ? `${balanceApy.toFixed(2)}%` : 'Sin configurar'}</span>
              </div>
            </div>
          )}
          {accounts.map(account => {
            const transferred = investedMap.get(account.id) || 0;
            const totalInitial = transferred + Number(account.current_balance || 0);
            const percent = totalInitial > 0 ? Math.round((transferred / totalInitial) * 100) : 0;
            return (
              <div
                key={account.id}
                role="button"
                onClick={() => handleOpenSavings(account)}
                className="glass-panel rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{account.name}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenSavings(account);
                      }}
                      className="p-2 rounded-full bg-white/70 dark:bg-black/30 border border-border text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Editar cuenta"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteSavingsConfirm({ isOpen: true, id: account.id });
                      }}
                      className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-600 transition-colors"
                      title="Eliminar cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {formatCurrency(Number(account.current_balance || 0), account.currency)}
                </div>
                <p className="text-xs text-slate-500 mt-1">≈ {formatCurrency(toDisplayCurrency(Number(account.current_balance || 0), account.currency), displayCurrency)}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Invertido {percent}%</span>
                  <span className="text-[10px] font-bold text-slate-500">{formatCurrency(transferred, account.currency)} en inversiones</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
          {accounts.length === 0 && !loading && (
            <div className="glass-panel rounded-2xl p-6 text-sm text-slate-500">Todavía no cargaste cuentas de ahorro.</div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cuentas de inversión</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investments.map(inv => {
            const invAssets = assets.filter(a => a.investment_account_id === inv.id);
            const allocated = invAssets.reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0);
            const unallocated = Math.max(0, Number(inv.current_balance || 0) - allocated);
            return (
              <div
                key={inv.id}
                role="button"
                onClick={() => handleOpenInvestment(inv)}
                className="text-left glass-panel rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{inv.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{inv.currency}</span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenInvestment(inv);
                      }}
                      className="p-2 rounded-full bg-white/70 dark:bg-black/30 border border-border text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Editar inversion"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteInvestmentConfirm({ isOpen: true, id: inv.id });
                      }}
                      className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-600 transition-colors"
                      title="Eliminar inversion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {formatCurrency(Number(inv.current_balance || 0), inv.currency)}
                </div>
                <p className="text-xs text-slate-500 mt-1">≈ {formatCurrency(toDisplayCurrency(Number(inv.current_balance || 0), inv.currency), displayCurrency)}</p>
                <div className="mt-3 text-xs text-slate-500">
                  Activos: {invAssets.length} · Cash no asignado: {formatCurrency(unallocated, inv.currency)}
                </div>
                {inv.source_savings_account_id && (
                  <p className="text-[10px] text-blue-500 font-bold mt-2 uppercase tracking-widest">
                    Origen: {savingsNameMap.get(inv.source_savings_account_id) || 'Cuenta de ahorro'}
                  </p>
                )}
              </div>
            );
          })}
          {investments.length === 0 && !loading && (
            <div className="glass-panel rounded-2xl p-6 text-sm text-slate-500">Creá tu primera inversión para ver proyecciones.</div>
          )}
        </div>
      </section>

      {selectedInvestment && (
        <section className="glass-panel rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Proyección</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedInvestment.name}</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom</span>
              <input
                type="number"
                placeholder="Años"
                value={customYears}
                onChange={(e) => setCustomYears(e.target.value)}
                className="w-24 px-2 py-1.5 rounded-full text-xs font-bold bg-white/60 dark:bg-black/20 border border-border text-slate-600"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedInvestmentId || selectedInvestment.id}
              onChange={(e) => setSelectedInvestmentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/60 dark:bg-black/20 border border-border text-sm font-bold"
            >
              {investments.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.name}</option>
              ))}
            </select>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/60 dark:bg-black/20 border border-border text-sm font-bold"
            >
              <option value="all">Todos los activos</option>
              {selectedAssets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.asset_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2 border border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capital total</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(Number(selectedInvestment.current_balance || 0), selectedInvestment.currency)}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2 border border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignado a activos</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(selectedAssets.reduce((sum, asset) => sum + Number(asset.allocated_amount || 0), 0), selectedInvestment.currency)}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2 border border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash no asignado</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(unallocatedAmount, selectedInvestment.currency)}
              </p>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            Si un activo no tiene tasa definida, se usa la tasa global de la cuenta de inversion.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a37" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload as {
                      label: string;
                      total: number;
                      principal: number;
                      gain: number;
                      breakdown: { label: string; total: number; gain: number; principal: number }[];
                    };
                    return (
                      <div className="rounded-xl border border-border bg-slate-900 text-white p-3 text-xs shadow-xl">
                        <p className="text-[10px] uppercase tracking-widest text-slate-300">{data.label}</p>
                        <p className="text-sm font-bold mt-1">{formatCurrency(data.total, selectedInvestment.currency)}</p>
                        <div className="mt-2 space-y-1 text-slate-300">
                          <p>Capital: {formatCurrency(data.principal, selectedInvestment.currency)}</p>
                          <p>Ganancia: {formatCurrency(data.gain, selectedInvestment.currency)}</p>
                        </div>
                        {data.breakdown?.length > 0 && (
                          <div className="mt-2 border-t border-white/10 pt-2 space-y-1">
                            {data.breakdown.map(item => (
                              <div key={item.label} className="flex items-center justify-between gap-3">
                                <span className="text-slate-300">{item.label}</span>
                                <span className="font-semibold">{formatCurrency(item.total, selectedInvestment.currency)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                />
                <Bar dataKey="principal" stackId="total" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gain" stackId="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {selectedSnapshots.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Historial mensual</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {selectedSnapshots.map(snapshot => (
                  <div key={snapshot.id} className="bg-white/60 dark:bg-black/20 rounded-xl p-3 border border-border">
                    <p className="text-xs font-bold text-slate-500">{new Date(snapshot.snapshot_date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {formatCurrency(Number(snapshot.balance || 0), selectedInvestment.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <AnimatePresence>
        {showSavingsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSavingsModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface rounded-[2rem] p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingSavings ? 'Editar cuenta de ahorro' : 'Nueva cuenta de ahorro'}
              </h3>
              {editingSavings && (
                <p className="text-xs text-slate-500">
                  Saldo actual: {formatCurrency(Number(editingSavings.current_balance || 0), editingSavings.currency)}
                </p>
              )}
              <input
                className="w-full px-4 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20"
                placeholder="Nombre"
                value={savingsForm.name}
                onChange={(e) => setSavingsForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <PremiumDropdown
                  value={savingsForm.currency}
                  onChange={(value) => setSavingsForm(prev => ({ ...prev, currency: value }))}
                  groups={[
                    {
                      title: 'Monedas',
                      options: [
                        { id: 'ARS', label: 'ARS' },
                        { id: 'USD', label: 'USD' },
                        { id: 'EUR', label: 'EUR' }
                      ]
                    }
                  ]}
                  className="w-full"
                />
                <input
                  className="px-3 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20"
                  type="number"
                  placeholder="Saldo inicial"
                  value={savingsForm.balance}
                  onChange={(e) => setSavingsForm(prev => ({ ...prev, balance: e.target.value }))}
                />
              </div>
              {editingSavings && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aporte adicional</label>
                  <input
                    className="w-full px-4 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20"
                    type="number"
                    placeholder="Sumar saldo"
                    value={savingsTopUp}
                    onChange={(e) => setSavingsTopUp(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500">
                    Saldo resultante: {formatCurrency(Number(savingsForm.balance || 0) + Number(savingsTopUp || 0), savingsForm.currency as Currency)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={handleCloseSavingsModal} className="px-4 py-2 rounded-xl text-slate-500">Cancelar</button>
                <button onClick={handleSaveSavings} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBalanceRateModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBalanceRateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface rounded-[2rem] p-6 w-full max-w-sm space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurar tasa remunerada</h3>
              <p className="text-xs text-slate-500">
                Defini la tasa APY anual de tu cuenta remunerada. Se capitaliza automaticamente todos los dias.
              </p>
              <div className="flex items-center gap-3">
                <input
                  className="w-full px-4 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20"
                  type="number"
                  placeholder="Ej: 22"
                  value={balanceApyInput}
                  onChange={(e) => setBalanceApyInput(e.target.value)}
                />
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowBalanceRateModal(false)} className="px-4 py-2 rounded-xl text-slate-500">Cancelar</button>
                <button onClick={handleSaveBalanceRate} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvestmentModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvestmentModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface rounded-[2rem] p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingInvestment ? 'Editar inversión' : 'Nueva inversión'}</h3>
              {investmentError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-bold">
                  {investmentError}
                </div>
              )}
              {editingInvestment?.source_savings_account_id && (
                <div className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                  Origen: {savingsNameMap.get(editingInvestment.source_savings_account_id) || 'Cuenta de ahorro'}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="px-3 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20 md:col-span-2"
                  placeholder="Nombre"
                  value={investmentForm.name}
                  onChange={(e) => setInvestmentForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <PremiumDropdown
                  value={investmentForm.currency}
                  onChange={(value) => setInvestmentForm(prev => ({ ...prev, currency: value }))}
                  groups={[
                    {
                      title: 'Monedas',
                      options: [
                        { id: 'ARS', label: 'ARS' },
                        { id: 'USD', label: 'USD' },
                        { id: 'EUR', label: 'EUR' }
                      ]
                    }
                  ]}
                  className="w-full"
                  disabled={!editingInvestment && !!investmentForm.sourceSavingsId}
                />
                <div className="md:col-span-2">
                  <PremiumDropdown
                    value={investmentForm.sourceSavingsId}
                    onChange={(value) => {
                      const source = savingsMap.get(value);
                      setInvestmentForm(prev => ({
                        ...prev,
                        sourceSavingsId: value,
                        currency: source ? source.currency : prev.currency
                      }));
                    }}
                    groups={[
                      {
                        title: 'Cuenta de ahorro',
                        options: accounts.map(account => ({
                          id: account.id,
                          label: account.name
                        }))
                      }
                    ]}
                    placeholder="Seleccioná cuenta de ahorro"
                    className="w-full"
                    disabled={!!editingInvestment}
                  />
                </div>
                {!editingInvestment && accounts.length === 0 && (
                  <div className="text-xs text-slate-500 md:col-span-3">
                    Necesitás crear una cuenta de ahorro antes de invertir.
                  </div>
                )}
                {!editingInvestment && investmentForm.sourceSavingsId && (
                  <div className="text-xs text-slate-500 md:col-span-3">
                    Disponible: {formatCurrency(Number(savingsMap.get(investmentForm.sourceSavingsId)?.current_balance || 0), savingsMap.get(investmentForm.sourceSavingsId)?.currency || 'ARS')}
                  </div>
                )}
                <input
                  className="px-3 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20"
                  type="number"
                  placeholder={editingInvestment ? 'Balance actual' : 'Monto a transferir'}
                  value={investmentForm.balance}
                  onChange={(e) => setInvestmentForm(prev => ({ ...prev, balance: e.target.value }))}
                  disabled={!!editingInvestment}
                />
                {editingInvestment && (
                  <div className="text-xs text-slate-500 md:col-span-3">
                    El saldo actual no se edita directamente. Usá aportes o retiros desde el ahorro.
                  </div>
                )}
                <input
                  className="px-3 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20"
                  type="number"
                  placeholder="Retorno cuenta (%)"
                  value={investmentForm.returnRate}
                  onChange={(e) => setInvestmentForm(prev => ({ ...prev, returnRate: e.target.value }))}
                />
                <PremiumDropdown
                  value={investmentForm.returnPeriod}
                  onChange={(value) => setInvestmentForm(prev => ({ ...prev, returnPeriod: value as RatePeriod }))}
                  groups={[
                    {
                      title: 'Periodo',
                      options: [
                        { id: 'annual', label: 'Anual' },
                        { id: 'monthly', label: 'Mensual' },
                        { id: 'daily', label: 'Diario' }
                      ]
                    }
                  ]}
                  className="w-full"
                />
              </div>

              {editingInvestment && editingInvestment.source_savings_account_id && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-border">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Aportar desde ahorro</p>
                    <p className="text-[10px] text-slate-500 mb-3">
                      Disponible: {formatCurrency(Number(savingsMap.get(editingInvestment.source_savings_account_id)?.current_balance || 0), savingsMap.get(editingInvestment.source_savings_account_id)?.currency || 'ARS')}
                    </p>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        className="px-3 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20 flex-1"
                        type="number"
                        placeholder="Monto a transferir"
                        value={investmentTopUp}
                        onChange={(e) => setInvestmentTopUp(e.target.value)}
                      />
                      <button
                        onClick={handleInvestmentTopUp}
                        className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 font-bold text-xs uppercase tracking-widest border border-blue-500/20"
                      >
                        Transferir
                      </button>
                    </div>
                    {investmentTopUpError && (
                      <p className="text-[10px] text-rose-500 font-bold mt-2">{investmentTopUpError}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-border">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Retirar a ahorro</p>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        className="px-3 py-2 rounded-xl border border-border bg-white/60 dark:bg-black/20 flex-1"
                        type="number"
                        placeholder="Monto a retirar"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <button
                        onClick={handleWithdraw}
                        className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase tracking-widest border border-emerald-500/20"
                      >
                        Retirar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Activos</p>
                  <button
                    onClick={() => setAssetRows(prev => [...prev, { id: `tmp-${Date.now()}`, investment_account_id: editingInvestment?.id || '', asset_name: '', allocated_amount: 0 } as InvestmentAsset])}
                    className="text-xs font-black text-blue-500"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {assetRows.map((asset, idx) => (
                    <div key={asset.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-white/60 dark:bg-black/20 rounded-xl p-3">
                      <input
                        className="px-2 py-1 rounded-lg border border-border bg-transparent md:col-span-2"
                        placeholder="Activo"
                        value={asset.asset_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAssetRows(prev => prev.map((row, i) => i === idx ? { ...row, asset_name: value } : row));
                        }}
                      />
                      <input
                        className="px-2 py-1 rounded-lg border border-border bg-transparent"
                        type="number"
                        placeholder="Monto"
                        value={asset.allocated_amount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setAssetRows(prev => prev.map((row, i) => i === idx ? { ...row, allocated_amount: value } : row));
                        }}
                      />
                      <input
                        className="px-2 py-1 rounded-lg border border-border bg-transparent"
                        type="number"
                        placeholder="Retorno %"
                        value={asset.expected_return_value || ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setAssetRows(prev => prev.map((row, i) => i === idx ? { ...row, expected_return_value: value } : row));
                        }}
                      />
                      <PremiumDropdown
                        value={asset.expected_return_period || 'annual'}
                        onChange={(value) => {
                          const period = value as RatePeriod;
                          setAssetRows(prev => prev.map((row, i) => i === idx ? { ...row, expected_return_period: period } : row));
                        }}
                        groups={[
                          {
                            title: 'Periodo',
                            options: [
                              { id: 'annual', label: 'Anual' },
                              { id: 'monthly', label: 'Mensual' },
                              { id: 'daily', label: 'Diario' }
                            ]
                          }
                        ]}
                        className="w-full"
                      />
                      <button
                        onClick={() => setAssetRows(prev => prev.filter((_, i) => i !== idx))}
                        className="flex items-center justify-center rounded-lg border border-red-500/20 text-red-500 hover:text-red-600 hover:border-red-500/40 transition-colors"
                        title="Eliminar activo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowInvestmentModal(false)} className="px-4 py-2 rounded-xl text-slate-500">Cancelar</button>
                <button onClick={handleSaveInvestment} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PremiumConfirmModal
        isOpen={deleteSavingsConfirm.isOpen}
        title="Eliminar cuenta de ahorro"
        message="Esta accion eliminara la cuenta de ahorro y no se puede deshacer. Si tenes inversiones asociadas, primero transferi o cerralas."
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteSavingsConfirm.id) {
            await deleteSavingsAccount(deleteSavingsConfirm.id);
          }
          setDeleteSavingsConfirm({ isOpen: false, id: null });
        }}
        onCancel={() => setDeleteSavingsConfirm({ isOpen: false, id: null })}
      />

      <PremiumConfirmModal
        isOpen={deleteInvestmentConfirm.isOpen}
        title="Eliminar cuenta de inversion"
        message="Esta accion eliminara la cuenta de inversion y no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteInvestmentConfirm.id) {
            await deleteInvestmentAccount(deleteInvestmentConfirm.id);
          }
          setDeleteInvestmentConfirm({ isOpen: false, id: null });
        }}
        onCancel={() => setDeleteInvestmentConfirm({ isOpen: false, id: null })}
      />

      {isRefreshing && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 border border-border shadow-xl">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Actualizando proyecciones...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;
