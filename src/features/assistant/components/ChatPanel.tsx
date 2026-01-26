import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, MessageCircle, Send, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { useGroups } from '@/context/GroupsContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAIChatSettings } from '@/features/assistant/hooks/useAIChatSettings';
import { CHAT_TERMS_VERSION } from '@/features/assistant/constants';
import {
    ChatMessage,
    AIChatPrefs,
    getContextPack,
    getOffTopicResponse,
    isFinanceQuery,
    isHelpQuery,
    parseChatIntent,
    sendChatMessage,
    summarizeConversation
} from '@/services/ai-chat';

const DEFAULT_PROMPTS = [
    '¿Cuánto gasté el último mes?',
    '¿Qué categoría se me fue más?',
    '¿Cómo está mi salud financiera este mes?',
    '¿Cuánto tengo en ahorros e inversiones?',
    '¿Cómo vengo en mis grupos?',
    '¿Cuánto ingresé este mes?'
];

const toPrefsPayload = (prefs: AIChatPrefs): AIChatPrefs => ({
    tone: prefs.tone || 'porteño',
    humor: prefs.humor || 'soft',
    verbosity: prefs.verbosity || 'normal',
    custom_rules: prefs.custom_rules || null,
    interest_topics: prefs.interest_topics || []
});

interface ChatPanelProps {
    onClose?: () => void;
}

const formatNumericText = (value: string) => {
    const numberRegex = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?\b|\b\d{5,}(?:[.,]\d+)?\b/g;
    const formatter = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return value.replace(numberRegex, (match) => {
        const normalized = match.replace(/\./g, '').replace(',', '.');
        const parsed = Number(normalized);
        if (Number.isNaN(parsed)) return match;
        return formatter.format(parsed);
    });
};

const applyCurrencySymbol = (value: string, currency: string) => {
    const hasCurrency = /(ARS|USD|EUR|US\$|€|\$)/i.test(value);
    if (hasCurrency) return value;
    const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
    const numberRegex = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?\b|\b\d{4,}(?:[.,]\d+)?\b/g;
    return value.replace(numberRegex, (match) => `${symbol} ${match}`);
};

const isGreeting = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return [
        'hola', 'buenas', 'buen dia', 'buen día', 'buenas tardes', 'buenas noches',
        'hey', 'que tal', 'qué tal', 'como estas', 'cómo estás'
    ].some((greeting) => normalized.startsWith(greeting));
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { groups } = useGroups();
    const { currency: displayCurrency, rateSource, exchangeRate } = useCurrency();
    const navigate = useNavigate();
    const { prefs, consent } = useAIChatSettings();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_PROMPTS);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionSummary, setSessionSummary] = useState<string | null>(null);
    const [summaryMessageCount, setSummaryMessageCount] = useState(0);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const groupSnapshots = useMemo(() => {
        return groups.map(group => ({
            id: group.id,
            name: group.name,
            userBalance: group.userBalance,
            currency: group.currency
        }));
    }, [groups]);

    const isTermsAccepted = !!consent.chat_terms_accepted_at && consent.chat_terms_version === CHAT_TERMS_VERSION;
    const isAiConfigured = !!profile?.gemini_api_key;
    const canChat = isAiConfigured && isTermsAccepted;

    const addMessage = (role: ChatMessage['role'], content: string) => {
        const messageId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newMessage: ChatMessage = {
            id: messageId,
            role,
            content,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const loadSession = useCallback(async () => {
        if (!user) return;
        const { data: sessionData } = await supabase
            .from('ai_chat_sessions')
            .select('session_id, summary, summary_message_count')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (sessionData?.session_id) {
            setSessionId(sessionData.session_id);
            setSessionSummary(sessionData.summary || null);
            setSummaryMessageCount(sessionData.summary_message_count || 0);
            return;
        }

        const newSessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const { data: createdSession } = await supabase
            .from('ai_chat_sessions')
            .insert({
                session_id: newSessionId,
                user_id: user.id,
                summary: null,
                summary_message_count: 0,
                updated_at: new Date().toISOString()
            })
            .select('session_id, summary, summary_message_count')
            .single();

        if (createdSession?.session_id) {
            setSessionId(createdSession.session_id);
            setSessionSummary(createdSession.summary || null);
            setSummaryMessageCount(createdSession.summary_message_count || 0);
        }
    }, [user]);

    const loadMessages = useCallback(async (currentSessionId: string) => {
        const { data: messageRows } = await supabase
            .from('ai_chat_messages')
            .select('id, role, content, created_at')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true })
            .limit(40);

        if (messageRows) {
            setMessages(messageRows.map((row) => ({
                id: row.id,
                role: row.role as ChatMessage['role'],
                content: row.content,
                createdAt: row.created_at
            })));
        }
    }, []);

    const persistMessage = useCallback(async (currentSessionId: string, role: ChatMessage['role'], content: string) => {
        await supabase
            .from('ai_chat_messages')
            .insert({
                session_id: currentSessionId,
                role,
                content
            });

        await supabase
            .from('ai_chat_sessions')
            .update({
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('session_id', currentSessionId);
    }, []);

    const trimMessages = useCallback(async (currentSessionId: string) => {
        const { data: messageRows } = await supabase
            .from('ai_chat_messages')
            .select('id')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: false })
            .range(30, 200);

        const idsToDelete = (messageRows || []).map((row) => row.id);
        if (idsToDelete.length > 0) {
            await supabase
                .from('ai_chat_messages')
                .delete()
                .in('id', idsToDelete);
        }
    }, []);

    const updateSummaryIfNeeded = useCallback(async (currentSessionId: string) => {
        if (!profile?.gemini_api_key) return;

        const { count } = await supabase
            .from('ai_chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', currentSessionId);

        const totalCount = count || 0;
        if (totalCount <= 30) return;

        const shouldSummarize = totalCount - summaryMessageCount >= 10 || !sessionSummary;
        if (!shouldSummarize) return;

        const { data: recentMessages } = await supabase
            .from('ai_chat_messages')
            .select('role, content, created_at')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true })
            .limit(30);

        const summary = await summarizeConversation({
            apiKey: profile.gemini_api_key,
            existingSummary: sessionSummary,
            messages: (recentMessages || []).map((row) => ({
                role: row.role as 'user' | 'assistant',
                content: row.content
            }))
        });

        await supabase
            .from('ai_chat_sessions')
            .update({
                summary,
                summary_updated_at: new Date().toISOString(),
                summary_message_count: totalCount,
                updated_at: new Date().toISOString()
            })
            .eq('session_id', currentSessionId);

        setSessionSummary(summary);
        setSummaryMessageCount(totalCount);
        await trimMessages(currentSessionId);
    }, [profile?.gemini_api_key, sessionSummary, summaryMessageCount, trimMessages]);

    const loadSuggestions = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('ai_chat_suggestions')
            .select('prompt')
            .eq('user_id', user.id)
            .order('usage_count', { ascending: false })
            .order('last_used_at', { ascending: false })
            .limit(6);

        if (!error && data && data.length > 0) {
            setSuggestions(data.map(item => item.prompt));
        } else {
            setSuggestions(DEFAULT_PROMPTS);
        }
    }, [user]);

    const trackSuggestion = useCallback(async (prompt: string) => {
        if (!user) return;
        const { data } = await supabase
            .from('ai_chat_suggestions')
            .select('usage_count')
            .eq('user_id', user.id)
            .eq('prompt', prompt)
            .maybeSingle();

        const usageCount = data?.usage_count ? Number(data.usage_count) + 1 : 1;
        await supabase
            .from('ai_chat_suggestions')
            .upsert({
                user_id: user.id,
                prompt,
                usage_count: usageCount,
                last_used_at: new Date().toISOString()
            }, { onConflict: 'user_id,prompt' });
    }, [user]);

    const handleSend = async (text: string) => {
        if (!user || !text.trim()) return;
        setLocalError(null);
        const query = text.trim();
        setInput('');
        addMessage('user', query);
        trackSuggestion(query);

        if (sessionId) {
            await persistMessage(sessionId, 'user', query);
        }

        const normalized = normalizeText(query);
        const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
        if (lastUserMessage && normalizeText(lastUserMessage.content) === normalized) {
            const reply = 'Te respondí hace un toque con eso. Si querés, reformulá o pedime un detalle más específico.';
            addMessage('assistant', reply);
            if (sessionId) {
                await persistMessage(sessionId, 'assistant', reply);
            }
            return;
        }

        if (isGreeting(query)) {
            const reply = '¡Hola! ¿Cómo andás? Preguntame por tus gastos, ingresos, ahorros o cualquier función de SPLITA.';
            addMessage('assistant', reply);
            if (sessionId) {
                await persistMessage(sessionId, 'assistant', reply);
            }
            return;
        }

        const financeCheck = isFinanceQuery(query);
        const helpCheck = isHelpQuery(query);
        if (!financeCheck.allowed && !helpCheck) {
            addMessage('assistant', getOffTopicResponse());
            return;
        }

        if (!profile?.gemini_api_key) {
            addMessage('assistant', 'Necesito que configures tu API Key de Gemini en Configuración para responder.');
            return;
        }

        setIsThinking(true);
        try {
            const intent = parseChatIntent(query, groupSnapshots);
            const context = await getContextPack(user.id, groupSnapshots, {
                displayCurrency,
                rateSource,
                exchangeRate,
                forceRefresh: intent.kind === 'savings'
            });
            const response = await sendChatMessage({
                apiKey: profile.gemini_api_key,
                query,
                context,
                prefs: toPrefsPayload(prefs),
                intent
            });
            const formatted = formatNumericText(response);
            const withCurrency = ['savings', 'income', 'spend', 'balance', 'group_balance'].includes(intent.kind)
                ? applyCurrencySymbol(formatted, displayCurrency)
                : formatted;
            addMessage('assistant', withCurrency);

            if (sessionId) {
                await persistMessage(sessionId, 'assistant', withCurrency);
                await updateSummaryIfNeeded(sessionId);
            }
        } catch (error: any) {
            console.error('[AI Chat] Failed to send message:', error);
            setLocalError('No pude responder en este momento. Probá de nuevo en un ratito.');
        } finally {
            setIsThinking(false);
        }
    };

    useEffect(() => {
        loadSuggestions();
    }, [loadSuggestions, messages.length]);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    useEffect(() => {
        if (sessionId) {
            loadMessages(sessionId);
        }
    }, [sessionId, loadMessages]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Asistente financiero</p>
                        <p className="text-[11px] text-slate-500">Solo finanzas SPLITA</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!isAiConfigured && (
                <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <div className="text-xs">
                        <p className="font-bold">Falta tu Gemini API Key</p>
                        <button
                            onClick={() => navigate('/configuracion')}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:underline"
                        >
                            Configurar ahora <Settings className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {!isTermsAccepted && (
                <div className="mt-4 p-3 rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs">
                    Necesitás aceptar los términos del chat en Configuración para usar el asistente.
                </div>
            )}

            <div className="flex-1 mt-4 space-y-3 overflow-y-auto pr-2">
                {messages.length === 0 && (
                    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-500">
                        Probá con un keyword o preguntá por un mes específico.
                    </div>
                )}
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`p-3 rounded-2xl text-xs leading-relaxed w-fit ${message.role === 'user'
                            ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 max-w-[85%]'
                            }`}
                    >
                        {message.content}
                    </div>
                ))}
                {isThinking && (
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 text-xs w-fit">
                        Pensando con números...
                    </div>
                )}
            </div>

            <div className="mt-4 -mx-1">
                <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-1 pb-2">
                    {suggestions.map((prompt) => (
                        <button
                            key={prompt}
                            onClick={() => handleSend(prompt)}
                            disabled={!canChat || isThinking}
                            className="shrink-0 snap-start px-4 py-2 rounded-full border border-border text-[11px] font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center gap-3">
                    <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                if (canChat && !isThinking) handleSend(input);
                            }
                        }}
                        placeholder={canChat ? 'Escribí tu consulta financiera...' : 'Configurá Gemini y aceptá términos.'}
                        disabled={!canChat || isThinking}
                        className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-60"
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={!canChat || isThinking || !input.trim()}
                        className="size-9 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                {localError && <p className="text-[10px] text-red-500 mt-2">{localError}</p>}
            </div>
        </div>
    );
};

export default ChatPanel;
