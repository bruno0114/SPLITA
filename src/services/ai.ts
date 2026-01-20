import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";

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
 * Performs a minimal smoke test on a model to verify generateContent capability.
 */
async function smokeTestModel(ai: GoogleGenAI, modelName: string): Promise<boolean> {
    try {
        const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: 'OK' }] }],
            config: { maxOutputTokens: 5 }
        });
        return !!(result && result.text);
    } catch (error) {
        console.warn(`[AI Service] Smoke test failed for ${modelName}:`, error);
        return false;
    }
}

/**
 * Dynamically selects the best available model for the given API key.
 * Prioritizes stable models over experimental ones.
 */
async function getEffectiveModel(ai: GoogleGenAI, apiKey: string): Promise<string> {
    // Check cache first
    if (modelCache.has(apiKey)) {
        return modelCache.get(apiKey)!;
    }

    const stableCandidates = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    const expCandidates = ['gemini-2.0-flash-exp'];

    let availableModels: string[] = [];

    try {
        // Try to list models (best-effort)
        const response = await ai.models.list();
        availableModels = response.page.map(m => m.name.replace('models/', ''));
        console.log("[AI Service] Available models:", availableModels);
    } catch (error) {
        console.warn("[AI Service] Could not list models, using fallback list.", error);
    }

    // Determine candidates to test
    const toTest = availableModels.length > 0
        ? [...stableCandidates.filter(c => availableModels.includes(c)), ...expCandidates.filter(c => availableModels.includes(c))]
        : [...stableCandidates, ...expCandidates];

    // Find the first one that passes the smoke test
    for (const modelName of toTest) {
        if (await smokeTestModel(ai, modelName)) {
            console.log(`[AI Service] Selected and cached model: ${modelName}`);
            modelCache.set(apiKey, modelName);
            return modelName;
        }
    }

    throw new Error("NO_SUITABLE_MODEL");
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
 * Service to extract expenses from images/PDFs using Gemini.
 * Uses dynamic model selection to avoid 404 errors.
 */
export const extractExpensesFromImages = async (
    apiKey: string,
    files: { data: string, mimeType: string }[]
) => {
    try {
        const ai = getGeminiClient(apiKey);
        const model = await getEffectiveModel(ai, apiKey);

        const parts = files.map(file => ({
            inlineData: file
        }));

        parts.push({
            text: `Contexto: Sos un asistente financiero experto en Argentina. 
            Analizá los comprobantes adjuntos (pueden ser uno o varios).
            
            Tu objetivo es EXTRAR TODAS las transacciones individuales que encuentres. 
            No omitas nada. Si un ticket tiene múltiples items que sumados dan el total, podés extraer el total como una transacción o los items si parecen ser gastos de categorías distintas. 
            Lo más importante es que el USUARIO no tenga que cargar nada manualmente después.
            
            Respondé ÚNICAMENTE con un JSON array.
            
            Mapeo de Categorías (usar EXACTAMENTE estas strings):
            - 'Supermercado' (comida, bebidas, limpieza)
            - 'Gastronomía' (restaurantes, bares, delivery)
            - 'Servicios' (luz, gas, internet, suscripciones)
            - 'Transporte' (nafta, uber, sube)
            - 'Compras' (ropa, electrónica, regalos)
            - 'Varios' (otros)
    
            Campos requeridos por cada objeto del array:
            1. date (Formato YYYY-MM-DD ISO)
            2. merchant (Nombre del comercio o empresa)
            3. category (Una de las categorías de arriba de acuerdo al rubro del comercio)
            4. amount (Numero decimal. Convertí cualquier formato de moneda argentina a float estándar, ignorando el símbolo $ y manejando comas como puntos si es necesario).`
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
                },
                required: ["date", "merchant", "category", "amount"]
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
