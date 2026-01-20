
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Stars, BrainCircuit } from 'lucide-react';
import { getArgentineInsight } from '@/features/expenses/services/personality';

interface StardustOverlayProps {
    message?: string;
}

const StardustOverlay: React.FC<StardustOverlayProps> = ({ message: defaultMessage }) => {
    const [insight, setInsight] = useState(defaultMessage || "Iniciando análisis mágico...");

    useEffect(() => {
        const interval = setInterval(() => {
            setInsight(getArgentineInsight());
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md overflow-hidden">
            {/* Dynamic Stardust Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(25)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute size-1 bg-blue-400 rounded-full"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: 0,
                            scale: 0
                        }}
                        animate={{
                            x: [null, Math.random() * window.innerWidth],
                            y: [null, Math.random() * window.innerHeight],
                            opacity: [0, 0.8, 0],
                            scale: [0, 1.5, 0],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            filter: 'blur(1px)',
                            boxShadow: '0 0 10px rgba(96, 165, 250, 0.8)'
                        }}
                    />
                ))}

                {/* Floating Stars */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute text-blue-300/30"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            rotate: 0,
                            scale: 0.5
                        }}
                        animate={{
                            rotate: 360,
                            scale: [0.5, 1, 0.5],
                            opacity: [0.1, 0.4, 0.1]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Stars size={20 + Math.random() * 30} />
                    </motion.div>
                ))}
            </div>

            {/* Central Content */}
            <div className="relative z-10 text-center px-6">
                <motion.div
                    animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="size-32 mx-auto mb-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.4)]"
                >
                    <div className="size-24 rounded-full bg-blue-600/40 flex items-center justify-center">
                        <BrainCircuit className="w-12 h-12 text-blue-100" />
                    </div>
                </motion.div>

                <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
                    Analizando con IA
                </h2>

                <div className="h-20 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={insight}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-blue-100/80 text-lg font-medium italic max-w-md mx-auto"
                        >
                            "{insight}"
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Shimmer Bar */}
                <div className="w-64 h-1.5 bg-white/10 rounded-full mx-auto mt-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-blue- gradient w-1/3 rounded-full"
                        animate={{ x: [-100, 300] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    );
};

export default StardustOverlay;
