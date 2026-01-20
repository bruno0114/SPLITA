import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

/**
 * Returns a Gemini client using either a provided user key 
 * or the default system key from environment variables.
 */
export const getGeminiClient = (userKey?: string | null) => {
    const apiKey = userKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("No Gemini API Key found. Please configure it in Settings or .env");
    }

    return new GoogleGenAI(apiKey);
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
        const model = "gemini-2.0-flash-exp";

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

        // Split by lines or format into array
        return text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    } catch (error) {
        console.error("[AI Service] Error analyzing health:", error);
        throw error;
    }
};
