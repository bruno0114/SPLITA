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
        // 1. Filter only expenses (if type is present)
        const expenses = transactions.filter(t => !t.type || t.type === 'expense');

        // 2. Calculate Total
        const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

        // 3. Group by Category
        const categoryMap = new Map<string, { amount: number; count: number }>();

        expenses.forEach(t => {
            // Normalize category name or use 'varios'
            const catName = t.category || 'varios';
            const config = getCategoryConfig(catName);
            // We use the label from config as the key to group "Supermercado" and "super" together if mapped same
            // Actually getCategoryConfig returns the config object. We need a stable key.
            // Let's use the label as the stable key for grouping display, 
            // but we might want to group by the 'key' in CATEGORY_CONFIG.
            // Since getCategoryConfig returns the object directly, we don't know the key.
            // Let's rely on the config properties.

            const key = config.label; // Group by the Display Label (e.g. "Supermercado")

            const current = categoryMap.get(key) || { amount: 0, count: 0 };
            categoryMap.set(key, {
                amount: current.amount + Number(t.amount),
                count: current.count + 1
            });
        });

        // 4. Transform to Array
        const result: CategoryStat[] = [];

        categoryMap.forEach((value, key) => {
            const config = getCategoryConfig(key); // Re-fetch config using the label (should match self)

            result.push({
                id: key,
                label: config.label,
                amount: value.amount,
                percentage: totalExpense === 0 ? 0 : Math.round((value.amount / totalExpense) * 100),
                count: value.count,
                icon: config.icon, // String name of icon
                color: config.color,
                bg: config.bg
            });
        });

        // 5. Sort by Amount Descending
        return {
            totalExpense,
            categories: result.sort((a, b) => b.amount - a.amount)
        };

    }, [transactions]);

    return stats;
};
