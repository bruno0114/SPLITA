-- AI Chat tables for SPLITA

-- 1) Preferences
CREATE TABLE IF NOT EXISTS public.ai_user_prefs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tone text NOT NULL DEFAULT 'porteño',
  humor text NOT NULL DEFAULT 'soft',
  verbosity text NOT NULL DEFAULT 'normal',
  custom_rules text,
  interest_topics text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_user_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat prefs" ON public.ai_user_prefs;
CREATE POLICY "Users can view their chat prefs" ON public.ai_user_prefs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their chat prefs" ON public.ai_user_prefs;
CREATE POLICY "Users can upsert their chat prefs" ON public.ai_user_prefs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Consent tracking
CREATE TABLE IF NOT EXISTS public.ai_user_consents (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  chat_terms_accepted_at timestamptz,
  chat_terms_version text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat consent" ON public.ai_user_consents;
CREATE POLICY "Users can view their chat consent" ON public.ai_user_consents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their chat consent" ON public.ai_user_consents;
CREATE POLICY "Users can upsert their chat consent" ON public.ai_user_consents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) Context cache
CREATE TABLE IF NOT EXISTS public.ai_context_cache (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_updated_at timestamptz,
  dirty boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1
);

ALTER TABLE public.ai_context_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat cache" ON public.ai_context_cache;
CREATE POLICY "Users can view their chat cache" ON public.ai_context_cache
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their chat cache" ON public.ai_context_cache;
CREATE POLICY "Users can upsert their chat cache" ON public.ai_context_cache
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) Chat suggestions (lightweight personalization)
CREATE TABLE IF NOT EXISTS public.ai_chat_suggestions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, prompt)
);

ALTER TABLE public.ai_chat_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat suggestions" ON public.ai_chat_suggestions;
CREATE POLICY "Users can view their chat suggestions" ON public.ai_chat_suggestions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their chat suggestions" ON public.ai_chat_suggestions;
CREATE POLICY "Users can upsert their chat suggestions" ON public.ai_chat_suggestions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
