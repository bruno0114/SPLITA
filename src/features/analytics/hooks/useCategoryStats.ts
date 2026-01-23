import { useMemo } from 'react';
import { CATEGORY_CONFIG, CategoryConfig } from '@/lib/constants';
import { resolveCategoryId, getCategoryConfigById } from '@/lib/category-resolver';

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
    expenseCount: number;
    incomeCount: number;
    icon: string;
    color: string;
    bg: string;
}

interface CategoryAccumulator {
    expenseAmount: number;
    incomeAmount: number;
    expenseCount: number;
    incomeCount: number;
}

export const useCategoryStats = (transactions: AnalyticsTransaction[]) => {
    const stats = useMemo(() => {
        // 1. Calculate Total Expenses (for percentage calculation)
        const expenses = transactions.filter(t => !t.type || t.type === 'expense');
        const totalExpense = expenses.reduce((sum, t) => {
            const amt = Number(t.amount);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);

        // 2. Group by Category ID (not label) for consistency
        const categoryMap = new Map<string, CategoryAccumulator>();

        // Pre-populate with all official category IDs to ensure they all appear in the UI
        Object.keys(CATEGORY_CONFIG).forEach(categoryId => {
            categoryMap.set(categoryId, { expenseAmount: 0, incomeAmount: 0, expenseCount: 0, incomeCount: 0 });
        });

        // Accumulate transactions by resolved category ID
        transactions.forEach(t => {
            // Use ID-based resolution for consistent grouping
            const categoryId = resolveCategoryId(t.category);

            const current = categoryMap.get(categoryId) || { expenseAmount: 0, incomeAmount: 0, expenseCount: 0, incomeCount: 0 };
            const amt = Number(t.amount);
            const validAmount = isNaN(amt) ? 0 : amt;

            if (!t.type || t.type === 'expense') {
                current.expenseAmount += validAmount;
                current.expenseCount += 1;
            } else {
                current.incomeAmount += validAmount;
                current.incomeCount += 1;
            }

            categoryMap.set(categoryId, current);
        });

        // 3. Transform to Array with proper typing
        const result: CategoryStat[] = [];

        categoryMap.forEach((value, categoryId) => {
            const config = getCategoryConfigById(categoryId);

            result.push({
                id: categoryId,  // Use category ID, not label
                label: config.label,
                amount: value.expenseAmount,
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
