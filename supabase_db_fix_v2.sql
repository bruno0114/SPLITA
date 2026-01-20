-- 1. Add missing updated_at column to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Update foreign keys to support ON DELETE CASCADE
-- This ensures that when a group is deleted, all its members and transactions are also deleted.

-- For group_members
ALTER TABLE public.group_members 
  DROP CONSTRAINT IF EXISTS group_members_group_id_fkey,
  ADD CONSTRAINT group_members_group_id_fkey 
    FOREIGN KEY (group_id) 
    REFERENCES public.groups(id) 
    ON DELETE CASCADE;

-- For transactions
ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_group_id_fkey,
  ADD CONSTRAINT transactions_group_id_fkey 
    FOREIGN KEY (group_id) 
    REFERENCES public.groups(id) 
    ON DELETE CASCADE;

-- For transaction_splits
-- (These references a transaction, so deleting a transaction via the above cascade 
-- should already trigger this if the transaction fkey is correct)
ALTER TABLE public.transaction_splits 
  DROP CONSTRAINT IF EXISTS transaction_splits_transaction_id_fkey,
  ADD CONSTRAINT transaction_splits_transaction_id_fkey 
    FOREIGN KEY (transaction_id) 
    REFERENCES public.transactions(id) 
    ON DELETE CASCADE;

-- Also verify personal_transactions if needed (not group related but for hygiene)
-- ALTER TABLE public.personal_transactions 
--   DROP CONSTRAINT IF EXISTS personal_transactions_user_id_fkey,
--   ADD CONSTRAINT personal_transactions_user_id_fkey 
--     FOREIGN KEY (user_id) 
--     REFERENCES public.profiles(id) 
--     ON DELETE CASCADE;
