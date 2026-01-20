import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { PersonalTransaction } from '@/types/index';

interface ExpenditureEvolutionChartProps {
    transactions: PersonalTransaction[];
    onUpgrade?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Comida': '#10b981',
    'Transporte': '#3b82f6',
    'Shopping': '#f43f5e',
    'Hogar': '#8b5cf6',
    'Salud': '#06b6d4',
    'Entretenimiento': '#f59e0b',
    'Otros': '#64748b',
    'Suscripciones': '#ec4899',
    'Viajes': '#f97316'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-white/90">{entry.name}</span>
                            </div>
                            <span className="text-xs font-black text-white">
                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(entry.value)}
                            </span>
                        </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-black text-blue-400">TOTAL</span>
                        <span className="text-xs font-black text-blue-400">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const ExpenditureEvolutionChart: React.FC<ExpenditureEvolutionChartProps> = ({ transactions, onUpgrade }) => {
    const chartData = useMemo(() => {
        const monthsMap: Record<string, any> = {};

        // Sort transactions by date ascending for processing
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const date = new Date(t.date);
                const monthKey = date.toLocaleString('es-AR', { month: 'short', year: '2-digit' });
                const category = t.category || 'Otros';

                if (!monthsMap[monthKey]) {
                    monthsMap[monthKey] = { name: monthKey.toUpperCase() };
                }
                monthsMap[monthKey][category] = (monthsMap[monthKey][category] || 0) + Number(t.amount);
            });

        return Object.values(monthsMap);
    }, [transactions]);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        transactions.filter(t => t.type === 'expense').forEach(t => cats.add(t.category || 'Otros'));
        return Array.from(cats);
    }, [transactions]);

    if (chartData.length === 0) return null;

    return (
        <div className="glass-panel p-6 md:p-8 rounded-[2rem] h-[400px] mb-12 group relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-gradient opacity-[0.02] group-hover:opacity-[0.05] transition-opacity" />

            <div className="relative z-10 mb-8 flex items-start justify-between">
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-1">Análisis de Tendencias</h4>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Evolución de Gastos</h3>
                </div>
                {onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1.5"
                    >
                        Pro
                    </button>
                )}
            </div>

            <ResponsiveContainer width="100%" height="75%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" className="dark:stroke-white/5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        tickFormatter={(val) => `$${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 12 }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">{value}</span>}
                        wrapperStyle={{ paddingTop: '0', paddingBottom: '30px' }}
                    />
                    {categories.map((cat, idx) => (
                        <Bar
                            key={cat}
                            dataKey={cat}
                            stackId="a"
                            fill={CATEGORY_COLORS[cat] || `hsl(${idx * 137.5 % 360}, 50%, 60%)`}
                            radius={idx === categories.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                            barSize={40}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenditureEvolutionChart;
