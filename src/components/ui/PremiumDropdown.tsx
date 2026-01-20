import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
    id: string;
    label: string;
    icon?: LucideIcon;
    color?: string; // Tailwind text color class
    bgColor?: string; // Tailwind bg color class with opacity
}

export interface DropdownGroup {
    title: string;
    options: DropdownOption[];
}

interface PremiumDropdownProps {
    value: string;
    onChange: (id: string) => void;
    groups: DropdownGroup[];
    placeholder?: string;
    className?: string;
}

const PremiumDropdown: React.FC<PremiumDropdownProps> = ({
    value,
    onChange,
    groups,
    placeholder = 'Seleccionar...',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [direction, setDirection] = useState<'up' | 'down'>('down');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find the currently selected option
    const selectedOption = groups
        .flatMap(g => g.options)
        .find(opt => opt.id === value);

    // Position detection
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // If less than 320px below (typical dropdown max height) and more space above
            if (spaceBelow < 320 && spaceAbove > spaceBelow) {
                setDirection('up');
            } else {
                setDirection('down');
            }
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-surface border border-border px-5 py-3 rounded-xl shadow-sm hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                <div className="flex items-center gap-3">
                    {selectedOption?.icon ? (
                        <div className={`p-1.5 rounded-lg ${selectedOption.bgColor || 'bg-slate-500/10'} ${selectedOption.color || 'text-slate-500'}`}>
                            <selectedOption.icon className="w-4 h-4" />
                        </div>
                    ) : null}
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: direction === 'down' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: direction === 'down' ? 10 : -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`absolute right-0 ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} w-full min-w-[240px] bg-surface/90 backdrop-blur-xl border border-border rounded-xl shadow-xl z-[100] overflow-hidden`}
                    >
                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {groups.map((group, groupIdx) => (
                                <div key={group.title} className={groupIdx > 0 ? 'mt-2' : ''}>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">
                                        {group.title}
                                    </div>
                                    {group.options.map(option => {
                                        const isSelected = option.id === value;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleSelect(option.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isSelected
                                                    ? 'bg-primary/10 text-primary font-bold'
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                                                    }`}
                                            >
                                                {option.icon && (
                                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/20' : (option.bgColor || 'bg-slate-500/10')} ${isSelected ? 'text-primary' : (option.color || 'text-slate-500')}`}>
                                                        <option.icon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <span className="text-sm truncate">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PremiumDropdown;
