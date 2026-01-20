import React, { useState } from 'react';
import { BrainCircuit, ExternalLink, Eye, EyeOff, Check, Loader2, Sparkles } from 'lucide-react';

interface AISettingsProps {
    apiKey: string;
    onSave: (key: string) => Promise<any>;
    saving: boolean;
}

export const AISettings: React.FC<AISettingsProps> = ({ apiKey, onSave, saving }) => {
    const [localKey, setLocalKey] = useState(apiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        const { error } = await onSave(localKey);
        if (!error) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    const isConfigured = !!apiKey;

    return (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6 overflow-hidden relative">
            {/* Background Icon Decoration */}
            <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                <BrainCircuit className="size-32" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        Configuración de IA
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Usamos Gemini para escanear tickets y darte consejos financieros personalizados.
                    </p>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isConfigured
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                    <div className={`size-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {isConfigured ? 'Configurado' : 'Sin configurar'}
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gemini API Key</label>
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-medium"
                        >
                            Obtener llave gratis <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="relative">
                        <BrainCircuit className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type={showKey ? "text" : "password"}
                            value={localKey}
                            onChange={(e) => setLocalKey(e.target.value)}
                            placeholder="Ingresá tu llave de Google AI Studio..."
                            className="w-full bg-surface border border-border rounded-xl pl-12 pr-12 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-slate-400"
                        />
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                        * Tu llave se guarda de forma segura en tu perfil y solo se usa para tus consultas.
                    </p>
                </div>

                <div className="flex justify-end items-center gap-4">
                    {success && (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-right-2">
                            <Check className="w-3.5 h-3.5" />
                            Llave guardada
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || localKey === apiKey}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Llave'}
                    </button>
                </div>
            </div>
        </div>
    );
};
