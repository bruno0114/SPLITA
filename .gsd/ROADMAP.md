# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0 - Production Readiness

## Must-Haves (from SPEC)
- [ ] Scalable folder structure
- [ ] React Router DOM
- [ ] Supabase Schema & RLS
- [ ] User Authentication
- [ ] Real Transaction Persistence

## Phases

### Phase 1: Architecture Foundation
**Status**: ⬜ Not Started
**Objective**: Refactor codebase to feature-based structure and implement React Router DOM without breaking UI.
**Deliverables**:
- New folder structure (features, services, hooks).
- React Router configuration.
- Preservation of layout and animations.

### Phase 2: Supabase Core & Auth
**Status**: ⬜ Not Started
**Objective**: Setup Database schema and implement Authentication.
**Deliverables**:
- SQL Schema (profiles, groups, transactions, splits).
- RLS Policies.
- Login/Signup flow with Supabase Auth.
- Profile synchronization.

### Phase 3: Business Logic & Data Integration
**Status**: ⬜ Not Started
**Objective**: Connect UI to Supabase data for Groups and Transactions.
**Deliverables**:
- `useGroups`, `useTransactions` hooks.
- Real-time fetching of groups and transactions.
- Balance calculation logic.
- Remove hardcoded constants.

### Phase 4: AI & Expense Importing
**Status**: ⬜ Not Started
**Objective**: Persist AI-scanned data to the database.
**Deliverables**:
- Connect ImportExpenses AI result to Transaction creation.
- Transaction splitting UI connection to DB.
- Verification of full user flow (Scan -> Edit -> Save).
