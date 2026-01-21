import React, { useState } from 'react';
import {
    X, Plus, Trash2, Edit2, Check,
    ShoppingBag, ShoppingCart, Coffee, Zap,
    Car, Home, Plane, MoreHorizontal, LayoutGrid,
    Smile, Heart, Utensils, Music, Laptop,
    Gift, Camera, Briefcase, Dumbbell, Palette
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { Category } from '@/types/index';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumConfirmModal from '@/components/ui/PremiumConfirmModal';
import { useToast } from '@/context/ToastContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const AVAILABLE_ICONS = [
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'ShoppingCart', icon: ShoppingCart },
    { name: 'Coffee', icon: Coffee },
    { name: 'Zap', icon: Zap },
    { name: 'Car', icon: Car },
    { name: 'Home', icon: Home },
    { name: 'Plane', icon: Plane },
    { name: 'MoreHorizontal', icon: MoreHorizontal },
    { name: 'Smile', icon: Smile },
    { name: 'Heart', icon: Heart },
    { name: 'Utensils', icon: Utensils },
    { name: 'Music', icon: Music },
    { name: 'Laptop', icon: Laptop },
    { name: 'Gift', icon: Gift },
    { name: 'Camera', icon: Camera },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Palette', icon: Palette },
];

const AVAILABLE_COLORS = [
    { text: 'text-blue-500', bg: 'bg-blue-500/10' },
    { text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { text: 'text-orange-500', bg: 'bg-orange-500/10' },
    { text: 'text-rose-500', bg: 'bg-rose-500/10' },
    { text: 'text-purple-500', bg: 'bg-purple-500/10' },
    { text: 'text-pink-500', bg: 'bg-pink-500/10' },
    { text: 'text-amber-500', bg: 'bg-amber-500/10' },
    { text: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { text: 'text-teal-500', bg: 'bg-teal-500/10' },
    { text: 'text-slate-500', bg: 'bg-slate-500/10' },
];

const CategoryManagerModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
    const { showToast } = useToast();

    // Form State
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('LayoutGrid');
    const [color, setColor] = useState(AVAILABLE_COLORS[0].text);
    const [bgColor, setBgColor] = useState(AVAILABLE_COLORS[0].bg);

    const resetForm = () => {
        setName('');
        setIcon('LayoutGrid');
        setColor(AVAILABLE_COLORS[0].text);
        setBgColor(AVAILABLE_COLORS[0].bg);
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            if (editingId) {
                await updateCategory(editingId, { name, icon, color, bg_color: bgColor });
                showToast('Categoría actualizada', 'success');
            } else {
                await addCategory({ name, icon, color, bg_color: bgColor });
                showToast('Categoría creada', 'success');
            }
            resetForm();
        } catch (err: any) {
            showToast(err.message || 'Error al guardar la categoría', 'error');
        }
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setIcon(cat.icon);
        setColor(cat.color);
        setBgColor(cat.bg_color);
        setIsAdding(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            ></motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-surface border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gestionar Categorías</h3>
                        <p className="text-sm text-slate-500">Personalizá cómo agrupamos tus gastos</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {/* Add/Edit Form */}
                    {isAdding ? (
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-border mb-8 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-slate-900 dark:text-white">
                                    {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h4>
                                <button onClick={resetForm} className="text-xs font-bold text-slate-500 hover:text-red-500">Cancelar</button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej: Gimnasio, Mascotas..."
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ícono</label>
                                    <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                                        {AVAILABLE_ICONS.map(item => (
                                            <button
                                                key={item.name}
                                                onClick={() => setIcon(item.name)}
                                                className={`size-10 rounded-lg flex items-center justify-center transition-all ${icon === item.name ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-surface border border-border text-slate-400 hover:border-primary/30'}`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {AVAILABLE_COLORS.map(c => (
                                            <button
                                                key={c.text}
                                                onClick={() => { setColor(c.text); setBgColor(c.bg); }}
                                                className={`size-8 rounded-full border-2 transition-all ${color === c.text ? 'border-primary scale-110 shadow-md' : 'border-transparent'}`}
                                                style={{ backgroundColor: c.text.replace('text-', '').split('-')[0] }} // Placeholder hack or just use div with bg-class
                                            >
                                                <div className={`inset-1 rounded-full ${c.text.replace('text-', 'bg-')} h-full w-full`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {editingId ? 'Actualizar Categoría' : 'Crear Categoría'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-slate-500 font-bold hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 mb-8"
                        >
                            <Plus className="w-5 h-5" />
                            Nueva Categoría
                        </button>
                    )}

                    {/* Category List */}
                    <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Tus Categorías</label>
                        {loading ? (
                            <p className="text-center text-slate-500 py-10">Cargando...</p>
                        ) : categories.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">No tienes categorías personalizadas.</p>
                        ) : (
                            categories.map(cat => {
                                const IconComp = AVAILABLE_ICONS.find(i => i.name === cat.icon)?.icon || LayoutGrid;
                                return (
                                    <div key={cat.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-xl ${cat.bg_color} ${cat.color} flex items-center justify-center`}>
                                                <IconComp className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {cat.name}
                                                    {cat.is_system && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">Sistema</span>}
                                                </p>
                                            </div>
                                        </div>

                                        {!cat.is_system && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: cat.id })}
                                                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </motion.div>

            <PremiumConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Eliminar categoría"
                message="¿Estás seguro de que querés eliminar esta categoría? Esto podría afectar la visualización de tus gastos pasados."
                confirmLabel="Eliminar"
                onConfirm={async () => {
                    if (deleteConfirm.id) {
                        await deleteCategory(deleteConfirm.id);
                        showToast('Categoría eliminada', 'success');
                        setDeleteConfirm({ isOpen: false, id: null });
                    }
                }}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
            />
        </div>
    );
};

export default CategoryManagerModal;
