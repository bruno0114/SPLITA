/**
 * category-resolver.ts
 * ID-based category resolution with fuzzy fallback for legacy data.
 *
 * This module provides consistent category resolution across the app,
 * replacing the scattered fuzzy matching logic.
 */

import { CATEGORY_CONFIG, getCategoryConfig } from './constants';

/**
 * Exhaustive mapping of known category strings to canonical IDs.
 * Handles common variations, typos, and legacy data.
 */
const CATEGORY_ALIAS_MAP: Record<string, string> = {
    // Compras
    'compras': 'compras',
    'compra': 'compras',
    'shopping': 'compras',
    'shop': 'compras',

    // Supermercado
    'supermercado': 'supermercado',
    'super': 'supermercado',
    'mercado': 'supermercado',
    'grocery': 'supermercado',
    'groceries': 'supermercado',

    // Gastronomia
    'gastronomia': 'gastronomia',
    'gastronomía': 'gastronomia',
    'comida': 'gastronomia',
    'food': 'gastronomia',
    'restaurant': 'gastronomia',
    'restaurante': 'gastronomia',
    'cafe': 'gastronomia',
    'café': 'gastronomia',
    'bar': 'gastronomia',

    // Servicios
    'servicios': 'servicios',
    'servicio': 'servicios',
    'services': 'servicios',
    'luz': 'servicios',
    'gas': 'servicios',
    'internet': 'servicios',
    'netflix': 'servicios',
    'spotify': 'servicios',
    'streaming': 'servicios',
    'telefono': 'servicios',
    'teléfono': 'servicios',

    // Transporte
    'transporte': 'transporte',
    'transport': 'transporte',
    'nafta': 'transporte',
    'combustible': 'transporte',
    'uber': 'transporte',
    'subte': 'transporte',
    'colectivo': 'transporte',
    'taxi': 'transporte',
    'auto': 'transporte',

    // Casa
    'casa': 'casa',
    'home': 'casa',
    'hogar': 'casa',
    'alquiler': 'casa',
    'rent': 'casa',
    'expensas': 'casa',

    // Viajes
    'viajes': 'viajes',
    'viaje': 'viajes',
    'travel': 'viajes',
    'vuelo': 'viajes',
    'hotel': 'viajes',
    'vacaciones': 'viajes',

    // Varios (fallback)
    'varios': 'varios',
    'otros': 'varios',
    'other': 'varios',
    'misc': 'varios',
};

/**
 * Normalize a category string for lookup.
 * Removes accents and converts to lowercase.
 */
const normalizeCategory = (input: string): string => {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
};

/**
 * Resolve a category string to its canonical ID.
 *
 * Resolution order:
 * 1. Direct match in alias map
 * 2. Prefix match (e.g., "supermercado chino" -> "supermercado")
 * 3. Contains match (legacy fuzzy behavior)
 * 4. Fallback to 'varios'
 *
 * @param input - Category string from transaction
 * @returns Canonical category ID (key in CATEGORY_CONFIG)
 */
export const resolveCategoryId = (input: string | null | undefined): string => {
    if (!input) return 'varios';

    const normalized = normalizeCategory(input);

    // 1. Direct match
    if (CATEGORY_ALIAS_MAP[normalized]) {
        return CATEGORY_ALIAS_MAP[normalized];
    }

    // 2. Prefix match (handles "supermercado chino", "restaurante italiano", etc.)
    for (const [alias, id] of Object.entries(CATEGORY_ALIAS_MAP)) {
        if (normalized.startsWith(alias)) {
            return id;
        }
    }

    // 3. Contains match (legacy fuzzy behavior for backwards compatibility)
    for (const [alias, id] of Object.entries(CATEGORY_ALIAS_MAP)) {
        if (normalized.includes(alias) && alias.length >= 4) {
            // Only match substrings 4+ chars to avoid false positives
            return id;
        }
    }

    // 4. Fallback
    return 'varios';
};

/**
 * Get the display configuration for a category by its ID.
 *
 * @param categoryId - Canonical category ID
 * @returns Category config with label, icon, colors
 */
export const getCategoryConfigById = (categoryId: string) => {
    return CATEGORY_CONFIG[categoryId] || CATEGORY_CONFIG['varios'];
};

/**
 * Resolve a category string and return its full configuration.
 * Convenience function combining resolution and config lookup.
 *
 * @param input - Category string from transaction
 * @returns Category config with id, label, icon, colors
 */
export const resolveCategory = (input: string | null | undefined) => {
    const id = resolveCategoryId(input);
    const config = getCategoryConfigById(id);
    return {
        id,
        ...config
    };
};

/**
 * Get all category IDs (for iteration/filtering).
 */
export const getAllCategoryIds = (): string[] => {
    return Object.keys(CATEGORY_CONFIG);
};

/**
 * Check if a category ID is valid (exists in config).
 */
export const isValidCategoryId = (id: string): boolean => {
    return id in CATEGORY_CONFIG;
};
