
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/context/CurrencyContext';

interface AnimatedPriceProps {
    amount: number; // Base amount in ARS
    originalAmount?: number;
    originalCurrency?: string;
    className?: string;
    showCode?: boolean;
    /**
     * If true, skip currency conversion and display the amount as-is.
     * Use this when the amount has already been converted or is in the display currency.
     */
    skipConversion?: boolean;
}

const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
    amount,
    originalAmount,
    originalCurrency,
    className = "",
    showCode = false,
    skipConversion = false
}) => {
    const { currency, exchangeRate } = useCurrency();

    const isUSD = currency === 'USD';

    // Determine display amount based on conversion settings
    let displayAmount: number;
    if (skipConversion) {
        // Amount is already in the target currency, display as-is
        displayAmount = amount;
    } else if (isUSD && originalCurrency === 'USD' && originalAmount !== undefined) {
        // Use original USD amount if available (avoids round-trip conversion loss)
        displayAmount = originalAmount;
    } else {
        // Standard conversion: ARS stored, convert to USD if needed
        displayAmount = isUSD ? amount / exchangeRate : amount;
    }

    const formatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: isUSD ? 'USD' : 'ARS',
        minimumFractionDigits: isUSD ? 2 : 0,
        maximumFractionDigits: isUSD ? 2 : 0,
    }).format(displayAmount);

    return (
        <span className={`relative inline-block overflow-hidden ${className}`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={currency}
                    initial={{ y: 20, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -20, opacity: 0, rotateX: 90 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.4
                    }}
                    className="inline-block origin-center"
                >
                    {formatted}
                    {showCode && (
                        <span className="ml-1 text-[0.7em] opacity-50 font-bold">
                            {currency}
                        </span>
                    )}
                </motion.span>
            </AnimatePresence>

            {/* Glow Effect on Change */}
            <AnimatePresence>
                <motion.span
                    key={currency + "_glow"}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.4] }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-blue-400 blur-xl rounded-full -z-10"
                />
            </AnimatePresence>
        </span>
    );
};

export default AnimatedPrice;
