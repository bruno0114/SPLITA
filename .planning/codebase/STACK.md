# Technology Stack

**Analysis Date:** 2026-01-21

## Languages

**Primary:**
- TypeScript 5.8.2 - All application code (React components, services, hooks, contexts)
- JSX (via React 19) - Component rendering in .tsx files

**Secondary:**
- HTML/CSS - UI rendering via React and Framer Motion

## Runtime

**Environment:**
- Node.js (ES2022 module compilation target)

**Package Manager:**
- npm
- Lockfile: package-lock.json (present in git repo)

## Frameworks

**Core:**
- React 19.2.3 - UI library and component framework
- React DOM 19.2.3 - React rendering to DOM
- React Router DOM 6.30.3 - Client-side routing

**UI/Animation:**
- Framer Motion 12.27.1 - Component animations and transitions
- Lucide React 0.562.0 - Icon library
- Recharts 3.6.0 - React charting library for analytics

**Backend-as-a-Service:**
- Supabase JS Client 2.78.0 - PostgreSQL database, authentication, real-time subscriptions

**AI:**
- Google Generative AI 1.37.0 - Gemini API client for expense extraction and financial analysis

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.78.0 - Database queries, authentication (OAuth with Google), session management. Core to all data operations.
- `@google/genai` 1.37.0 - Gemini API for AI-powered expense extraction from receipts/images and financial health analysis.
- `react` 19.2.3 - Core UI framework
- `react-router-dom` 6.30.3 - Application routing and navigation

**UI & Visualization:**
- `framer-motion` 12.27.1 - Smooth animations for modals, transitions, and interactive UI elements
- `lucide-react` 0.562.0 - Icon components for UI elements (Receipt, Settings, etc.)
- `recharts` 3.6.0 - Charts for analytics, expenditure evolution visualization

## Configuration

**Environment:**
- Vite environment variables loaded via `import.meta.env.VITE_*`
- Configuration in `vite.config.ts`

**Required Environment Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL (postgres database endpoint)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public JWT token for client queries)
- `VITE_GEMINI_API_KEY` - Google Gemini API key (optional, can be user-provided or system default)

**Build:**
- Vite 6.2.0 - Frontend bundler and dev server
- TypeScript compiler - Static type checking
- @vitejs/plugin-react 5.0.0 - Fast refresh during development

## Platform Requirements

**Development:**
- Node.js (ES2022 compatible)
- npm package manager
- TypeScript 5.8.2 compiler
- Vite dev server runs on port 3000 (configurable via `server.port`)

**Production:**
- Static asset hosting (SPA deployment)
- Vite build output to `/dist` directory
- Supabase hosted cloud database (PostgreSQL)
- Google Cloud for Gemini API access

**TypeScript Configuration:**
- Target: ES2022
- Module: ESNext
- Path alias: `@/*` maps to `./src/*`
- JSX: react-jsx
- Module resolution: bundler

---

*Stack analysis: 2026-01-21*
