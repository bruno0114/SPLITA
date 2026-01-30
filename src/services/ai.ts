import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";
import { EXTRACTION_PROMPT } from "@/lib/ai-prompts";

/**
 * AI Service Error Codes
 */
export type AIErrorCode = 'API_KEY_MISSING' | 'INVALID_KEY' | 'NO_SUITABLE_MODEL' | 'REJECTED_BY_AI' | 'RATE_LIMIT' | 'UNKNOWN_ERROR';

export interface AIError {
    code: AIErrorCode;
    message: string;
}

// Simple in-memory cache for verified models per API key
const modelCache = new Map<string, string>();

/**
 * Returns a Gemini client using either a provided user key 
 * or the default system key from environment variables.
 */
export const getGeminiClient = (userKey?: string | null) => {
    const apiKey = userKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
        throw new Error("API_KEY_MISSING");
    }

    return new GoogleGenAI({ apiKey });
};

/**
 * Dynamically selects the best available model for the given API key.
 * Prioritizes stable models over experimental ones.
 */
export async function getEffectiveModel(ai: GoogleGenAI, apiKey: string): Promise<string> {
    // Check cache first
    if (modelCache.has(apiKey)) {
        return modelCache.get(apiKey)!;
    }

    const stableCandidates = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    const expCandidates = ['gemini-2.0-flash-exp'];

    let availableModels: string[] = [];

    try {
        const response = await ai.models.list();
        availableModels = response.page.map(m => m.name.replace('models/', ''));
        console.log("[AI Service] Available models:", availableModels);
    } catch (error: any) {
        const message = String(error?.message || '');
        if (message.includes('API_KEY_INVALID') || message.includes('not valid')) {
            throw new Error("INVALID_KEY");
        }
        if (message.includes('429') || message.toLowerCase().includes('quota')) {
            throw new Error("RATE_LIMIT");
        }
        console.warn("[AI Service] Could not list models, using fallback list.", error);
    }

    const preferred = availableModels.length > 0
        ? [...stableCandidates.filter(c => availableModels.includes(c)), ...expCandidates.filter(c => availableModels.includes(c))]
        : [...stableCandidates, ...expCandidates];

    if (preferred.length === 0) {
        throw new Error("NO_SUITABLE_MODEL");
    }

    const selected = preferred[0];
    modelCache.set(apiKey, selected);
    return selected;
}

/**
 * Clears the model cache (useful when API key is updated)
 */
export const clearModelCache = (apiKey?: string) => {
    if (apiKey) {
        modelCache.delete(apiKey);
    } else {
        modelCache.clear();
    }
};

/**
 * Validates if a Gemini API key is functional and has a suitable model available.
 */
export const validateGeminiKey = async (key: string): Promise<{ valid: boolean, error?: string, code?: AIErrorCode }> => {
    if (!key || key.trim() === "") return { valid: false, error: "La llave está vacía", code: 'API_KEY_MISSING' };

    try {
        console.log("[AI Service] Validating key and discoverying models...");
        const ai = new GoogleGenAI({ apiKey: key });

        // This will find, test and cache the best model
        const modelName = await getEffectiveModel(ai, key);

        return { valid: true };
    } catch (error: any) {
        console.error("[AI Service] Validation failed:", error.message);

        let code: AIErrorCode = 'UNKNOWN_ERROR';
        let friendlyError = "Error desconocido al validar la llave";

        if (error.message === "NO_SUITABLE_MODEL") {
            code = 'NO_SUITABLE_MODEL';
            friendlyError = "No se encontraron modelos compatibles con esta llave o región.";
        } else if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("not valid")) {
            code = 'INVALID_KEY';
            friendlyError = "La llave ingresada es inválida. Verificá que sea correcta.";
        } else if (error.message?.includes("quota")) {
            code = 'RATE_LIMIT';
            friendlyError = "Se ha superado la cuota de uso. Intentá de nuevo más tarde.";
        }

        return {
            valid: false,
            error: friendlyError,
            code
        };
    }
};

/**
 * Service to analyze financial data using Gemini
 */
export const analyzeFinancialHealth = async (
    apiKey: string,
    data: {
        monthlyIncome: number;
        monthlyExpenses: number;
        savingsRate: number;
        topCategories: { category: string; amount: number }[];
    }
) => {
    try {
        const ai = getGeminiClient(apiKey);
        const model = await getEffectiveModel(ai, apiKey);

        const prompt = `Actúa como un asesor financiero experto en Argentina. 
    Analiza mis finanzas del último mes:
    - Ingresos: $${data.monthlyIncome}
    - Gastos: $${data.monthlyExpenses} (Tasa de ahorro: ${data.savingsRate}%)
    - Gastos por categoría: ${data.topCategories.map(c => `${c.category}: $${c.amount}`).join(', ')}
 
    Proporciona 3 consejos accionables, específicos y breves para mejorar mi situación financiera. 
    Mantené un tono alentador pero profesional. Usa términos locales (ARS, pesos, etc).
    Respondé directamente con los 3 puntos.`;

        const result = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = result.text;
        return text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    } catch (error: any) {
        console.error("[AI Service] Error analyzing health:", error);
        throw error;
    }
};
/**
 * Retrieves daily financial advice, using cached version from DB if available for today.
 */
export const getDailyAdvice = async (
    userId: string,
    apiKey: string,
    data: {
        monthlyIncome: number;
        monthlyExpenses: number;
        savingsRate: number;
        topCategories: { category: string; amount: number }[];
    },
    forceRefresh: boolean = false
) => {
    try {
        // 1. Check DB for today's advice
        const today = new Date().toISOString().split('T')[0];

        if (!forceRefresh) {
            const { data: cached, error: cacheError } = await supabase
                .from('daily_insights')
                .select('content')
                .eq('user_id', userId)
                .eq('date', today)
                .maybeSingle();

            if (cached && cached.content) {
                console.log("[AI Service] Returning cached advice for today");
                return cached.content as string[];
            }
        }

        // 2. Generate new advice if no cache
        console.log(`[AI Service] Generating new advice (force=${forceRefresh})...`);
        const advice = await analyzeFinancialHealth(apiKey, data);

        // 3. Save to DB
        // We use upsert to handle potential race conditions safely
        const { error: saveError } = await supabase
            .from('daily_insights')
            .upsert({
                user_id: userId,
                date: today,
                content: advice
            }, { onConflict: 'user_id, date' });

        if (saveError) {
            console.warn("[AI Service] Failed to cache advice:", saveError);
        }

        return advice;
    } catch (error) {
        console.error("[AI Service] Error in getDailyAdvice:", error);
        throw error;
    }
};

/**
 * Service to extract expenses from images/PDFs using Gemini.
 * Uses dynamic model selection to avoid 404 errors.
 */
type AIFilePart = { data: string; mimeType: string } | { text: string };

export const extractExpensesFromImages = async (
    apiKey: string,
    files: AIFilePart[]
) => {
    try {
        const ai = getGeminiClient(apiKey);
        const model = await getEffectiveModel(ai, apiKey);

        const parts = files.map(file => (
            'text' in file
                ? { text: file.text }
                : { inlineData: file }
        ));

        parts.push({
            text: EXTRACTION_PROMPT
        } as any);

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING },
                    merchant: { type: Type.STRING },
                    category: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    currency: { type: Type.STRING },
                    installments: { type: Type.STRING, nullable: true },
                    is_recurring: { type: Type.BOOLEAN },
                    raw_date: { type: Type.STRING, nullable: true },
                },
                required: ["date", "merchant", "category", "amount", "currency", "is_recurring"]
            }
        };

        const result = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const text = result.text;
        return JSON.parse(text || "[]");
    } catch (error: any) {
        console.error("[AI Service] Error extracting expenses:", error);
        throw error;
    }
};
