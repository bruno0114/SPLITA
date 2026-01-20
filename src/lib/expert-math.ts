
/**
 * expert-math.ts
 * World-class financial algorithms for Splita.
 */

interface Transaction {
    amount: number;
    payerId: string;
    splits: { userId: string; amount: number }[];
}

interface Member {
    id: string;
    name: string;
}

/**
 * Simplifies debts between a group of people.
 * Reduces the total number of transactions needed to settle.
 */
export const simplifyDebts = (balances: Record<string, number>, members: Member[]) => {
    // 1. Identify Debtors and Creditors
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, balance]) => {
        if (balance < 0) {
            debtors.push({ id, amount: Math.abs(balance) });
        } else if (balance > 0) {
            creditors.push({ id, amount: balance });
        }
    });

    // Sort to optimize matching (optional but good)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions: { from: string; to: string; amount: number }[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0.01) { // Ignore tiny fractions
            transactions.push({
                from: debtor.id,
                to: creditor.id,
                amount: Math.round(amount * 100) / 100
            });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return transactions;
};

/**
 * Expenditure projection formula:
 * (Current Spent / Days Elapsed) * Total Days in Month
 */
export const projectMonthlySpending = (currentSpent: number, daysElapsed: number, totalDays: number) => {
    if (daysElapsed === 0) return currentSpent;
    return (currentSpent / daysElapsed) * totalDays;
};

/**
 * Accurate rounding that assigns the centavo difference to the payer
 * or a specific member to ensure the sum is exactly the total.
 */
export const splitEqually = (total: number, memberCount: number) => {
    const base = Math.floor((total / memberCount) * 100) / 100;
    const remainder = Math.round((total - base * memberCount) * 100) / 100;

    return {
        base,
        remainder
    };
};
