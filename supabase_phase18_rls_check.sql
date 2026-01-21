-- PHASE 18: RLS Verification Check
-- Logic: We previously implemented 'check_is_group_member' as SECURITY DEFINER.
-- If the policies for 'transactions' and 'transaction_splits' use this function,
-- then a newly added member (via join_group_by_code) will immediately pass this check.

-- 1. Verify Transactions Policy
-- Policy "Users can view relevant transactions" uses: auth.uid() = payer_id OR ... OR check_is_group_member(group_id, auth.uid())

-- 2. Verify Transaction Splits Policy
-- Policy "Users can view splits of their group transactions" uses: EXISTS (SELECT 1 FROM transactions ... check_is_group_member...)

-- CONCLUSION:
-- As long as 'check_is_group_member' checks the 'group_members' table, and 'join_group_by_code' inserts into 'group_members',
-- NO NEW RLS POLICIES ARE NEEDED. The system is reactive.

-- We just re-assert the helper function to be absolutely sure it's correct.
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
