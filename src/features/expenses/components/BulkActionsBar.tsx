import React, { useState } from 'react';
import { Trash2, FolderPen, X, Check, Loader2, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import { useToast } from '@/context/ToastContext';

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
    const { showToast } = useToast();

    const handleMove = async (catId: string) => {
        setIsMoving(true);
        await onMove(catId);
        setIsMoving(false);
        onClear();
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
        } catch (err) {
            console.error('[BulkActions] Delete error:', err);
        } finally {
            setIsDeleting(false);
            // We don't onClear here because PersonalFinance handles it after verification
        }
    };

    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 50, opacity: 0, x: '-50%' }}
                    animate={{ y: 0, opacity: 1, x: '-50%' }}
                    exit={{ y: 50, opacity: 0, x: '-50%' }}
                    className="fixed bottom-[calc(100px+env(safe-area-inset-bottom))] md:bottom-12 left-1/2 z-50 w-auto min-w-[320px] md:min-w-[520px]"
                >
                    <div className="bg-slate-900/90 dark:bg-black/80 backdrop-blur-2xl border border-white/10 p-1.5 md:p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1.5 md:gap-3 px-3 md:px-5">
                        {/* 1. Item Count (Blue Circle) */}
                        <div className="size-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] shrink-0">
                            {selectedCount}
                        </div>

                        {/* 2. Clear (Small gray X) */}
                        <button
                            onClick={onClear}
                            className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors shrink-0"
                            title="Deseleccionar"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />

                        {/* 3. Re-assign Dropdown (Slightly larger area) */}
                        <div className="relative flex-1 min-w-[140px]">
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
                                className="h-10 !bg-white/5 !border-transparent !text-slate-200 text-xs font-bold rounded-full px-4 hover:!bg-white/10 transition-colors"
                                placeholder="Re-asignar..."
                            />
                            {isMoving && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* 4. Delete Action (Red Circle) */}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="size-10 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-90 disabled:opacity-50 shrink-0"
                            title="Eliminar"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>

                        {/* 5. Close/Cancel (Dark Circle X) */}
                        <button
                            onClick={onClear}
                            className="size-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all shrink-0"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BulkActionsBar;
