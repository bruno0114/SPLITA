-- PHASE 18: Secure Group Join RPCs

-- 1. Function: get_group_details_by_code
-- Returns public group information for preview before joining.
-- SECURITY DEFINER: Allows non-members to see basic info if they have the code.
CREATE OR REPLACE FUNCTION public.get_group_details_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  name text,
  image_url text,
  member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.image_url,
    (SELECT count(*) FROM public.group_members gm WHERE gm.group_id = g.id) as member_count
  FROM public.groups g
  WHERE g.invite_code = p_code;
END;
$$;

-- 2. Function: join_group_by_code
-- Adds the authenticated user to the group if the code is valid.
-- SECURITY DEFINER: Allows insertion into group_members even if RLS normally blocks purely based on 'code'.
CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
DECLARE
  v_group_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find group by code (Exact match)
  SELECT id INTO v_group_id
  FROM public.groups
  WHERE invite_code = p_code;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if already a member (Idempotency)
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id AND user_id = v_user_id
  ) THEN
    RETURN v_group_id; -- Return successfully if already member
  END IF;

  -- Insert new member
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'member');

  RETURN v_group_id;
END;
$$;
