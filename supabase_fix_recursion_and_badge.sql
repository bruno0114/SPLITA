-- FIX: RLS Infinite Recursion
-- The issue is: transactions -> query splits (rls) -> query transactions (rls) -> loop.
-- Solution: transactions -> query splits (SECURITY DEFINER, no rls) -> OK.

-- 1. Create SECURITY DEFINER function to check for splits
-- This function runs as owner (postgres), ignoring RLS on transaction_splits.
CREATE OR REPLACE FUNCTION public.check_user_has_split(p_transaction_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.transaction_splits 
    WHERE transaction_id = p_transaction_id AND user_id = p_user_id
  );
$$;

-- 2. Drop existing policies to be clean
DROP POLICY IF EXISTS "Users can view relevant transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions of their groups" ON public.transactions;

-- 3. Re-create Transactions Policy using the safe function
CREATE POLICY "Users can view relevant transactions"
ON public.transactions
FOR SELECT
USING (
  -- 1. Payer or Creator
  payer_id = auth.uid() OR
  created_by = auth.uid() OR
  -- 2. Has a split (Safe check)
  check_user_has_split(id, auth.uid()) OR
  -- 3. Member of group (Safe check via existing function)
  check_is_group_member(group_id, auth.uid())
);

-- 4. Ensure Transaction Splits policy is safe
-- Splits -> Transactions is fine, as long as Transactions doesn't check Splits RLS.
-- Since Transactions now uses check_user_has_split (bypassing Splits RLS), the chain is broken.
DROP POLICY IF EXISTS "Users can view splits of their group transactions" ON public.transaction_splits;
DROP POLICY IF EXISTS "Users can view their own splits" ON public.transaction_splits;

CREATE POLICY "Users can view splits of their group transactions"
ON public.transaction_splits
FOR SELECT
USING (
  -- I can see a split IF:
  -- 1. It is mine
  user_id = auth.uid() OR
  -- 2. It belongs to a transaction I can see (which implies I am in the group or created it)
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id
    -- Note: This recursively checks Transaction SELECT policy.
    -- Transaction SELECT policy calls check_user_has_split (no recursion on split RLS)
    -- OR check_is_group_member (no recursion).
    -- So this is safe.
  )
);
