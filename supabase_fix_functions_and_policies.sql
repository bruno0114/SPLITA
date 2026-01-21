-- FIX: Ensure Helper Functions Exist and are Security Definer
-- This script defines the necessary helper functions to break RLS recursion and properly checking membership.

-- 1. Function: check_is_group_member
-- Checks if a user is a member of a group.
-- Must be SECURITY DEFINER to bypass RLS on group_members.
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

-- 2. Function: check_user_has_split
-- Checks if a user has a split in a transaction.
-- Must be SECURITY DEFINER to bypass RLS on transaction_splits (when called from transactions policy).
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

-- 3. Update Policy for 'transactions'
DROP POLICY IF EXISTS "Users can view relevant transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions of their groups" ON public.transactions;

CREATE POLICY "Users can view relevant transactions"
ON public.transactions
FOR SELECT
USING (
  payer_id = auth.uid() OR
  created_by = auth.uid() OR
  check_user_has_split(id, auth.uid()) OR -- Safe check (SD)
  check_is_group_member(group_id, auth.uid()) -- Safe check (SD)
);

-- 4. Update Policy for 'transaction_splits'
DROP POLICY IF EXISTS "Users can view splits of their group transactions" ON public.transaction_splits;
DROP POLICY IF EXISTS "Users can view their own splits" ON public.transaction_splits;

CREATE POLICY "Users can view splits of their group transactions"
ON public.transaction_splits
FOR SELECT
USING (
  user_id = auth.uid() OR
  -- We allow seeing splits if the transaction is visible. 
  -- Since transaction visibility is based on SD functions, this shouldn't recurse.
  -- But to be absolutely safe and avoid calling 'transactions' (which calls check_user_has_split -> transaction_splits),
  -- we can use a direct check if we are in the group of the transaction.
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id
    AND (
      t.payer_id = auth.uid() OR
      t.created_by = auth.uid() OR
      check_is_group_member(t.group_id, auth.uid())
    )
  )
);
