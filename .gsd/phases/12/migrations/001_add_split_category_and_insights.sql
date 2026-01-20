-- 1. Add category column to transaction_splits
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_splits' AND column_name = 'category') THEN 
        ALTER TABLE "public"."transaction_splits" ADD COLUMN "category" text; 
    END IF; 
END $$;

-- 2. Backfill existing splits with data from parent transaction
UPDATE "public"."transaction_splits" ts
SET "category" = t.category
FROM "public"."transactions" t
WHERE ts.transaction_id = t.id
AND ts.category IS NULL;

-- 3. Create daily_insights table for AI Caching
CREATE TABLE IF NOT EXISTS "public"."daily_insights" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "date" date NOT NULL DEFAULT CURRENT_DATE,
    "content" jsonb NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY ("id"),
    CONSTRAINT "daily_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "daily_insights_user_date_key" UNIQUE ("user_id", "date")
);

-- 4. RLS for daily_insights
ALTER TABLE "public"."daily_insights" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own insights" 
ON "public"."daily_insights"
FOR ALL 
USING (auth.uid() = user_id);
