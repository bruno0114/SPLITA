-- AI Chat tables for SPLITA

-- 1) Preferences
CREATE TABLE IF NOT EXISTS public.ai_user_prefs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tone text NOT NULL DEFAULT 'porteño',
  humor text NOT NULL DEFAULT 'soft',
  verbosity text NOT NULL DEFAULT 'normal',
  custom_rules text,
  interest_topics text[] NOT NULL DEFAULT '{}',
  learning_opt_in boolean NOT NULL DEFAULT false,
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

-- 7) Learned intents (user + global)
CREATE TABLE IF NOT EXISTS public.ai_user_intents (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intent_key text NOT NULL,
  examples text[] NOT NULL DEFAULT '{}',
  sample_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, intent_key)
);

ALTER TABLE public.ai_user_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their intents" ON public.ai_user_intents;
CREATE POLICY "Users can view their intents" ON public.ai_user_intents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their intents" ON public.ai_user_intents;
CREATE POLICY "Users can upsert their intents" ON public.ai_user_intents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_global_intents (
  intent_key text PRIMARY KEY,
  examples text[] NOT NULL DEFAULT '{}',
  sample_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  embedding jsonb
);

-- 5) Chat sessions (summary + persistence)
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary text,
  summary_updated_at timestamptz,
  summary_message_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can view their chat sessions" ON public.ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can upsert their chat sessions" ON public.ai_chat_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6) Chat messages (last 30 kept)
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_chat_sessions(session_id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat messages" ON public.ai_chat_messages;
CREATE POLICY "Users can view their chat messages" ON public.ai_chat_messages
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.ai_chat_sessions WHERE session_id = ai_chat_messages.session_id));

DROP POLICY IF EXISTS "Users can insert their chat messages" ON public.ai_chat_messages;
CREATE POLICY "Users can insert their chat messages" ON public.ai_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.ai_chat_sessions WHERE session_id = ai_chat_messages.session_id));

DROP POLICY IF EXISTS "Users can delete their chat messages" ON public.ai_chat_messages;
CREATE POLICY "Users can delete their chat messages" ON public.ai_chat_messages
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.ai_chat_sessions WHERE session_id = ai_chat_messages.session_id));
  