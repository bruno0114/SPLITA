import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BrainCircuit, LineChart, Globe, Zap, Check, ShieldCheck, Rocket } from 'lucide-react';

interface SubscriptionModalProps {
    onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose }) => {
    const benefits = [
        {
            icon: BrainCircuit,
            title: "Scaneo IA Ilimitado",
            desc: "Sin límites diarios. Escaneá todos tus tickets y facturas al instante.",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            icon: Sparkles,
            title: "Coaching Financiero",
            desc: "Consejos expertos de Gemini personalizados según tus hábitos reales.",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            icon: LineChart,
            title: "Proyecciones Avanzadas",
            desc: "Visualizá tu riqueza futura integrando Crypto, ETFs y acciones.",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            icon: Globe,
            title: "Sincronización Global",
            desc: "Multi-moneda con tipos de cambio en tiempo real y análisis FX.",
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        }
    ];

    const handleUpgrade = () => {
        alert("¡Próximamente! Estamos trabajando en los planes premium.");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-surface rounded-[40px] overflow-hidden shadow-2xl border border-border relative z-10 max-h-[85vh] overflow-y-auto"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors z-20"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                <div className="flex flex-col md:flex-row">
                    {/* Left: Branding */}
                    <div className="w-full md:w-[40%] bg-blue-gradient p-10 text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                                <Zap className="w-3 h-3 fill-white" />
                                Splita Pro
                            </div>
                            <h2 className="text-4xl font-black leading-tight mb-4">
                                Tomá el control total.
                            </h2>
                            <p className="text-blue-100 font-medium text-sm">
                                Elevá tus finanzas al siguiente nivel con herramientas de grado experto.
                            </p>
                        </div>

                        <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-sm">Garantía Splita</span>
                            </div>
                            <p className="text-[10px] text-blue-100 opacity-80 leading-relaxed">
                                Acceso seguro, datos encriptados y sin publicidad. Enfocado 100% en tu crecimiento.
                            </p>
                        </div>

                        {/* Decoration */}
                        <Rocket className="absolute -bottom-10 -right-10 size-48 opacity-10 rotate-12" />
                    </div>

                    {/* Right: Benefits */}
                    <div className="flex-1 p-10 bg-surface">
                        <div className="space-y-6 mb-10">
                            {benefits.map((b, i) => (
                                <motion.div
                                    key={b.title}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className={`size-10 rounded-xl ${b.bg} flex items-center justify-center ${b.color} shrink-0`}>
                                        <b.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">{b.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleUpgrade}
                                className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                                COMENZAR PRUEBA GRATIS
                            </button>
                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                7 días gratis, después $4.99 / mes
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SubscriptionModal;
