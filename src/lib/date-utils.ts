/**
 * date-utils.ts
 * Canonical date utilities for consistent date handling across the app.
 *
 * IMPORTANT: All date filtering should use these utilities to ensure
 * consistent behavior between pages (Categories, CategoryDetail, EconomicHealth).
 */

/**
 * Checks if a date string falls within the current month (local time).
 * Handles both YYYY-MM-DD and ISO datetime strings correctly.
 *
 * @param dateStr - Date string in YYYY-MM-DD or ISO format
 * @returns true if the date is in the current month
 */
export const isCurrentMonth = (dateStr: string): boolean => {
    if (!dateStr) return false;

    // Append noon time if missing to force local interpretation
    // (otherwise YYYY-MM-DD is parsed as UTC midnight which can shift to prev day locally)
    const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;

    const d = new Date(safeStr);
    const now = new Date();

    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/**
 * Get start and end dates of the current month as ISO date strings.
 * Useful for Supabase query filters.
 *
 * @returns Object with start (first day) and end (last day) as YYYY-MM-DD strings
 */
export const getCurrentMonthRange = (): { start: string; end: string } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of current month
    const start = new Date(year, month, 1);

    // Last day of current month (day 0 of next month = last day of current)
    const end = new Date(year, month + 1, 0);

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
};

/**
 * Get a human-readable label for the current month.
 *
 * @param locale - Locale string (default: 'es-AR')
 * @returns Formatted month label (e.g., "enero 2025")
 */
export const getCurrentMonthLabel = (locale: string = 'es-AR'): string => {
    return new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
};

/**
 * Check if a date falls within a given date range (inclusive).
 *
 * @param dateStr - Date string to check
 * @param startDate - Start of range (YYYY-MM-DD)
 * @param endDate - End of range (YYYY-MM-DD)
 * @returns true if date is within range
 */
export const isInDateRange = (dateStr: string, startDate?: string, endDate?: string): boolean => {
    if (!dateStr) return false;

    const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    const date = new Date(safeStr);

    if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (date < start) return false;
    }

    if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (date > end) return false;
    }

    return true;
};

/**
 * Parse a date string safely, handling both YYYY-MM-DD and ISO formats.
 *
 * @param dateStr - Date string to parse
 * @returns Date object or null if invalid
 */
export const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    const date = new Date(safeStr);

    return isNaN(date.getTime()) ? null : date;
};
