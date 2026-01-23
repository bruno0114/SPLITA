
import React from 'react';
import { TrendingUp, Calendar, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { projectMonthlySpending } from '@/lib/expert-math';

interface ProjectionCardProps {
    currentSpent: number;
    budget?: number;
}

import ProjectionsModal from './ProjectionsModal';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

const ProjectionCard: React.FC<ProjectionCardProps> = ({ currentSpent, budget = 500000 }) => {
    const [showModal, setShowModal] = React.useState(false);
    const today = new Date();
    const daysElapsed = today.getDate();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const projection = projectMonthlySpending(currentSpent, daysElapsed, totalDays);

    const progress = Math.min((currentSpent / projection) * 100, 100);
    const budgetProgress = Math.min((projection / budget) * 100, 100);
    const isOverBudget = projection > budget;

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
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                <AnimatedPrice amount={projection} showCode />
                            </h3>
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
                                <span>{Math.round(currentSpent / daysElapsed).toLocaleString('es-AR')} / día</span>
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
                    currentMonthlySavings={Math.max(0, budget - currentSpent)}
                />
            )}
        </>
    );
};

export default ProjectionCard;
