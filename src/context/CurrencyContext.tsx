
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDolarRates } from '@/services/dolar-api';
import { Currency } from '@/types/index';

type RateSource = 'blue' | 'cripto';

interface CurrencyContextType {
    currency: Currency;
    rateSource: RateSource;
    exchangeRate: number;
    rates: Record<string, number>;
    loading: boolean;
    setCurrency: (c: Currency) => void;
    setRateSource: (s: RateSource) => void;
    refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>(() => (localStorage.getItem('preferred_currency') as Currency) || 'ARS');
    const [rateSource, setRateSourceState] = useState<RateSource>(() => (localStorage.getItem('preferred_rate_source') as RateSource) || 'blue');
    const [rates, setRates] = useState<Record<string, number>>({ blue: 1100, cripto: 1150 });
    const [loading, setLoading] = useState(true);

    const refreshRates = useCallback(async () => {
        setLoading(true);
        const data = await fetchDolarRates();
        const newRates: Record<string, number> = {};

        data.forEach(rate => {
            if (rate.casa === 'blue') newRates.blue = rate.venta;
            if (rate.casa === 'cripto') newRates.cripto = rate.venta;
        });

        if (newRates.blue || newRates.cripto) {
            setRates(prev => ({ ...prev, ...newRates }));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        refreshRates();
        // Refresh every 5 minutes
        const interval = setInterval(refreshRates, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refreshRates]);

    const setCurrency = (c: Currency) => {
        setCurrencyState(c);
        localStorage.setItem('preferred_currency', c);
    };

    const setRateSource = (s: RateSource) => {
        setRateSourceState(s);
        localStorage.setItem('preferred_rate_source', s);
    };

    const exchangeRate = rates[rateSource] || rates.blue;

    return (
        <CurrencyContext.Provider value={{
            currency,
            rateSource,
            exchangeRate,
            rates,
            loading,
            setCurrency,
            setRateSource,
            refreshRates
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
    return context;
};
