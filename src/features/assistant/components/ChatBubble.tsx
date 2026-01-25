import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import ChatPanel from '@/features/assistant/components/ChatPanel';

const ChatBubble: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] md:bottom-[calc(24px+env(safe-area-inset-bottom))] right-6 z-[90] size-14 rounded-full bg-blue-gradient text-white shadow-[0_12px_30px_rgba(0,122,255,0.35)] flex items-center justify-center hover:scale-105 transition-transform"
                aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
            >
                <Bot className="w-6 h-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70]"
                    >
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 md:inset-auto md:bottom-[calc(90px+env(safe-area-inset-bottom))] md:right-6 md:w-[380px] md:h-[70vh]"
                        >
                            <div className="h-full bg-surface/95 backdrop-blur-xl border border-border md:rounded-[32px] rounded-none shadow-2xl flex flex-col">
                                <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-border">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">Asistente financiero</div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="size-8 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 p-5 overflow-hidden">
                                    <ChatPanel onClose={() => setIsOpen(false)} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBubble;
