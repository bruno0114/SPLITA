
-- FIX: Simplify Transaction Visibility
-- Ensure users can ALWAYS see their own splits and relevant transactions.

-- 1. Simple Policy for Transaction Splits
-- If a split belongs to me (user_id = auth.uid()), I must see it.
DROP POLICY IF EXISTS "Users can view splits of their group transactions" ON public.transaction_splits;
DROP POLICY IF EXISTS "Users can view their own splits" ON public.transaction_splits;

CREATE POLICY "Users can view their own splits"
ON public.transaction_splits
FOR SELECT
USING (
  user_id = auth.uid()
);

-- 2. Ensure Transactions are visible if I have a split in them
-- Even if group membership check implies otherwise, if I owe money, I need to see the transaction.
DROP POLICY IF EXISTS "Users can view transactions of their groups" ON public.transactions;
DROP POLICY IF EXISTS "Users can view relevant transactions" ON public.transactions;

CREATE POLICY "Users can view relevant transactions"
ON public.transactions
FOR SELECT
USING (
  -- I can see transactions if:
  -- 1. I am the payer
  payer_id = auth.uid() OR
  -- 2. I created it
  created_by = auth.uid() OR
  -- 3. I have a split in it (Subquery check)
  EXISTS (
    SELECT 1 FROM public.transaction_splits s
    WHERE s.transaction_id = id AND s.user_id = auth.uid()
  ) OR
  -- 4. I am a member of the group (Fallback)
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  )
);
