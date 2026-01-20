-- Migration: Create Categories Table
-- Description: Dynamic category management for personal and group expenses.

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'LayoutGrid',
    color TEXT DEFAULT 'text-slate-500',
    bg_color TEXT DEFAULT 'bg-slate-500/10',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure names are unique per user or system-wide
    CONSTRAINT unique_category_per_user UNIQUE (user_id, name)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view system categories or their own categories
CREATE POLICY "Categories are viewable by everyone if system or owner"
ON public.categories FOR SELECT
USING (is_system = true OR user_id = auth.uid());

-- 2. Users can insert their own categories
CREATE POLICY "Users can insert their own categories"
ON public.categories FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_system = false);

-- 3. Users can update their own categories
CREATE POLICY "Users can update their own categories"
ON public.categories FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Users can delete their own categories
CREATE POLICY "Users can delete their own categories"
ON public.categories FOR DELETE
USING (user_id = auth.uid());

-- Initial Seeding for System Categories (matching constants.ts)
INSERT INTO public.categories (name, icon, color, bg_color, is_system)
VALUES 
    ('Compras', 'ShoppingBag', 'text-orange-500', 'bg-orange-500/10', true),
    ('Supermercado', 'ShoppingCart', 'text-blue-500', 'bg-blue-500/10', true),
    ('Gastronomía', 'Coffee', 'text-emerald-500', 'bg-emerald-500/10', true),
    ('Servicios', 'Zap', 'text-purple-500', 'bg-purple-500/10', true),
    ('Transporte', 'Car', 'text-rose-500', 'bg-rose-500/10', true),
    ('Casa', 'Home', 'text-indigo-500', 'bg-indigo-500/10', true),
    ('Viajes', 'Plane', 'text-sky-500', 'bg-sky-500/10', true),
    ('Varios', 'MoreHorizontal', 'text-slate-500', 'bg-slate-500/10', true)
ON CONFLICT (user_id, name) DO NOTHING;
