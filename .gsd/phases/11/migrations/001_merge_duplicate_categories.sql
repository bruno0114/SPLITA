-- Migration: Merge duplicate categories and add unique constraint
-- Created: 2026-01-20

-- 1. Identify and merge duplicates (case-insensitive name per user)
-- For each set of duplicates, we'll keep the oldest one (earliest created_at or lowest id)
-- and update all transactions/personal_transactions to point to the kept id.

DO $$
DECLARE
    r RECORD;
    keep_id UUID;
BEGIN
    -- Loop through duplicate sets
    FOR r IN 
        SELECT user_id, LOWER(TRIM(name)) as normalized_name, COUNT(*)
        FROM categories
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        -- Find the ID to keep (the one created first)
        SELECT id INTO keep_id 
        FROM categories 
        WHERE user_id = r.user_id AND LOWER(TRIM(name)) = r.normalized_name
        ORDER BY created_at ASC, id ASC
        LIMIT 1;

        -- Update group transactions
        UPDATE transactions 
        SET category = (SELECT name FROM categories WHERE id = keep_id)
        WHERE category IN (
            SELECT name FROM categories 
            WHERE user_id = r.user_id 
            AND LOWER(TRIM(name)) = r.normalized_name 
            AND id != keep_id
        );

        -- Update personal transactions
        UPDATE personal_transactions 
        SET category = (SELECT name FROM categories WHERE id = keep_id)
        WHERE category IN (
            SELECT name FROM categories 
            WHERE user_id = r.user_id 
            AND LOWER(TRIM(name)) = r.normalized_name 
            AND id != keep_id
        );

        -- Delete the duplicate categories (except the one we kept)
        DELETE FROM categories 
        WHERE user_id = r.user_id 
        AND LOWER(TRIM(name)) = r.normalized_name 
        AND id != keep_id;
    END LOOP;
END $$;

-- 2. Add unique constraint to prevent future duplicates
-- We use a unique index on (user_id, LOWER(TRIM(name)))
-- Note: We only apply this to user-scoped categories (where user_id is not null)
-- System categories (is_system = true) might have NULL user_id.

CREATE UNIQUE INDEX IF NOT EXISTS unique_category_name_per_user_idx 
ON categories (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), LOWER(TRIM(name)));
