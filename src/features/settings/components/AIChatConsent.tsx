import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CHAT_TERMS_VERSION } from '@/features/assistant/constants';
import { useAIChatSettings } from '@/features/assistant/hooks/useAIChatSettings';

const AIChatConsent: React.FC = () => {
    const { consent, acceptTerms, saving } = useAIChatSettings();
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const isAccepted = !!consent.chat_terms_accepted_at && consent.chat_terms_version === CHAT_TERMS_VERSION;

    const handleAccept = async () => {
        setError(null);
        const { error: acceptError } = await acceptTerms(CHAT_TERMS_VERSION);
        if (acceptError) {
            setError('No pudimos guardar tu aceptación. Intentá otra vez.');
            return;
        }
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Términos del Chat</h3>
                    <p className="text-sm text-slate-500">Necesitamos tu aceptación para activar el asistente.</p>
                </div>
            </div>

            {isAccepted ? (
                <div className="text-sm text-emerald-600 font-bold">Aceptado el {new Date(consent.chat_terms_accepted_at!).toLocaleDateString('es-AR')}.</div>
            ) : (
                <label className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                        className="size-4 rounded border border-border"
                    />
                    Acepto los términos y condiciones del chat financiero.
                </label>
            )}

            {!isAccepted && (
                <div className="flex items-center gap-3">
                    <button
                        disabled={!accepted || saving}
                        onClick={handleAccept}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm disabled:opacity-50"
                    >
                        Activar chat
                    </button>
                    {success && <span className="text-xs font-bold text-emerald-600">Aceptación guardada</span>}
                    {error && <span className="text-xs text-red-500">{error}</span>}
                </div>
            )}
        </div>
    );
};

export default AIChatConsent;
