import { useMemo, useState, useEffect } from 'react';
import { usePersonalTransactions } from './usePersonalTransactions';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getDailyAdvice } from '@/services/ai';

export interface EconomicHealthData {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    statusLabel: string;
    savingsRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    transactionCount: number;
    insights: string[];
    aiInsights?: string[];
    isAiLoading?: boolean;
    isAiConfigured?: boolean;
}

export const useEconomicHealth = (): { data: EconomicHealthData; loading: boolean; refreshAdvice: () => Promise<void> } => {
    const { fullTransactions, loading: txLoading } = usePersonalTransactions();
    const { profile, loading: profileLoading } = useProfile();
    const { user } = useAuth();

    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const loading = txLoading || profileLoading;

    // Calculate summary from ALL transactions (no date filtering)
    // This matches the behavior of Categories page for consistency
    const financialSummary = useMemo(() => {
        const income = fullTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expenses = fullTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

        return {
            income,
            expenses,
            count: fullTransactions.length
        };
    }, [fullTransactions]);

    const fetchAIAdvice = async (force: boolean = false) => {
        // Only return if we have absolutely no financial data to analyze
        if (loading || (financialSummary.income === 0 && financialSummary.expenses === 0) || !profile?.gemini_api_key || !user?.id) return;

        setIsAiLoading(true);
        try {
            // Get top 3 categories for context (using fullTransactions for diversity)
            const categoryMap: Record<string, number> = {};
            fullTransactions.filter(t => t.type === 'expense').forEach(t => {
                categoryMap[t.category] = (categoryMap[t.category] || 0) + (t.amount || 0);
            });

            const topCategories = Object.entries(categoryMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([category, amount]) => ({ category, amount }));

            const insights = await getDailyAdvice(
                user.id,
                profile.gemini_api_key,
                {
                    monthlyIncome: financialSummary.income,
                    monthlyExpenses: financialSummary.expenses,
                    savingsRate: Math.round(((financialSummary.income - financialSummary.expenses) / Math.max(1, financialSummary.income)) * 100),
                    topCategories
                },
                force
            );

            setAiInsights(insights);
        } catch (err) {
            console.error("AI Insights failure:", err);
        } finally {
            setIsAiLoading(false);
        }
    };

    // AI Analysis Effect (Auto-load on mount/change with cache)
    useEffect(() => {
        fetchAIAdvice(false);
    }, [financialSummary.income, financialSummary.expenses, profile?.gemini_api_key, loading, user?.id]);

    const data = useMemo(() => {
        // Calculate savings rate based on all financial data
        const savingsRate = financialSummary.income > 0
            ? ((financialSummary.income - financialSummary.expenses) / financialSummary.income) * 100
            : (financialSummary.expenses > 0 ? -100 : 0);

        let score = 0;
        let insights: string[] = [];

        if (savingsRate >= 30) { score += 40; insights.push('Excelente tasa de ahorro (>30%)'); }
        else if (savingsRate >= 20) { score += 35; insights.push('Buena tasa de ahorro (20-30%)'); }
        else if (savingsRate >= 10) { score += 25; insights.push('Tasa de ahorro moderada (10-20%)'); }
        else if (savingsRate > 0) { score += 15; insights.push('Considera aumentar tu ahorro mensual'); }
        else if (savingsRate < 0) { score += 0; insights.push('⚠️ Estás gastando más de lo que ingresás'); }

        const hasIncome = financialSummary.income > 0;
        if (hasIncome) score += 30;
        else insights.push('Registrá tus ingresos para un mejor análisis');

        const hasExpenses = financialSummary.expenses > 0;
        if (hasExpenses && financialSummary.expenses <= financialSummary.income) score += 30;
        else if (hasExpenses) score += 15;
        else { score += 10; insights.push('Empezá a registrar tus gastos'); }

        let status: 'excellent' | 'good' | 'fair' | 'poor';
        let statusLabel: string;
        if (score >= 80) { status = 'excellent'; statusLabel = 'Excelente'; }
        else if (score >= 60) { status = 'good'; statusLabel = 'Muy buena'; }
        else if (score >= 40) { status = 'fair'; statusLabel = 'Regular'; }
        else { status = 'poor'; statusLabel = 'Necesita atención'; }

        if (financialSummary.count === 0) {
            return {
                score: 0, status: 'fair' as const, statusLabel: 'Sin datos',
                savingsRate: 0, monthlyIncome: 0, monthlyExpenses: 0, transactionCount: 0,
                insights: ['Cargá tus primeros movimientos para ver tu score'],
                aiInsights: [], isAiLoading: false
            };
        }

        return {
            score: Math.min(100, Math.max(0, Math.round(score))),
            status,
            statusLabel,
            savingsRate: Math.round(savingsRate),
            monthlyIncome: financialSummary.income,
            monthlyExpenses: financialSummary.expenses,
            transactionCount: financialSummary.count,
            insights: insights.slice(0, 3),
            aiInsights,
            isAiLoading,
            isAiConfigured: !!profile?.gemini_api_key
        };
    }, [fullTransactions, financialSummary, aiInsights, isAiLoading, profile]);

    return { data, loading, refreshAdvice: () => fetchAIAdvice(true) };
};
