import React, { useEffect, useState } from 'react';
import { Sliders, Smile, MessagesSquare, Sparkles } from 'lucide-react';
import PremiumToggleGroup from '@/components/ui/PremiumToggleGroup';
import { useAIChatSettings } from '@/features/assistant/hooks/useAIChatSettings';
import { useToast } from '@/context/ToastContext';

const INTEREST_OPTIONS = [
    { label: 'Ahorro', value: 'ahorro' },
    { label: 'Deudas', value: 'deudas' },
    { label: 'Inversiones', value: 'inversiones' },
    { label: 'Presupuesto', value: 'presupuesto' },
    { label: 'Reducción de gastos', value: 'reduccion_gastos' },
    { label: 'Ingresos', value: 'ingresos' }
];

const AIChatPreferences: React.FC = () => {
    const { prefs, savePrefs, saving } = useAIChatSettings();
    const { showToast } = useToast();
    const [tone, setTone] = useState<string[]>([prefs.tone || 'porteño']);
    const [humor, setHumor] = useState<string[]>([prefs.humor || 'soft']);
    const [verbosity, setVerbosity] = useState<string[]>([prefs.verbosity || 'normal']);
    const [interests, setInterests] = useState<string[]>(prefs.interest_topics || []);
    const [customRules, setCustomRules] = useState(prefs.custom_rules || '');
    const [learningOptIn, setLearningOptIn] = useState(prefs.learning_opt_in || false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSave = async () => {
        setErrorMessage(null);
        const { error } = await savePrefs({
            tone: tone[0] || 'porteño',
            humor: (humor[0] as any) || 'soft',
            verbosity: (verbosity[0] as any) || 'normal',
            custom_rules: customRules.trim() ? customRules.trim() : null,
            interest_topics: interests,
            learning_opt_in: learningOptIn
        });
        if (error) {
            const message = (error as any)?.message || (typeof error === 'string' ? error : 'No pudimos guardar las preferencias.');
            setErrorMessage(message);
            showToast(message, 'error');
            return;
        }

        setSuccess(true);
        showToast('Preferencias guardadas', 'success');
        setTimeout(() => setSuccess(false), 3000);
    };

    useEffect(() => {
        setTone([prefs.tone || 'porteño']);
        setHumor([prefs.humor || 'soft']);
        setVerbosity([prefs.verbosity || 'normal']);
        setInterests(prefs.interest_topics || []);
        setCustomRules(prefs.custom_rules || '');
        setLearningOptIn(prefs.learning_opt_in || false);
    }, [prefs]);

    return (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Preferencias del Chat</h3>
                    <p className="text-sm text-slate-500">Ajustá el estilo y en qué temas querés foco.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <Smile className="w-4 h-4" />
                        Tono
                    </div>
                    <PremiumToggleGroup
                        options={[
                            { label: 'Porteño', value: 'porteño' },
                            { label: 'Neutral', value: 'neutral' }
                        ]}
                        value={tone}
                        onChange={setTone}
                        multi={false}
                        id="chat-tone"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <Sparkles className="w-4 h-4" />
                        Humor
                    </div>
                    <PremiumToggleGroup
                        options={[
                            { label: 'Off', value: 'off' },
                            { label: 'Suave', value: 'soft' },
                            { label: 'Alto', value: 'high' }
                        ]}
                        value={humor}
                        onChange={setHumor}
                        multi={false}
                        id="chat-humor"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <MessagesSquare className="w-4 h-4" />
                        Verbosidad
                    </div>
                    <PremiumToggleGroup
                        options={[
                            { label: 'Breve', value: 'short' },
                            { label: 'Normal', value: 'normal' },
                            { label: 'Detallado', value: 'detailed' }
                        ]}
                        value={verbosity}
                        onChange={setVerbosity}
                        multi={false}
                        id="chat-verbosity"
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Intereses</div>
                    <div className="-mx-2 px-2 md:mx-0 md:px-0">
                        <div className="flex overflow-x-auto snap-x snap-mandatory md:overflow-visible">
                            <div className="w-max md:w-full">
                                <PremiumToggleGroup
                                    options={INTEREST_OPTIONS}
                                    value={interests}
                                    onChange={setInterests}
                                    multi
                                    id="chat-interests"
                                    className="flex-nowrap w-max md:w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Reglas personalizadas</div>
                    <textarea
                        value={customRules}
                        onChange={(event) => setCustomRules(event.target.value)}
                        rows={4}
                        placeholder="Ej: Duplicá el foco en gastos de servicios y evitá recomendaciones de inversión."
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Aprendizaje global</div>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={learningOptIn}
                            onChange={(event) => setLearningOptIn(event.target.checked)}
                            className="size-4 rounded border border-border"
                        />
                        Permito usar mis preguntas (anonimizadas) para mejorar el chatbot.
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                {errorMessage && <span className="text-xs font-bold text-red-500">{errorMessage}</span>}
                {success && <span className="text-xs font-bold text-emerald-600">Preferencias guardadas</span>}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm disabled:opacity-50"
                >
                    Guardar
                </button>
            </div>
        </div>
    );
};

export default AIChatPreferences;
