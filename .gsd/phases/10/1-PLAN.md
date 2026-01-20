---
phase: 10
plan: 1
wave: 1
---

# Plan 10.1: Global Currency Engine (DolarAPI + Context)

## Objective
Establish a real-time, global currency synchronization system using `dolarapi.com`. This ensures the switcher in the header correctly converts all prices between ARS and USD with creative animations and persistent settings.

## Context
- .gsd/phases/10/RESEARCH.md
- src/App.tsx
- src/types/index.ts
- src/components/layout/Header.tsx

## Tasks

<task type="auto">
  <name>Create Currency Context & DolarAPI Service</name>
  <files>
    - src/services/dolar-api.ts
    - src/context/CurrencyContext.tsx
    - src/main.tsx
  </files>
  <action>
    1. Create `src/services/dolar-api.ts` to fetch rates from `dolarapi.com/v1/dolares`.
    2. Create `src/context/CurrencyContext.tsx`:
       - Manage `currency` ('ARS' | 'USD'), `rateSource` ('blue' | 'cripto'), and `exchangeRate`.
       - Persist choices in `localStorage`.
       - Provide a `refreshRates` function.
    3. Wrap `App` with `CurrencyProvider` in `src/main.tsx`.
    4. Remove local currency state from `src/App.tsx` and use the context instead.
  </action>
  <verify>Check console logs for successful DolarAPI fetch on app load.</verify>
  <done>CurrencyContext provides real-time USD rates to the entire app.</done>
</task>

<task type="auto">
  <name>Implement AnimatedPrice Component & Global Swapper</name>
  <files>
    - src/components/ui/AnimatedPrice.tsx
    - src/components/layout/Header.tsx
  </files>
  <action>
    1. Create `src/components/ui/AnimatedPrice.tsx`:
       - Accepts `amount` in ARS (base).
       - Automatically converts based on global context.
       - Uses `framer-motion` for a "Flip & Glow" animation when the currency changes.
    2. Update `src/components/layout/Header.tsx`:
       - Replace the current currency indicator with an interactive Switcher.
       - The Switcher allows toggling ARS/USD and selecting Blue/Cripto source.
       - Apply premium glassmorphism to the switcher menu.
  </action>
  <verify>Toggle currency in header and see all Wrapped prices animate and convert.</verify>
  <done>User can switch currencies globally with a high-fidelity animation.</done>
</task>

## Success Criteria
- [ ] DolarAPI fetches real-time Blue/Cripto rates.
- [ ] Global state persists across refreshes.
- [ ] Prices animate Creatively during conversion.
