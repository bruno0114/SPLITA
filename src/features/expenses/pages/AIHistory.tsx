
import React, { useEffect, useState } from 'react';
import { useAIHistory } from '@/features/expenses/hooks/useAIHistory';
import { Clock, ChevronRight, FileText, Calendar, ShoppingBag, Eye, ExternalLink, BrainCircuit, FileSpreadsheet, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import HistoryDetailModal from '../components/HistoryDetailModal';

const AIHistory: React.FC = () => {
    const { getSessions, updateSessionData } = useAIHistory();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<any | null>(null);

    const isImage = (url: string) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);
    const isPdf = (url: string) => /\.pdf$/i.test(url);
    const isXls = (url: string) => /\.(xlsx|xls|csv)$/i.test(url);
    const isDoc = (url: string) => /\.(docx|doc)$/i.test(url);

    useEffect(() => {
        const fetchSessions = async () => {
            const data = await getSessions();
            setSessions(data);
            setLoading(false);
        };
        fetchSessions();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <div className="size-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Buscando memorias de la IA...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2 text-blue-500 font-bold uppercase tracking-widest text-xs">
                    <Clock className="w-4 h-4" />
                    Memoria de Importaciones
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Historial de la IA</h1>
                <p className="text-slate-500">Acá tenés todo lo que la IA detectó y guardó para vos.</p>
            </header>

            {sessions.length === 0 ? (
                <div className="bg-surface border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-20 text-center">
                    <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BrainCircuit className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay sesiones todavía</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Cuando importes tickets con IA, aparecerán acá para que los consultes cuando quieras.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {sessions.map((session, index) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-surface hover:bg-slate-50 dark:hover:bg-white/5 border border-border rounded-3xl p-6 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Thumbnail */}
                                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-border relative shrink-0 flex items-center justify-center">
                                    {session.image_urls?.[0] ? (
                                        isImage(session.image_urls[0]) ? (
                                            <img
                                                src={session.image_urls[0]}
                                                alt="Ticket"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : isPdf(session.image_urls[0]) ? (
                                            <div className="flex flex-col items-center gap-1 text-red-500">
                                                <FileText className="w-10 h-10" />
                                                <span className="text-[10px] font-black uppercase">PDF DOCUMENT</span>
                                            </div>
                                        ) : isXls(session.image_urls[0]) ? (
                                            <div className="flex flex-col items-center gap-1 text-emerald-500">
                                                <FileSpreadsheet className="w-10 h-10" />
                                                <span className="text-[10px] font-black uppercase">EXCEL / CSV</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-blue-500">
                                                <FileCode className="w-10 h-10" />
                                                <span className="text-[10px] font-black uppercase">ARCHIVO DOC</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <FileText className="w-8 h-8 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <button
                                            onClick={() => setSelectedSession(session)}
                                            className="text-white text-[10px] font-bold flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" /> VER DETALLES
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(session.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <span className="bg-blue-600/10 text-blue-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                                            {session.raw_data?.length || 0} GASTOS DETECTADOS
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                        {session.raw_data?.[0]?.merchant || 'Importación sin nombre'}
                                        {session.raw_data?.length > 1 && <span className="text-slate-400 font-medium"> y otros</span>}
                                    </h3>

                                    {/* Mini Grid of Results */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {session.raw_data?.slice(0, 3).map((item: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-border/50">
                                                <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                                                    <ShoppingBag className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.merchant}</p>
                                                    <p className="text-xs text-blue-500 font-black">
                                                        <AnimatedPrice amount={item.amount} />
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="hidden md:flex items-center pr-4">
                                    <div className="size-10 rounded-full border border-border flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {selectedSession && (
                    <HistoryDetailModal
                        session={selectedSession}
                        onClose={() => setSelectedSession(null)}
                        onUpdate={async (id, newData) => {
                            await updateSessionData(id, newData);
                            const updatedSessions = sessions.map(s => s.id === id ? { ...s, raw_data: newData } : s);
                            setSessions(updatedSessions);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIHistory;
