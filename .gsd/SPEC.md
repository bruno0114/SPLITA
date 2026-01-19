# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Refactor the existing SPLITA financial management PWA to be a scalable, production-ready application backed by Supabase. transform the current mock-data frontend into a fully functional app with real authentication, database persistence, and AI-powered expense tracking, while preserving the existing high-fidelity UI and animations.

## Goals
1. **Architecture & Routing**: Restructure codebase into a scalable feature-based architecture and replace manual routing with React Router DOM, ensuring all existing transitions and animations are preserved.
2. **Supabase Integration**: Design and implement a complete SQL schema (profiles, groups, transactions, splits) with robust Row Level Security (RLS) policies.
3. **Authentication**: Implement Supabase Auth (Email/Google) and synchronize user profiles with the database.
4. **Business Logic**: Replace mock data with real business logic using custom hooks (`useAuth`, `useGroups`, `useTransactions`) and implement real-time balance calculations.
5. **AI Persistence**: Connect the existing Google Gemini integration to the database, allowing users to save scanned receipts as real transactions.

## Non-Goals (Out of Scope)
- **UI Redesign**: Absolutely NO changes to the visual design, CSS, or animations. The current UI is approved and must be strictly maintained.
- **New Features**: No new user-facing features beyond what is already visually represented or explicitly requested (persistence).

## Users
- **Individual Users**: tracking personal finances and health.
- **Groups**: Partners, roommates, or friends splitting shared expenses (trips, household).

## Constraints
- **Tech Stack**: React 18+, TypeScript, Tailwind CSS, Supabase, Google Gemini SDK.
- **Visuals**: Maintain pixel-perfect UI and glassmorphism effects.
- **Code Quality**: Follow SOLID principles and DRY best practices.
- **Security**: Strict RLS policies; users access only their own data or group data.

## Success Criteria
- [ ] User can sign up/login and see their persistent profile.
- [ ] Logic uses React Router DOM without breaking transitions.
- [ ] User can create a group and add members.
- [ ] User can add a transaction manually or via AI scan, and it persists.
- [ ] Group balances are calculated correctly based on DB data.
- [ ] Restricted data access is enforced by RLS.
