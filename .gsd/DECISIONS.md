# Project Decisions

## Phase 7: AI Import Evolution (FX & Selection)

**Date:** 2026-01-20

### Scope
- **Recurrence / Installments**: 
    - Chosen Approach: **Option B (Practical)**.
    - Implementation: Gemini will detect textual patterns like "Cuota X de Y" or "suscripción". The UI will prompt the user if they want to create a manual reminder/recurrence marker.
    - Out of Scope for now: Automatic future expense generation or background jobs.
- **FX / Currency Handling**: 
    - Implementation: Manual FX handling at import time. If USD is detected, the UI requires a conversion rate input.
    - Data Storage: Store original amount, currency, conversion rate, and converted ARS amount in the database.
- **Item Selection**: 
    - Implementation: Review step will be converted to a selectable list (toggles/checkboxes). Only selected items are saved to Supabase.

### Approach
- **AI Memory**: Gemini remains stateless. Suggestions for recurrence will be based on application-level pattern matching against the database (merchant + frequency), not Gemini's internal memory.
- **FX Suggestion**: The UI may suggest the last used FX value for convenience.

### Constraints
- Keep all existing glassmorphism and animations in the `ImportExpenses` page.
- Do not add presets for USD rates (Blue, Tarjeta, etc.) in this phase.

---

## Phase 10: Deep History & Real-time FX (DolarAPI)

**Date:** 2026-01-20

### AI Prompting & Tone
- **Dynamic Prompts**: The Gemini system prompt will be moved to a configuration file or a constant that is easily accessible (e.g., `src/lib/ai-prompts.ts`) to allow for quick iterations without diving into logic.
- **Off-Topic Detection**: Prompt will be instructed to return a joke if the image is non-financial (selfies, pets, etc.).

### Currency & Dolar API
- **Provider**: `dolarapi.com` will be the primary source for real-time rates.
- **Default Rate**: **Dolar Blue** for general conversions.
- **Secondary Rate**: **Dolar Cripto** will be available as an option in the UI switcher or settings.
- **Animations**: Global currency swaps will trigger a high-quality "Flip & Glow" animation on all price components.

### File Handling
- **Supported Formats**: System must support Images, PDFs, XLS, and DOCX for AI processing.
- **UI Differentiation**: Icons in the history list will reflect the file type (PDF icon, Spreadsheet icon, Word icon, Image preview).
- **Storage**: All files will be persisted in the `receipts` bucket for historical reference.
---

## Phase 11: Expert Categories & UI Refactor

**Date:** 2026-01-20

### Scope
- **Category CRUD**: Implement a full CRUD system for categories stored in a new Supabase `categories` table.
- **AI Auto-creation**: Categories will be created automatically if Gemini detects a new category during bulk import.
- **Category Colors**: Each category will have a persistent color property saved in the database.
- **System vs User Categories**: Users can manage their own categories, while a set of defaults is provided.
- **Category Detail Page**:
    - **Pagination**: Traditional numeric pagination with arrows.
    - **Filtering**: Filter by date range, group/personal scope, and amount.
    - **Actions**: Add movements directly from the category detail page.

### Approach
- **Premium Dropdowns**: Replace all native HTML `<select>` elements with a custom `PremiumDropdown` component that matches the glassmorphic "Mis Finanzas" style.
- **Modular Modals**: Reuse the `TransactionModal` for adding expenses from the category page, pre-linking the selected category.

### Constraints
- **Design Consistency**: All custom components must strictly adhere to the established glassmorphic/premium aesthetic.
- **PWA Feel**: Transitions between category drill-down and main views must be smooth and animated (Framer Motion).
---

## Phase 11.5: Refined Financial UX & Bulk Actions

**Date:** 2026-01-20

### Scope
- **Transaction Card Enhancement**:
    - **Context Badges**: Cards will show if a movement belongs to "Finanzas Personales" or a specific group. Using a mix of minimalist icons and text-based labels to maintain high UX.
    - **Payment Markers**: Visibility for "Recurrente" (icon) and "Cuotas" (marker like "2/6").
    - **Multi-select**: Creative toggle (checkpoint) on each card to enable bulk selection.
- **Transaction Modal Evolution**:
    - **Premium Selection**: Replace text input for Category with `PremiumDropdown`.
    - **Recurring/Instalments**: Explicit fields to configure these properties during creation or edit.
- **Bulk Actions**:
    - **Floating Toolbar**: Appears when transactions are selected.
    - **Mass Operations**: "Mover Categoría" (batch re-assignment) and "Eliminar" (batch deletion).
    - **Animations**: Toolbar will slide up from the bottom with a smooth glassmorphic entry.

### Approach
- **Quick Re-assignment**: Use an instant-access category switcher in the Card's hover menu (Action Option B).
- **Consolidated Components**: Ensure `TransactionCard` is the single source of truth for all transaction lists across the app.
- **Option A Priority**: Complete all 11.5 polish items (Bulk Actions, Badges) before moving to Phase 12 deep features.

### Constraints
- **Aesthetics**: Selection toggles must be non-intrusive and maintain the "clean" glassmorphic look.
- **Safety**: Bulk deletions MUST require a confirmation prompt showing the count of items to be deleted.
---

## Phase 12: Deep Personalization & Premium Ecosystem

**Date:** 2026-01-20

### Scope & User Flow
- **Personalized Group Categories**: Implemented as a user-specific override. When editing a group transaction, users can choose "Solo para mí". This stores the preference in `transaction_splits`.
- **Real-time Sync & Toasts**: All category and transaction updates will trigger "Actualizado" toasts. UI will use optimistic updates or Realtime subscriptions to eliminate manual refreshes.
- **AI Import - API Key Status**: 
    - **Visual indicator**: "✓ IA Activada" with a vibrant glow/shimmer when API Key is present in profile.
    - **Information Modal**: Simple validation check highlighting the status and a direct button to Configuration for modifications.
- **Economic Health - Deep Insights**:
    - **Persistence**: AI advice is cached per day.
    - **Manual Update**: User-controlled refresh button for new insights (token-safe).
    - **Advanced Projections Modal**: 
        - Trigger: "Desbloqueá consejos avanzados" button.
        - Animation: "Smooth Scale & Fade" (matching AI History modal).
        - Content: Projections for crypto, ETFs, and staking (6m, 1y, 3y, 5y, 10y).
        - Visuals: Premium gradient, AI icons, platform logos (Binance, Nexo, etc.), and internet-sourced interest rates via Gemini.
- **Subscription Framework**: 
    - Designer-ready placeholder for subscription tiers.
    - Logic for Free vs Paid tier differentiation (prepared for future activation).

### Approach
- **Unified Transitions**: Adopt the AI History modal's "Smooth Scale & Fade" animation globally for all dialogs.
- **Model Awareness**: Check the active Gemini model (Flash/Pro) from the configuration during data extraction.
- **Performance & RLS**: Conduct a thorough audit of multi-user group joins and batch deletion policies to ensure zero-lag and data safety.

### Constraints
- **Maintain UI approving**: Do not change approved CSS or animations.

---

## Phase 11.6: Advanced Browsing & Insights

**Date:** 2026-01-20

### Scope
- **Advanced Filtering**:
    - **Behavior**: Instant response upon change with a "Loading" state/icon.
    - **Date Selection**: Full free-range selection (Desde/Hasta).
    - **Components**: Use `PremiumToggle` for filter categories/types.
- **Infinite Scrolling**: Implement automated loading when reaching the bottom of the list with a "Cargando movimientos..." message.
- **Expenditure Evolution (Charts)**:
    - **Type**: Stacked Bar Charts (Barras Apiladas) to show category distribution over time.
    - **Interactivity**: Charts must update automatically based on active date/category filters.
- **Group Split Visibility**: Personal Finance view includes group splits, but they must feature a high-contrast visual reference (e.g., "Split de [Nombre del Grupo]") to distinguish them from direct personal expenses.

### Approach
- **Category Hygiene (Anti-Duplicates)**: 
    - **Merge**: Automatically merge existing categories with the same name (case-insensitive).
    - **Integrity**: Add a database unique constraint for category names (scoped to `user_id`).
- **Navigation Persistence**:
    - Re-categorizing (single or bulk) from `CategoryDetail` will keep the user on the same page.
    - Items removed from the view due to category changes will use a "Fade Up & Slide" animation.
- **Breadcrumbs Logic**: Fixed so re-categorization doesn't trigger a redirect to Personal Finance dashboard.

### Constraints
- **Visual Harmony**: New filter components must mirror the `PremiumDropdown` aesthetic.
- **Group Identity**: Group splits in personal views must not be editable in certain fields (like amount) directly, but rather redirected to the source group if needed.
