import { useMemo } from 'react';
import { getCategoryConfig } from '@/lib/constants';

export interface AnalyticsTransaction {
    id: string;
    amount: number;
    category: string | null;
    date: string;
    type?: 'income' | 'expense';
}

export interface CategoryStat {
    id: string;
    label: string;
    amount: number;
    percentage: number;
    count: number;
    icon: string;
    color: string;
    bg: string;
}

export const useCategoryStats = (transactions: AnalyticsTransaction[]) => {
    const stats = useMemo(() => {
        // 1. Calculate Total Expenses (for display purposes)
        const expenses = transactions.filter(t => !t.type || t.type === 'expense');
        const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

        // 2. Group by Category
        const categoryMap = new Map<string, { expenseAmount: number; incomeAmount: number; expenseCount: number; incomeCount: number }>();

        transactions.forEach(t => {
            const catName = t.category || 'varios';
            const config = getCategoryConfig(catName);
            const key = config.label;

            const current = categoryMap.get(key) || { expenseAmount: 0, incomeAmount: 0, expenseCount: 0, incomeCount: 0 };

            if (!t.type || t.type === 'expense') {
                current.expenseAmount += Number(t.amount);
                current.expenseCount += 1;
            } else {
                current.incomeAmount += Number(t.amount);
                current.incomeCount += 1;
            }

            categoryMap.set(key, current);
        });

        // 3. Transform to Array
        const result: any[] = [];

        categoryMap.forEach((value, key) => {
            const config = getCategoryConfig(key);

            result.push({
                id: key,
                label: config.label,
                amount: value.expenseAmount, // Use expense amount as primary
                percentage: totalExpense === 0 ? 0 : Math.round((value.expenseAmount / totalExpense) * 100),
                count: value.expenseCount + value.incomeCount,
                expenseCount: value.expenseCount,
                incomeCount: value.incomeCount,
                icon: config.icon,
                color: config.color,
                bg: config.bg
            });
        });

        return {
            totalExpense,
            categories: result.sort((a, b) => b.amount - a.amount)
        };

    }, [transactions]);

    return stats;
};
