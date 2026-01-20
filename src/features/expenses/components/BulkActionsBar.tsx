import React, { useState } from 'react';
import { Trash2, FolderPen, X, Check, Loader2, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { useCategories } from '@/features/analytics/hooks/useCategories';

interface BulkActionsBarProps {
    selectedCount: number;
    onClear: () => void;
    onDelete: () => Promise<void>;
    onMove: (categoryId: string) => Promise<void>;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onClear, onDelete, onMove }) => {
    const { categories } = useCategories();
    const [isMoving, setIsMoving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleMove = async (catId: string) => {
        setIsMoving(true);
        await onMove(catId);
        setIsMoving(false);
        onClear();
    };

    const handleDelete = async () => {
        if (window.confirm(`¿Estás seguro de que querés eliminar estos ${selectedCount} movimientos?`)) {
            setIsDeleting(true);
            await onDelete();
            setIsDeleting(false);
            onClear();
        }
    };

    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-[calc(88px+env(safe-area-inset-bottom)+1rem)] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
                >
                    <div className="glass-panel p-4 rounded-3xl shadow-2xl border-2 border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 dark:bg-black/80 backdrop-blur-2xl">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/30">
                                {selectedCount}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Movimientos seleccionados</p>
                                <button onClick={onClear} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                                    Deshacer selección
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Mass Move Dropdown */}
                            <div className="relative">
                                <PremiumDropdown
                                    value={selectedCategory}
                                    onChange={handleMove}
                                    groups={[
                                        {
                                            title: 'Mover a categoría...',
                                            options: categories.map(c => ({
                                                id: c.name,
                                                label: c.name,
                                                icon: LayoutGrid,
                                                color: c.color,
                                                bgColor: c.bg_color
                                            }))
                                        }
                                    ]}
                                    className="min-w-[180px] h-12 !bg-white/5 !border-white/10 text-white"
                                    placeholder="Re-asignat..."
                                />
                                {isMoving && (
                                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-12 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                <span className="hidden md:inline">Eliminar</span>
                            </button>

                            <button
                                onClick={onClear}
                                className="size-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BulkActionsBar;
