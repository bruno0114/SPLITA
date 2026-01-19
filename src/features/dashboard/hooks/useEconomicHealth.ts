import { useMemo } from 'react';
import { usePersonalTransactions } from './usePersonalTransactions';

export interface EconomicHealthData {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    statusLabel: string;
    savingsRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    transactionCount: number;
    insights: string[];
}

export const useEconomicHealth = (): { data: EconomicHealthData; loading: boolean } => {
    const { transactions, summary, loading } = usePersonalTransactions();

    const data = useMemo(() => {
        // Calculate savings rate
        const savingsRate = summary.totalIncome > 0
            ? ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100
            : 0;

        // Calculate score based on:
        // 1. Savings rate (40% weight) - Target 20%+
        // 2. Income stability (30% weight) - Having regular income
        // 3. Expense control (30% weight) - Not overspending

        let score = 0;
        let insights: string[] = [];

        // Savings rate component (0-40 points)
        if (savingsRate >= 30) {
            score += 40;
            insights.push('Excelente tasa de ahorro (>30%)');
        } else if (savingsRate >= 20) {
            score += 35;
            insights.push('Buena tasa de ahorro (20-30%)');
        } else if (savingsRate >= 10) {
            score += 25;
            insights.push('Tasa de ahorro moderada (10-20%)');
        } else if (savingsRate > 0) {
            score += 15;
            insights.push('Considera aumentar tu ahorro mensual');
        } else if (savingsRate < 0) {
            score += 0;
            insights.push('⚠️ Estás gastando más de lo que ingresás');
        }

        // Income component (0-30 points)
        const hasIncome = summary.totalIncome > 0;
        if (hasIncome) {
            score += 30;
        } else {
            insights.push('Registrá tus ingresos para un mejor análisis');
        }

        // Expense tracking (0-30 points)
        const hasExpenses = transactions.filter(t => t.type === 'expense').length > 0;
        if (hasExpenses && summary.totalExpenses <= summary.totalIncome) {
            score += 30;
        } else if (hasExpenses) {
            score += 15;
        } else {
            score += 10; // Base points for having the app
            insights.push('Empezá a registrar tus gastos');
        }

        // Determine status
        let status: 'excellent' | 'good' | 'fair' | 'poor';
        let statusLabel: string;

        if (score >= 80) {
            status = 'excellent';
            statusLabel = 'Excelente';
        } else if (score >= 60) {
            status = 'good';
            statusLabel = 'Muy buena';
        } else if (score >= 40) {
            status = 'fair';
            statusLabel = 'Regular';
        } else {
            status = 'poor';
            statusLabel = 'Necesita atención';
        }

        // If no data at all, set neutral state
        if (transactions.length === 0) {
            return {
                score: 0,
                status: 'fair' as const,
                statusLabel: 'Sin datos',
                savingsRate: 0,
                monthlyIncome: 0,
                monthlyExpenses: 0,
                transactionCount: 0,
                insights: ['Cargá tus primeros movimientos para ver tu score']
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
            insights: insights.slice(0, 3) // Max 3 insights
        };
    }, [transactions, summary]);

    return { data, loading };
};
