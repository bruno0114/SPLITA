
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/context/CurrencyContext';

interface AnimatedPriceProps {
    amount: number; // Base amount in ARS
    className?: string;
    showCode?: boolean;
}

const AnimatedPrice: React.FC<AnimatedPriceProps> = ({ amount, className = "", showCode = false }) => {
    const { currency, exchangeRate } = useCurrency();

    const isUSD = currency === 'USD';
    const displayAmount = isUSD ? amount / exchangeRate : amount;

    const formatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: isUSD ? 'USD' : 'ARS',
        minimumFractionDigits: isUSD ? 2 : 0,
        maximumFractionDigits: isUSD ? 2 : 0,
    }).format(displayAmount);

    return (
        <div className={`relative inline-block overflow-hidden ${className}`}>
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
                <motion.div
                    key={currency + "_glow"}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.4] }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-blue-400 blur-xl rounded-full -z-10"
                />
            </AnimatePresence>
        </div>
    );
};

export default AnimatedPrice;
