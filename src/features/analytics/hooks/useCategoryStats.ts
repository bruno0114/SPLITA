import { useMemo } from 'react';
import { CATEGORY_CONFIG } from '@/lib/constants';
import { resolveOrPassthrough } from '@/lib/category-resolver';
import { Category } from '@/types/index';

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

export const useCategoryStats = (
    transactions: AnalyticsTransaction[],
    customCategories?: Category[]
) => {
    const normalizeCategory = (input: string) => input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const stats = useMemo(() => {
        const customNameMap = new Map<string, string>();
        customCategories?.forEach(cat => {
            if (!cat.is_system) {
                customNameMap.set(normalizeCategory(cat.name), cat.name);
            }
        });
        // 1. Calculate Total Expenses (for percentage calculation)
        const expenses = transactions.filter(t => !t.type || t.type === 'expense');
        const incomes = transactions.filter(t => t.type === 'income');
        const totalExpense = expenses.reduce((sum, t) => {
            const amt = Number(t.amount);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
        const totalIncome = incomes.reduce((sum, t) => {
            const amt = Number(t.amount);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);

        // 2. Group by Category ID (not label) for consistency
        const categoryMap = new Map<string, CategoryAccumulator>();

        // Pre-populate with all system category IDs
        Object.keys(CATEGORY_CONFIG).forEach(categoryId => {
            categoryMap.set(categoryId, { expenseAmount: 0, incomeAmount: 0, expenseCount: 0, incomeCount: 0 });
        });

        // Also pre-populate with custom user categories (by name, not system ID)
        customCategories?.forEach(cat => {
            if (!cat.is_system && !categoryMap.has(cat.name)) {
                categoryMap.set(cat.name, { expenseAmount: 0, incomeAmount: 0, expenseCount: 0, incomeCount: 0 });
            }
        });

        // Accumulate transactions by resolved category
        // Uses resolveOrPassthrough: system categories resolve to ID, custom categories passthrough by name
        transactions.forEach(t => {
            const resolvedId = resolveOrPassthrough(t.category);
            const isSystemCategory = resolvedId in CATEGORY_CONFIG;
            const categoryId = isSystemCategory
                ? resolvedId
                : (customNameMap.get(normalizeCategory(resolvedId)) || resolvedId);

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
            // Check if it's a system category first
            const systemConfig = CATEGORY_CONFIG[categoryId];

            if (systemConfig) {
                // System category - use config
                const displayAmount = value.expenseAmount > 0 ? value.expenseAmount : value.incomeAmount;
                const percentageBase = value.expenseAmount > 0 ? totalExpense : totalIncome;

                result.push({
                    id: categoryId,
                    label: systemConfig.label,
                    amount: displayAmount,
                    percentage: percentageBase === 0 ? 0 : Math.round((displayAmount / percentageBase) * 100),
                    count: value.expenseCount + value.incomeCount,
                    expenseCount: value.expenseCount,
                    incomeCount: value.incomeCount,
                    icon: systemConfig.icon,
                    color: systemConfig.color,
                    bg: systemConfig.bg
                });
            } else {
                // Custom category - look up in customCategories by name
                const customConfig = customCategories?.find(c => c.name === categoryId);
                if (customConfig) {
                    const displayAmount = value.expenseAmount > 0 ? value.expenseAmount : value.incomeAmount;
                    const percentageBase = value.expenseAmount > 0 ? totalExpense : totalIncome;

                    result.push({
                        id: categoryId,
                        label: customConfig.name,
                        amount: displayAmount,
                        percentage: percentageBase === 0 ? 0 : Math.round((displayAmount / percentageBase) * 100),
                        count: value.expenseCount + value.incomeCount,
                        expenseCount: value.expenseCount,
                        incomeCount: value.incomeCount,
                        icon: customConfig.icon,
                        color: customConfig.color,
                        bg: customConfig.bg_color
                    });
                }
            }
        });

        return {
            totalExpense,
            categories: result.sort((a, b) => b.amount - a.amount)
        };

    }, [transactions, customCategories]);

    return stats;
};
