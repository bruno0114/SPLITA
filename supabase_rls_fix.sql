-- FIX: RLS Infinite Recursion in group_members
-- This migration creates a security definer function to check membership without recursion.

-- 1. Create a security definer function for membership checks
-- This function runs with the privileges of the creator (postgres), 
-- effectively bypassing RLS for the membership query itself.
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

-- 2. Update Policies for 'groups'
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Anyone can create a group" ON public.groups;

CREATE POLICY "Users can view groups they belong to"
ON public.groups
FOR SELECT
USING (
  created_by = auth.uid() OR check_is_group_member(id, auth.uid())
);

CREATE POLICY "Authenticated users can create groups"
ON public.groups
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners can update groups"
ON public.groups
FOR UPDATE
USING (created_by = auth.uid());

-- 3. Update Policies for 'group_members'
-- The infinite recursion usually happens here because the policy for group_members 
-- tries to check group_members to see if you can see group_members.
DROP POLICY IF EXISTS "Members can view their group_members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view members of their groups" ON public.group_members;

CREATE POLICY "Users can view members of their groups"
ON public.group_members
FOR SELECT
USING (
  user_id = auth.uid() OR check_is_group_member(group_id, auth.uid())
);

-- Allow inserting yourself into a group you created
CREATE POLICY "Creators can add members"
ON public.group_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id AND g.created_by = auth.uid()
  )
);

-- 4. Update Policies for 'transactions'
DROP POLICY IF EXISTS "Members can view transactions" ON public.transactions;
CREATE POLICY "Users can view transactions of their groups"
ON public.transactions
FOR SELECT
USING (
  check_is_group_member(group_id, auth.uid())
);

CREATE POLICY "Users can add transactions to their groups"
ON public.transactions
FOR INSERT
WITH CHECK (
  check_is_group_member(group_id, auth.uid())
);

-- 5. Update Policies for 'transaction_splits'
DROP POLICY IF EXISTS "Members can view splits" ON public.transaction_splits;
CREATE POLICY "Users can view splits of their group transactions"
ON public.transaction_splits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id AND check_is_group_member(t.group_id, auth.uid())
  )
);
