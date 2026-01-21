-- FIX: Missing RLS policies for personal_transactions
-- The table has RLS enabled but no policies, blocking ALL operations

-- Allow users to view their own personal transactions
CREATE POLICY "Users can view their own personal transactions"
ON public.personal_transactions
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to insert their own personal transactions  
CREATE POLICY "Users can insert their own personal transactions"
ON public.personal_transactions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own personal transactions
CREATE POLICY "Users can update their own personal transactions"
ON public.personal_transactions
FOR UPDATE
USING (user_id = auth.uid());

-- Allow users to delete their own personal transactions
CREATE POLICY "Users can delete their own personal transactions"
ON public.personal_transactions
FOR DELETE
USING (user_id = auth.uid());
