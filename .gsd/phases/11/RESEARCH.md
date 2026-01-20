---
phase: 11
level: 2
researched_at: 2026-01-20
---

# Phase 11 Research: Expert Categories & UI Refactor

## Questions Investigated
1. **Database Schema**: How to move from hardcoded constants to a dynamic Supabase table?
2. **AI Auto-creation**: How to handle category discovery during Gemini imports?
3. **Premium Dropdown Component**: How to implement a global, pixel-perfect replacement for native selects?
4. **Colors & UX**: How to manage "color concreto" preferences efficiently?

## Findings

### 1. Database & Migration Strategy
The current system relies on `CATEGORY_CONFIG` in `constants.ts`. To enable CRUD, we will implement a `categories` table.
- **System Categories**: Seeded with `user_id = NULL`.
- **User Categories**: Created with `user_id = auth.uid()`.
- **Schema**:
    - `id`: UUID (PK)
    - `user_id`: UUID (FK to auth.users)
    - `name`: TEXT (Unique-ish per user)
    - `icon`: TEXT (Lucide icon name)
    - `color`: TEXT (Tailwind text-color class, e.g., 'text-blue-500')
    - `bg_color`: TEXT (Tailwind bg-color class with opacity, e.g., 'bg-blue-500/10')
    - `is_system`: BOOLEAN

**Recommendation**: Create a Supabase migration and a `useCategories` hook to fetch and cache these.

### 2. AI Auto-creation Flow
During the `ImportExpenses` process:
1. Gemini returns categories (e.g., "Sushi", "Expensas").
2. The logic will check if a category with that name exists for the user (or system).
3. If missing, it will automatically insert it into the `categories` table before finalizing the import.
4. Default icon (`LayoutGrid`) and a randomized color palette will be assigned if unknown.

### 3. Premium Dropdown Component
The user wants all selects to match the glassmorphic style seen in `Categories.tsx`.
- **Approach**: Create a reusable `PremiumDropdown` using `radix-ui/react-select` (for accessibility) styled with custom glassmorphism and `framer-motion` for transitions.
- **Groups**: Support headers like "CUENTA PERSONAL" and "GRUPOS" as requested.

### 4. Category Detail: Pagination & Filtering
- **Pagination**: Implement traditional "First, Prev, [1, 2, 3], Next, Last" controls.
- **Logic**: Use Supabase `.range(from, to)` for efficient offset-based pagination.
- **Filtering**: Add a state-based filter object (`{ dateFrom, dateTo, minAmount, maxAmount }`) that triggers re-fetch.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Storage** | Supabase Table | Enables real CRUD and persistence across devices. |
| **Color Handling** | Tailwind Tokens | Maintains design consistency; easier than raw HEX for dark mode. |
| **Dropdown Engine** | Radix UI + Framer | Combines best-in-class accessibility with premium animations. |
| **AI Matching** | Exact Name Match | Simplest and most predictable for users. Users can later merge/rename via CRUD. |

## Patterns to Follow
- **Unified Transaction Modal**: Pre-fill category when adding from `CategoryDetail`.
- **Z-Index Management**: Ensure PremiumDropdown popovers (z-50) always appear above other glass panels.

## Anti-Patterns to Avoid
- **Native `<select>`**: Avoid using standard HTML selects anywhere in the PWA.
- **Full Refresh on Filter**: Use client-side state + debounced re-fetch for filters to keep the "App" feeling.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-select` | Latest | Accessible foundation for custom selects. |
| `framer-motion` | Existing | Animating dropdown expansions and route entries. |

## Risks
- **Category Drift**: AI might create "Supermarket" and "Supermercado". 
- **Mitigation**: Implement a simple normalization check (lowercase/no accents) before creating new categories.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
