-- ULTIMATE RLS FIX FOR SPLITA (Hardened Version)
-- This script covers ALL tables with explicit operation-level policies to avoid silent RLS blocks.

------------------------------------------------------------------
-- 0. SECURITY HELPERS
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

------------------------------------------------------------------
-- 1. PROFILES
------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

------------------------------------------------------------------
-- 1.1 USER SECRETS (AI KEYS, TOKENS)
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  gemini_api_key text,
  updated_at timestamptz
);

ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own secrets" ON public.user_secrets;
CREATE POLICY "Users can view their own secrets" ON public.user_secrets
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own secrets" ON public.user_secrets;
CREATE POLICY "Users can insert their own secrets" ON public.user_secrets
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own secrets" ON public.user_secrets;
CREATE POLICY "Users can update their own secrets" ON public.user_secrets
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Optional cleanup if profiles has legacy gemini_api_key data
-- UPDATE public.profiles SET gemini_api_key = NULL WHERE gemini_api_key IS NOT NULL;

------------------------------------------------------------------
-- 2. GROUPS & MEMBERS
------------------------------------------------------------------
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Ensure group type metadata exists
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS type text DEFAULT 'other';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS custom_type_label text;

-- Groups
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
CREATE POLICY "Users can view groups they belong to" ON public.groups FOR SELECT USING (created_by = auth.uid() OR check_is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can update groups" ON public.groups;
CREATE POLICY "Owners can update groups" ON public.groups FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Owners can delete groups" ON public.groups;
CREATE POLICY "Owners can delete groups" ON public.groups FOR DELETE USING (created_by = auth.uid());

-- Members
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT USING (user_id = auth.uid() OR check_is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Creators can add members" ON public.group_members;
CREATE POLICY "Creators can add members" ON public.group_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (user_id = auth.uid());

------------------------------------------------------------------
-- 3. TRANSACTIONS (Group)
------------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group transactions" ON public.transactions;
CREATE POLICY "Users can view group transactions" ON public.transactions FOR SELECT USING (check_is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Users can add group transactions" ON public.transactions;
CREATE POLICY "Users can add group transactions" ON public.transactions FOR INSERT WITH CHECK (check_is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their group transactions" ON public.transactions;
CREATE POLICY "Users can update their group transactions" ON public.transactions FOR UPDATE USING (payer_id = auth.uid() OR created_by = auth.uid()) WITH CHECK (payer_id = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their group transactions" ON public.transactions;
CREATE POLICY "Users can delete their group transactions" ON public.transactions FOR DELETE USING (payer_id = auth.uid() OR created_by = auth.uid());

------------------------------------------------------------------
-- 4. TRANSACTION_SPLITS
------------------------------------------------------------------
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group splits" ON public.transaction_splits;
CREATE POLICY "Users can view group splits" ON public.transaction_splits FOR SELECT USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND check_is_group_member(t.group_id, auth.uid())));

DROP POLICY IF EXISTS "Users can manage group splits" ON public.transaction_splits;
CREATE POLICY "Users can manage group splits" ON public.transaction_splits FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_id AND (t.payer_id = auth.uid() OR t.created_by = auth.uid())
  )
);

------------------------------------------------------------------
-- 5. PERSONAL_TRANSACTIONS
------------------------------------------------------------------
ALTER TABLE public.personal_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their personal transactions" ON public.personal_transactions;
CREATE POLICY "Users can view their personal transactions" ON public.personal_transactions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their personal transactions" ON public.personal_transactions;
CREATE POLICY "Users can insert their personal transactions" ON public.personal_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their personal transactions" ON public.personal_transactions;
CREATE POLICY "Users can update their personal transactions" ON public.personal_transactions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their personal transactions" ON public.personal_transactions;
CREATE POLICY "Users can delete their personal transactions" ON public.personal_transactions FOR DELETE USING (user_id = auth.uid());

------------------------------------------------------------------
-- 6. CATEGORIES
------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (is_system = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert categories" ON public.categories;
CREATE POLICY "Users can insert categories" ON public.categories FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their categories" ON public.categories;
CREATE POLICY "Users can update their categories" ON public.categories FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their categories" ON public.categories;
CREATE POLICY "Users can delete their categories" ON public.categories FOR DELETE USING (user_id = auth.uid());

------------------------------------------------------------------
-- 6.1 AI IMPORT SESSIONS
------------------------------------------------------------------
ALTER TABLE public.ai_import_sessions ADD COLUMN IF NOT EXISTS reimport_count integer DEFAULT 0;

------------------------------------------------------------------
-- 7. NOTIFICATIONS
------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  read_at timestamptz
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their notifications" ON public.notifications;
CREATE POLICY "Users can insert their notifications" ON public.notifications
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR (
    group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_members gm_sender
      WHERE gm_sender.group_id = group_id AND gm_sender.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.group_members gm_target
      WHERE gm_target.group_id = group_id AND gm_target.user_id = user_id
    )
  )
);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
