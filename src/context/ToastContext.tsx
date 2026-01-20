import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (type !== 'loading') {
            setTimeout(() => hideToast(id), 4000);
        }
    }, [hideToast]);

    const contextValue = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-xs px-4 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onHide={() => hideToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onHide }: { toast: Toast; onHide: () => void }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        loading: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
    };

    const bgStyles = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
        loading: 'bg-slate-500/10 border-slate-500/20',
    };

    return (
        <div className={`
      w-full flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl pointer-events-auto
      animate-in slide-in-from-bottom-5 fade-in duration-300
      ${bgStyles[toast.type]}
    `}>
            <div className="shrink-0">
                {icons[toast.type]}
            </div>
            <p className="flex-1 text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {toast.message}
            </p>
            <button
                onClick={onHide}
                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-slate-400" />
            </button>
        </div>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
