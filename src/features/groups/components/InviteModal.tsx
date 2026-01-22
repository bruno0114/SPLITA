import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    inviteCode: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, groupName, inviteCode }) => {
    const [copied, setCopied] = useState(false);
    const inviteUrl = `${window.location.origin}/unirse/${inviteCode}`;

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = `¡Hola! Sumate al grupo "${groupName}" en SPLITA para que dividamos los gastos fácilmente: ${inviteUrl}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-surface rounded-[2.5rem] p-8 shadow-2xl border border-white/10 overflow-hidden"
            >
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="size-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <Share2 className="w-6 h-6" />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="text-center mb-8 relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Invitar Amigos</h3>
                    <p className="text-slate-500 font-medium">Compartí este enlace para que otros se unan a <span className="text-slate-900 dark:text-slate-200 font-bold">{groupName}</span></p>
                </div>

                <div className="space-y-4 relative z-10">
                    {/* WhatsApp Share Button */}
                    <button
                        onClick={handleWhatsAppShare}
                        className="w-full py-4 rounded-2xl bg-[#25D366] text-white font-black flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <MessageCircle className="w-6 h-6" fill="white" />
                        Compartir por WhatsApp
                    </button>

                    {/* Copy Link Section */}
                    <div className="relative mt-6">
                        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-black/20 rounded-2xl border border-border">
                            <input
                                type="text"
                                readOnly
                                value={inviteUrl}
                                className="flex-1 bg-transparent border-none text-xs font-bold px-4 py-3 text-slate-500 focus:outline-none truncate"
                            />
                            <button
                                onClick={handleCopy}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${copied
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:bg-slate-50'
                                    }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-center text-slate-400 mt-8 font-bold uppercase tracking-widest">
                    Cualquiera con el link podrá unirse
                </p>
            </motion.div>
        </div>
    );
};

export default InviteModal;
