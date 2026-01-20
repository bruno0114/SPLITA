-- Migration to support Group Settings and Invites

-- 1. Add image_url to groups if missing
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add invite_code to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 3. Function to generate random alphanumeric code
CREATE OR REPLACE FUNCTION generate_invite_code(length INT DEFAULT 8) 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Fill existing groups with invite codes
UPDATE public.groups SET invite_code = generate_invite_code() WHERE invite_code IS NULL;

-- 5. Trigger to automatically generate invite code on group creation
CREATE OR REPLACE FUNCTION public.tr_generate_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_on_group_create_invite ON public.groups;
CREATE TRIGGER tr_on_group_create_invite
  BEFORE INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.tr_generate_group_invite_code();
