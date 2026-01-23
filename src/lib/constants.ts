// --- APP CONFIGURATION ---

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'compras': { id: 'compras', label: 'Compras', icon: 'ShoppingBag', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'supermercado': { id: 'supermercado', label: 'Supermercado', icon: 'ShoppingCart', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'gastronomia': { id: 'gastronomia', label: 'Gastronomía', icon: 'Coffee', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'servicios': { id: 'servicios', label: 'Servicios', icon: 'Zap', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'transporte': { id: 'transporte', label: 'Transporte', icon: 'Car', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  'casa': { id: 'casa', label: 'Casa', icon: 'Home', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'viajes': { id: 'viajes', label: 'Viajes', icon: 'Plane', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  'varios': { id: 'varios', label: 'Varios', icon: 'MoreHorizontal', color: 'text-slate-500', bg: 'bg-slate-500/10' }
};

/**
 * Get category configuration by category name.
 * Uses fuzzy matching for backwards compatibility.
 *
 * @deprecated Use resolveCategoryId from category-resolver.ts for consistent ID-based resolution
 */
export const getCategoryConfig = (categoryName: string): CategoryConfig => {
  const normalized = (categoryName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes('super')) return CATEGORY_CONFIG['supermercado'];
  if (normalized.includes('compra') || normalized.includes('shop')) return CATEGORY_CONFIG['compras'];
  if (normalized.includes('gastro') || normalized.includes('comida') || normalized.includes('cafe') || normalized.includes('restaurante')) return CATEGORY_CONFIG['gastronomia'];
  if (normalized.includes('servicio') || normalized.includes('luz') || normalized.includes('gas') || normalized.includes('internet') || normalized.includes('netflix')) return CATEGORY_CONFIG['servicios'];
  if (normalized.includes('transporte') || normalized.includes('nafta') || normalized.includes('uber') || normalized.includes('subte')) return CATEGORY_CONFIG['transporte'];
  if (normalized.includes('casa') || normalized.includes('alquiler') || normalized.includes('expensas')) return CATEGORY_CONFIG['casa'];
  if (normalized.includes('viaje')) return CATEGORY_CONFIG['viajes'];

  return CATEGORY_CONFIG['varios'];
};

/**
 * Get all category IDs.
 */
export const getAllCategoryIds = (): string[] => {
  return Object.keys(CATEGORY_CONFIG);
};
