import { useMemo, useState, useEffect } from 'react';
import { usePersonalTransactions } from './usePersonalTransactions';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { analyzeFinancialHealth } from '@/services/ai';

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
}

export const useEconomicHealth = (): { data: EconomicHealthData; loading: boolean } => {
    const { transactions, summary, loading } = usePersonalTransactions();
    const { profile } = useProfile();

    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // AI Analysis Effect
    useEffect(() => {
        const fetchAIAdvice = async () => {
            if (loading || !summary.totalIncome || !profile?.gemini_api_key) return;

            setIsAiLoading(true);
            try {
                // Get top 3 categories for context
                const categoryMap: Record<string, number> = {};
                transactions.forEach(t => {
                    if (t.type === 'expense') {
                        categoryMap[t.category] = (categoryMap[t.category] || 0) + (t.amount || 0);
                    }
                });

                const topCategories = Object.entries(categoryMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, amount]) => ({ category, amount }));

                const insights = await analyzeFinancialHealth(profile.gemini_api_key, {
                    monthlyIncome: summary.totalIncome,
                    monthlyExpenses: summary.totalExpenses,
                    savingsRate: Math.round(((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100),
                    topCategories
                });

                setAiInsights(insights);
            } catch (err) {
                console.error("AI Insights failure:", err);
            } finally {
                setIsAiLoading(false);
            }
        };

        fetchAIAdvice();
    }, [summary.totalIncome, summary.totalExpenses, profile?.gemini_api_key, loading]);

    const data = useMemo(() => {
        // Calculate savings rate
        const savingsRate = summary.totalIncome > 0
            ? ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100
            : 0;

        // ... intermediate score logic same as before ...
        let score = 0;
        let insights: string[] = [];

        if (savingsRate >= 30) { score += 40; insights.push('Excelente tasa de ahorro (>30%)'); }
        else if (savingsRate >= 20) { score += 35; insights.push('Buena tasa de ahorro (20-30%)'); }
        else if (savingsRate >= 10) { score += 25; insights.push('Tasa de ahorro moderada (10-20%)'); }
        else if (savingsRate > 0) { score += 15; insights.push('Considera aumentar tu ahorro mensual'); }
        else if (savingsRate < 0) { score += 0; insights.push('⚠️ Estás gastando más de lo que ingresás'); }

        const hasIncome = summary.totalIncome > 0;
        if (hasIncome) score += 30;
        else insights.push('Registrá tus ingresos para un mejor análisis');

        const hasExpenses = transactions.filter(t => t.type === 'expense').length > 0;
        if (hasExpenses && summary.totalExpenses <= summary.totalIncome) score += 30;
        else if (hasExpenses) score += 15;
        else { score += 10; insights.push('Empezá a registrar tus gastos'); }

        let status: 'excellent' | 'good' | 'fair' | 'poor';
        let statusLabel: string;
        if (score >= 80) { status = 'excellent'; statusLabel = 'Excelente'; }
        else if (score >= 60) { status = 'good'; statusLabel = 'Muy buena'; }
        else if (score >= 40) { status = 'fair'; statusLabel = 'Regular'; }
        else { status = 'poor'; statusLabel = 'Necesita atención'; }

        if (transactions.length === 0) {
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
            monthlyIncome: summary.totalIncome,
            monthlyExpenses: summary.totalExpenses,
            transactionCount: transactions.length,
            insights: insights.slice(0, 3),
            aiInsights,
            isAiLoading
        };
    }, [transactions, summary, aiInsights, isAiLoading]);

    return { data, loading };
};
