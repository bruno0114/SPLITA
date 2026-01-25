
import React from 'react';
import { TrendingUp, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { projectMonthlySpending } from '@/lib/expert-math';
import { PersonalTransaction } from '@/types/index';

interface ProjectionCardProps {
    transactions: PersonalTransaction[];
    budget?: number;
}

import ProjectionsModal from './ProjectionsModal';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

const ProjectionCard: React.FC<ProjectionCardProps> = ({ transactions, budget = 500000 }) => {
    const [showModal, setShowModal] = React.useState(false);
    const today = new Date();
    const daysElapsed = today.getDate();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const getMonthTotals = React.useCallback((year: number, month: number) => {
        const totals = transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((acc, t) => {
                const amount = Number(t.amount || 0);
                if (t.type === 'income') acc.income += amount;
                if (t.type === 'expense') acc.expense += amount;
                return acc;
            }, { income: 0, expense: 0 });

        return {
            ...totals,
            net: totals.income - totals.expense
        };
    }, [transactions]);

    const projectionSummary = React.useMemo(() => {
        const currentTotals = getMonthTotals(currentYear, currentMonth);
        const monthHistory = [1, 2, 3].map((offset) => {
            const date = new Date(currentYear, currentMonth - offset, 1);
            const totals = getMonthTotals(date.getFullYear(), date.getMonth());
            return {
                label: date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase(),
                income: totals.income,
                expense: totals.expense,
                net: totals.net
            };
        });

        const monthsWithData = monthHistory.filter(m => m.income > 0 || m.expense > 0).length;
        const usesFallback = monthsWithData < 3;

        if (usesFallback) {
            const projectedIncome = projectMonthlySpending(currentTotals.income, daysElapsed, totalDays);
            const projectedExpense = projectMonthlySpending(currentTotals.expense, daysElapsed, totalDays);
            return {
                projectedIncome,
                projectedExpense,
                projectedNet: projectedIncome - projectedExpense,
                averageIncome: projectedIncome,
                averageExpense: projectedExpense,
                averageNet: projectedIncome - projectedExpense,
                currentIncome: currentTotals.income,
                currentExpense: currentTotals.expense,
                currentNet: currentTotals.net,
                usesFallback: true,
                history: [
                    {
                        label: today.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase(),
                        income: currentTotals.income,
                        expense: currentTotals.expense,
                        net: currentTotals.net
                    }
                ]
            };
        }

        const totalIncome = monthHistory.reduce((sum, m) => sum + m.income, 0);
        const totalExpense = monthHistory.reduce((sum, m) => sum + m.expense, 0);
        const averageIncome = totalIncome / 3;
        const averageExpense = totalExpense / 3;
        const averageNet = averageIncome - averageExpense;

        return {
            projectedIncome: averageIncome,
            projectedExpense: averageExpense,
            projectedNet: averageNet,
            averageIncome,
            averageExpense,
            averageNet,
            currentIncome: currentTotals.income,
            currentExpense: currentTotals.expense,
            currentNet: currentTotals.net,
            usesFallback: false,
            history: monthHistory
        };
    }, [currentMonth, currentYear, daysElapsed, totalDays, getMonthTotals, today]);

    const budgetProgress = Math.min((projectionSummary.projectedExpense / budget) * 100, 100);
    const isOverBudget = projectionSummary.projectedExpense > budget;
    const dailySpend = daysElapsed > 0 ? projectionSummary.currentExpense / daysElapsed : 0;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setShowModal(true)}
                className="relative overflow-hidden group bg-surface/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[32px] p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.02]"
            >
                {/* Background Glow */}
                <div className={`absolute -right-20 -top-20 size-64 blur-[100px] opacity-20 rounded-full transition-colors duration-700 ${isOverBudget ? 'bg-orange-500' : 'bg-blue-500'}`} />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Proyección Mensual
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Gastos proyectados</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                        <AnimatedPrice amount={projectionSummary.projectedExpense} showCode />
                                    </h3>
                                </div>
                                <div className="text-xs font-bold">
                                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Neto proyectado</span>
                                    <div className={projectionSummary.projectedNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                        <AnimatedPrice amount={projectionSummary.projectedNet} showCode />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`size-10 rounded-2xl flex items-center justify-center shadow-lg ${isOverBudget ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-500 shadow-blue-500/20'} text-white`}>
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Progress Visual */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <span>Velocidad de gasto</span>
                                <span>{Math.round(dailySpend).toLocaleString('es-AR')} / día</span>
                            </div>
                            <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(daysElapsed / totalDays) * 100}%` }}
                                    className="h-full bg-slate-300 dark:bg-slate-700 rounded-full relative"
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-1.5 bg-white rounded-full shadow-sm" />
                                </motion.div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <span>Presupuesto total</span>
                                <span className={isOverBudget ? 'text-orange-500' : 'text-emerald-500'}>
                                    {Math.round(budgetProgress)}%
                                </span>
                            </div>
                            <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${budgetProgress}%` }}
                                    className={`h-full rounded-full ${isOverBudget ? 'bg-orange-500' : 'bg-blue-gradient shadow-lg shadow-blue-500/30'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Insight */}
                    <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isOverBudget ? 'bg-orange-500/5 border-orange-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                            {isOverBudget ? (
                                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className={`text-xs font-bold ${isOverBudget ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {isOverBudget
                                        ? "¡Cuidado! Vas a terminar el mes arriba de lo planeado."
                                        : "Venís re bien. Si seguís así, te sobra para un asadito."}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">
                                    Faltan {totalDays - daysElapsed} días para que termine el mes.
                                </p>
                            </div>
                        </div>
                    </div>
            </motion.div>

            {showModal && (
                <ProjectionsModal
                    onClose={() => setShowModal(false)}
                    summary={projectionSummary}
                />
            )}
        </>
    );
};

export default ProjectionCard;
