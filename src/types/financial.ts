/**
 * financial.ts
 * Unified financial types for consistent data handling across the app.
 *
 * These types replace the fragmented Transaction/PersonalTransaction dichotomy
 * with a single normalized structure that works for both personal and group data.
 */

/**
 * Reference to a category with ID-based lookup.
 */
export interface CategoryRef {
    id: string;           // Canonical ID (key in CATEGORY_CONFIG)
    label: string;        // Display name
    icon: string;         // Icon component name
    color: string;        // Tailwind text color class
    bg: string;           // Tailwind bg color class
}

/**
 * Unified transaction type for both personal and group split transactions.
 * All financial calculations should use this type.
 */
export interface NormalizedTransaction {
    // Identifiers
    id: string;                           // Unique ID (prefixed for splits: "split-{txId}")
    sourceId: string;                     // Original DB record ID
    source: 'personal' | 'group_split';   // Data source indicator

    // Core financial data
    title: string;
    amount: number;                       // ALWAYS user's portion, in ARS
    type: 'income' | 'expense';
    date: string;                         // ISO date string
    category: CategoryRef;                // Resolved category with ID

    // Contextual info
    paymentMethod: string | null;
    payer?: {
        id: string;
        name: string;
        avatar?: string;
    };

    // Currency metadata (stored for display, not calculation)
    originalAmount?: number;
    originalCurrency?: string;
    exchangeRateAtCreation?: number;

    // Flags
    isRecurring?: boolean;
    recurringPattern?: string | null;
    isGroupSplit: boolean;
    groupName?: string;
}

/**
 * Financial summary computed from transactions.
 */
export interface FinancialSummary {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
    totalCount: number;
}

/**
 * Category statistics for analytics.
 */
export interface CategoryStat {
    id: string;              // Category ID
    label: string;           // Display label
    amount: number;          // Total expense amount
    percentage: number;      // Percentage of total expenses
    count: number;           // Total transaction count
    expenseCount: number;    // Expense transaction count
    incomeCount: number;     // Income transaction count
    icon: string;
    color: string;
    bg: string;
}

/**
 * Input type for analytics hooks that need minimal transaction data.
 * Used to bridge legacy types to new normalized system.
 */
export interface AnalyticsTransaction {
    id: string;
    amount: number;
    category: string | null;
    date: string;
    type?: 'income' | 'expense';
}

/**
 * Error states for financial data operations.
 */
export type FinancialErrorCode =
    | 'SESSION_EXPIRED'
    | 'NETWORK_ERROR'
    | 'PERMISSION_DENIED'
    | 'UNKNOWN_ERROR';

/**
 * Type guard to check if a transaction is a group split.
 */
export const isGroupSplit = (tx: NormalizedTransaction): boolean => {
    return tx.source === 'group_split' || tx.isGroupSplit;
};

/**
 * Type guard to check if an amount is valid (not NaN or Infinity).
 */
export const isValidAmount = (amount: number): boolean => {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount);
};
