
export interface DolarRate {
    compra: number;
    venta: number;
    casa: string;
    nombre: string;
    moneda: string;
    fechaActualizacion: string;
}

export const fetchDolarRates = async (): Promise<DolarRate[]> => {
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares');
        if (!response.ok) throw new Error('Failed to fetch dolar rates');
        return await response.json();
    } catch (error) {
        console.error('[DolarAPI] Error:', error);
        return [];
    }
};

export const getSpecificRate = async (type: string): Promise<DolarRate | null> => {
    try {
        const response = await fetch(`https://dolarapi.com/v1/dolares/${type}`);
        if (!response.ok) throw new Error(`Failed to fetch ${type} rate`);
        return await response.json();
    } catch (error) {
        console.error(`[DolarAPI] Error fetching ${type}:`, error);
        return null;
    }
};
