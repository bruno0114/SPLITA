import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertTriangle, Wallet, Lock, LineChart, Sparkles } from 'lucide-react';

interface ProjectionsModalProps {
    onClose: () => void;
    currentMonthlySavings: number;
}

const ProjectionsModal: React.FC<ProjectionsModalProps> = ({ onClose, currentMonthlySavings }) => {
    const [strategy, setStrategy] = useState<'conservative' | 'aggressive'>('conservative');
    const [monthlyContribution, setMonthlyContribution] = useState(currentMonthlySavings.toString());
    const [initialCapital, setInitialCapital] = useState('');

    const calculateCompoundInterest = (p: number, r: number, t: number, pmt: number) => {
        // A = P(1 + r/n)^(nt) + PMT * (((1 + r/n)^(nt) - 1) / (r/n))
        // Assuming n=12 (monthly compounding)
        const n = 12;
        const rate = r / 100;
        const principal = p * Math.pow(1 + rate / n, n * t);
        const contributions = pmt * ((Math.pow(1 + rate / n, n * t) - 1) / (rate / n));
        return principal + contributions;
    };

    const projections = useMemo(() => {
        const p = parseFloat(initialCapital) || 0;
        const pmt = parseFloat(monthlyContribution) || 0;
        // Conservative: S&P 500 avg (8%)
        // Aggressive: Crypto/Tech blend (14%)
        const rate = strategy === 'conservative' ? 8 : 14;

        return [1, 5, 10, 20].map(years => ({
            years,
            amount: calculateCompoundInterest(p, rate, years, pmt)
        }));
    }, [initialCapital, monthlyContribution, strategy]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                className="relative w-full max-w-2xl bg-surface rounded-[32px] overflow-hidden shadow-2xl border border-border flex flex-col md:flex-row"
            >

                {/* Sidebar / Controls */}
                <div className="w-full md:w-1/3 bg-slate-50 dark:bg-black/20 p-6 border-b md:border-b-0 md:border-r border-border flex flex-col">
                    <div className="flex justify-between items-center mb-6 md:hidden">
                        <h3 className="font-black text-lg">Proyección</h3>
                        <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Ahorro Mensual</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 pl-8 pr-4 font-black shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Capital Inicial</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={initialCapital}
                                    onChange={(e) => setInitialCapital(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 pl-8 pr-4 font-black shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Estrategia</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setStrategy('conservative')}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${strategy === 'conservative' ? 'bg-white dark:bg-slate-700 shadow text-blue-500' : 'text-slate-500'}`}
                                >
                                    Conservador
                                </button>
                                <button
                                    onClick={() => setStrategy('aggressive')}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${strategy === 'aggressive' ? 'bg-white dark:bg-slate-700 shadow text-purple-500' : 'text-slate-500'}`}
                                >
                                    Agresivo
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
                                {strategy === 'conservative'
                                    ? "Based on S&P 500 historical avg (8%). Safe & steady."
                                    : "Focus on Tech/Crypto (14%). High risk, high reward."}
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:block mt-6">
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                {/* Visualization Area */}
                <div className="flex-1 p-8 bg-surface relative overflow-hidden">
                    <div className={`absolute -right-20 -top-20 size-96 blur-[120px] opacity-20 rounded-full pointer-events-none transition-colors duration-1000 ${strategy === 'conservative' ? 'bg-blue-500' : 'bg-purple-500'}`} />

                    <div className="relative z-10 h-full flex flex-col">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                                Futuro Financiero
                                {strategy === 'aggressive' && <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                Proyección estimada usando interés compuesto.
                                <span className="block mt-1 text-xs opacity-70">*No es asesoramiento financiero.</span>
                            </p>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {projections.map((proj, i) => (
                                <motion.div
                                    key={proj.years}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-slate-50 dark:bg-white/5 border border-border p-4 rounded-2xl flex flex-col justify-between group hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
                                            {proj.years === 20 ? <Wallet className="w-4 h-4 text-emerald-500" /> : <LineChart className="w-4 h-4 text-slate-400" />}
                                        </div>
                                        <span className="text-xs font-black text-slate-300 uppercase">
                                            {proj.years} {proj.years === 1 ? 'Año' : 'Años'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                            ${proj.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                                            Total aportado: ${((parseFloat(initialCapital) || 0) + ((parseFloat(monthlyContribution) || 0) * 12 * proj.years)).toLocaleString('es-AR')}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {strategy === 'aggressive' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3"
                            >
                                <AlertTriangle className="w-5 h-5 text-purple-500" />
                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                    Nota: El mercado cripto es volátil. Esta proyección asume un ciclo alcista sostenido.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProjectionsModal;
