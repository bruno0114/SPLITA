import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface ToggleOption {
    label: string;
    value: string;
    icon?: LucideIcon;
}

interface PremiumToggleGroupProps {
    options: ToggleOption[];
    value: string[];
    onChange: (value: string[]) => void;
    multi?: boolean;
    className?: string;
    id?: string;
}

const PremiumToggleGroup: React.FC<PremiumToggleGroupProps> = ({
    options,
    value,
    onChange,
    multi = true,
    className = '',
    id = 'toggle-group',
}) => {
    const handleToggle = (optionValue: string) => {
        if (multi) {
            if (value.includes(optionValue)) {
                onChange(value.filter((v) => v !== optionValue));
            } else {
                onChange([...value, optionValue]);
            }
        } else {
            onChange([optionValue]);
        }
    };

    return (
        <div className={`p-1.5 glass-panel rounded-2xl flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 ${className}`}>
            {options.map((option) => {
                const isSelected = value.includes(option.value);
                const Icon = option.icon;

                return (
                    <button
                        key={option.value}
                        onClick={() => handleToggle(option.value)}
                        className={`
              relative px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 overflow-hidden
              ${isSelected
                                ? 'text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                            }
            `}
                    >
                        {/* Background for selected state */}
                        {isSelected && (
                            multi ? (
                                <div className="absolute inset-0 bg-blue-gradient -z-10 shadow-lg shadow-blue-500/20" />
                            ) : (
                                <motion.div
                                    layoutId={`${id}-bg`}
                                    className="absolute inset-0 bg-blue-gradient -z-10 shadow-lg shadow-blue-500/20"
                                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                />
                            )
                        )}

                        {isSelected && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 bg-white/10 pointer-events-none"
                            />
                        )}

                        {Icon && (
                            <Icon
                                className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}
                            />
                        )}
                        <span className="relative z-10">{option.label}</span>

                        {/* Shimmer effect for selected */}
                        {isSelected && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                                animate={{ x: ['100%', '-100%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default PremiumToggleGroup;
