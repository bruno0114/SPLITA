---
phase: bugfix
plan: 1
wave: 1
---

# Plan BF.1: Fix Avatar Handling

## Objective
Fix user avatar to show Google profile picture for OAuth users, and generate proper avatar for email signup users. Current bug: all users get same hardcoded avatar URL.

## Context
- .gsd/ARCHITECTURE.md
- src/features/auth/pages/Onboarding.tsx (line 400: hardcoded avatar)
- src/components/layout/Sidebar.tsx (reads user_metadata.avatar_url)
- Supabase trigger: handle_new_user syncs auth.users to profiles

## Root Cause Analysis

1. **Onboarding.tsx line 400**: Sets `avatar_url: 'https://ui-avatars.com/api/?name=' + email.split('@')[0]` for ALL signups
2. **Google OAuth**: Google provides avatar in `user.user_metadata.picture` (NOT `avatar_url`)
3. **Supabase trigger**: Should copy `raw_user_meta_data->>'avatar_url'` to profiles, but Google sends `picture` not `avatar_url`

## Tasks

<task type="auto">
  <name>Fix Supabase trigger to use Google's picture field</name>
  <files>Supabase migration</files>
  <action>
    Create migration to update handle_new_user trigger:
    - Use COALESCE to check for 'picture' (Google) or 'avatar_url' (email signup)
    - Also sync email from auth.users to profiles
  </action>
  <verify>Check trigger definition in Supabase</verify>
  <done>Trigger uses COALESCE(picture, avatar_url, generated_url)</done>
</task>

<task type="auto">
  <name>Remove hardcoded avatar from Onboarding signup</name>
  <files>src/features/auth/pages/Onboarding.tsx</files>
  <action>
    In handleSignUp function:
    - Remove hardcoded avatar_url from signUp options.data
    - Let the Supabase trigger generate proper avatar on insert
    - For email signup, generate avatar only if not provided by OAuth
  </action>
  <verify>grep -n "avatar_url" src/features/auth/pages/Onboarding.tsx</verify>
  <done>No hardcoded avatar_url in signup metadata</done>
</task>

<task type="auto">
  <name>Fix Sidebar to fallback properly</name>
  <files>src/components/layout/Sidebar.tsx</files>
  <action>
    Update userAvatar line to check:
    1. user_metadata.picture (Google)
    2. user_metadata.avatar_url (email signup)
    3. Generate from name if neither exists
  </action>
  <verify>grep "userAvatar" src/components/layout/Sidebar.tsx</verify>
  <done>Sidebar correctly shows Google avatar or generates fallback</done>
</task>

## Success Criteria
- [ ] Google OAuth users see their Google profile picture
- [ ] Email signup users see generated avatar from their name
- [ ] No hardcoded avatar URLs in codebase
