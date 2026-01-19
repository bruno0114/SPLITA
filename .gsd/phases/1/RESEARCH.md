# Research: Phase 1 (Auth & Onboarding Persistence)

## Onboarding State Management
Current `Onboarding.tsx` uses a local `step` state. To make it functional, we need:
1.  **Context/State Object**: To store choices across steps (Usage Type, Group Name, Members, Settings).
2.  **Delayed Persistence**: Since `signUp` happens at step 6, we should ideally:
    -   Collect all data in a local object.
    -   Perform `signUp` at step 6.
    -   Immediately after success, create the items (profile metadata, group, members, preferences) in Supabase.

## Social Auth
-   **Email/Password**: Already implemented (via `signUp` call in step 6).
-   **Google/Facebook**: Handled by `supabase.auth.signInWithOAuth`.
-   **Configuration Required**:
    -   Supabase Dashboard: Enable Google/Facebook providers.
    -   Client ID / Client Secret from Google/Meta.
    -   Redirect URL: Must match the app URL (e.g., `http://localhost:5173`) and be configured in Supabase.

## Database Schema Mapping
-   **Step 2 (Usage Type)**: Save to `profiles.metadata` or a new `usage_type` column.
-   **Step 3 (Group Name)**: Insert into `groups` table.
-   **Step 4 (Add People)**: Insert into `group_members` (emails or invite IDs).
-   **Step 5 (Settings)**: Insert into a `user_preferences` table or `profiles.metadata`.

## Discovery: "invite flow"
The user mentioned a critical requirement for invitations.
-   Step 4 currently has mock members.
-   Real flow: Generate a `uuid` for the group and a shareable link.
-   We need a `groups.invite_code` column.

## Discovery: "Gemini API Key"
-   Requirement: Design UI to manage the key.
-   Storage: Local storage or `profiles.metadata`. Local storage is safer for an MVP to avoid DB leakage of personal keys, but meta is better for sync. We'll use encrypted-like storage in metadata.
