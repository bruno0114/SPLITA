import React from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

interface ProjectionsModalProps {
    onClose: () => void;
    summary: {
        projectedIncome: number;
        projectedExpense: number;
        projectedNet: number;
        averageIncome: number;
        averageExpense: number;
        averageNet: number;
        currentIncome: number;
        currentExpense: number;
        currentNet: number;
        usesFallback: boolean;
        history: {
            label: string;
            income: number;
            expense: number;
            net: number;
        }[];
    };
}

const ProjectionsModal: React.FC<ProjectionsModalProps> = ({ onClose, summary }) => {
    const maxValue = Math.max(
        ...summary.history.flatMap(item => [item.income, item.expense]),
        summary.projectedIncome,
        summary.projectedExpense,
        1
    );

    const incomeDelta = summary.currentIncome - summary.averageIncome;
    const expenseDelta = summary.currentExpense - summary.averageExpense;
    const netDelta = summary.currentNet - summary.averageNet;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-surface rounded-[32px] overflow-hidden shadow-2xl border border-border max-h-[85vh]"
            >
                <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-visible">
                    <div className="w-full md:w-1/3 bg-slate-50 dark:bg-black/20 p-6 border-b md:border-b-0 md:border-r border-border flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Proyección mensual</p>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Resumen real</h3>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {summary.usesFallback && (
                            <div className="text-[10px] uppercase tracking-widest text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                                Basado en el mes actual por falta de historial.
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="bg-white/80 dark:bg-white/5 rounded-2xl p-3 border border-border">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos promedio</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                    <AnimatedPrice amount={summary.averageIncome} />
                                </p>
                            </div>
                            <div className="bg-white/80 dark:bg-white/5 rounded-2xl p-3 border border-border">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gastos promedio</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                    <AnimatedPrice amount={summary.averageExpense} />
                                </p>
                            </div>
                            <div className="bg-white/80 dark:bg-white/5 rounded-2xl p-3 border border-border">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neto promedio</p>
                                <p className={`text-lg font-black mt-1 ${summary.averageNet >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    <AnimatedPrice amount={summary.averageNet} />
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 md:p-8 bg-surface">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Mes actual vs promedio
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-white/60 dark:bg-black/20 rounded-2xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Ingresos</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                        <AnimatedPrice amount={summary.currentIncome} />
                                    </p>
                                    <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${incomeDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {incomeDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        <AnimatedPrice amount={incomeDelta} />
                                    </p>
                                </div>
                                <div className="bg-white/60 dark:bg-black/20 rounded-2xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Gastos</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                        <AnimatedPrice amount={summary.currentExpense} />
                                    </p>
                                    <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${expenseDelta <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {expenseDelta <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                        <AnimatedPrice amount={expenseDelta} />
                                    </p>
                                </div>
                                <div className="bg-white/60 dark:bg-black/20 rounded-2xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Neto</p>
                                    <p className={`text-sm font-black mt-1 ${summary.currentNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <AnimatedPrice amount={summary.currentNet} />
                                    </p>
                                    <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${netDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {netDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        <AnimatedPrice amount={netDelta} />
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                Historial reciente
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {summary.history.map((item) => {
                                    const incomeHeight = (item.income / maxValue) * 100;
                                    const expenseHeight = (item.expense / maxValue) * 100;
                                    return (
                                        <div key={item.label} className="bg-white/60 dark:bg-black/20 rounded-2xl p-3 border border-border">
                                            <div className="flex items-end gap-2 h-24">
                                                <div className="flex flex-col items-center gap-1 flex-1">
                                                    <div className="w-4 bg-emerald-500/70 rounded-t" style={{ height: `${incomeHeight}%` }} />
                                                    <span className="text-[9px] uppercase text-slate-400">Ing</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 flex-1">
                                                    <div className="w-4 bg-rose-500/70 rounded-t" style={{ height: `${expenseHeight}%` }} />
                                                    <span className="text-[9px] uppercase text-slate-400">Gas</span>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                                                <p className={`text-xs font-bold mt-1 ${item.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    <AnimatedPrice amount={item.net} />
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProjectionsModal;
