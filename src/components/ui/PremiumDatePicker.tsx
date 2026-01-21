import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumDatePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (val: string) => void;
    onEndDateChange: (val: string) => void;
}

const PremiumDatePicker: React.FC<PremiumDatePickerProps> = ({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const isSelected = (dateStr: string) => {
        return dateStr === startDate || dateStr === endDate;
    };

    const isInRange = (dateStr: string) => {
        if (!startDate || !endDate) return false;
        return dateStr > startDate && dateStr < endDate;
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const dateStr = selectedDate.toISOString().split('T')[0];

        if (!startDate || (startDate && endDate)) {
            onStartDateChange(dateStr);
            onEndDateChange('');
        } else {
            if (dateStr < startDate) {
                onEndDateChange(startDate);
                onStartDateChange(dateStr);
            } else {
                onEndDateChange(dateStr);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y.slice(2)}`;
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const prevMonthDays = daysInMonth(year, month - 1);

        const calendarDays = [];

        // Monday start adjustment
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        // Previous month days
        for (let i = offset - 1; i >= 0; i--) {
            calendarDays.push({ day: prevMonthDays - i, currentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= days; i++) {
            calendarDays.push({ day: i, currentMonth: true });
        }

        // Next month days
        const remaining = 42 - calendarDays.length;
        for (let i = 1; i <= remaining; i++) {
            calendarDays.push({ day: i, currentMonth: false });
        }

        return (
            <div className="grid grid-cols-7 gap-1">
                {['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'].map(d => (
                    <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {d}
                    </div>
                ))}
                {calendarDays.map((d, i) => {
                    const dateObj = new Date(year, d.currentMonth ? month : (d.day > 20 ? month - 1 : month + 1), d.day);
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const selected = d.currentMonth && isSelected(dateStr);
                    const range = d.currentMonth && isInRange(dateStr);

                    return (
                        <button
                            key={i}
                            onClick={() => d.currentMonth && handleDateClick(d.day)}
                            disabled={!d.currentMonth}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all relative
                                ${!d.currentMonth ? 'text-slate-300 opacity-20 cursor-default' : 'hover:bg-slate-100 dark:hover:bg-white/5'}
                                ${selected ? 'bg-primary text-white shadow-lg shadow-primary/30 z-10' : ''}
                                ${range ? 'bg-primary/10 text-primary rounded-none first:rounded-l-xl last:rounded-r-xl' : ''}
                            `}
                        >
                            {d.day}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="min-w-[140px] text-left">
                    {startDate ? (endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : formatDate(startDate)) : 'Seleccionar fechas'}
                </span>
                {(startDate || endDate) && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartDateChange('');
                            onEndDateChange('');
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-slate-400" />
                    </div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 z-[100] p-4 bg-surface border border-border rounded-2xl shadow-2xl min-w-[300px]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </h4>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {renderCalendar()}

                        <div className="mt-4 pt-4 border-t border-border flex justify-between gap-2">
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    onStartDateChange(today);
                                    onEndDateChange(today);
                                    setIsOpen(false);
                                }}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"
                            >
                                Listo
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PremiumDatePicker;
