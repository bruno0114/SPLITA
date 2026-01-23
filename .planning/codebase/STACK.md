# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- TypeScript 5.8.2 - Application frontend and configuration
- JSX/TSX - React component development
- SQL - Supabase database schema and migrations

**Secondary:**
- JavaScript (Node.js) - Build scripts and development tools
- Bash - Database migration scripts

## Runtime

**Environment:**
- Node.js 18.20.8 - Development and build environment

**Package Manager:**
- npm 10.8.2
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.3 - UI framework
- React Router 6.30.3 - Client-side routing
- Vite 6.2.0 - Build tool and dev server

**UI & Animation:**
- Framer Motion 12.27.1 - Motion and animation library
- Lucide React 0.562.0 - Icon library

**Data Visualization:**
- Recharts 3.6.0 - Charts and graphs for analytics

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.78.0 - Database, auth, and real-time subscriptions
- @google/genai 1.37.0 - Google Gemini AI API integration

**UI Development:**
- @vitejs/plugin-react 5.0.0 - Fast refresh for React development

## Configuration

**Environment:**
- Vite environment variables loaded from `.env` file
- Variables prefixed with `VITE_` are exposed to browser
- Critical vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`

**Build:**
- `vite.config.ts` - Vite configuration with React plugin
- `tsconfig.json` - TypeScript compiler options (ES2022 target, JSX support)
- Configured path alias: `@/*` maps to `./src/*`

**Development:**
- Dev server runs on port 3000 with host `0.0.0.0`
- React Fast Refresh enabled via @vitejs/plugin-react

## Type System

**TypeScript Configuration:**
- Target: ES2022
- Module: ESNext
- Module Resolution: bundler
- Strict settings: isolatedModules enabled, skipLibCheck enabled
- JSX: react-jsx (automatic)
- Declaration: noEmit (type checking only, no output files)

## Scripts

**Available Commands:**
```bash
npm run dev         # Start Vite development server on port 3000
npm run build       # Build for production
npm run preview     # Preview production build locally
```

## Platform Requirements

**Development:**
- Node.js 18+
- npm 10+
- macOS, Linux, or Windows with bash-compatible shell

**Production:**
- Static hosting (Netlify, Vercel, AWS S3, etc.)
- Browser support: Modern browsers with ES2022 support
- CORS-enabled Supabase and Gemini API access

## External API Keys Required

**Required Environment Variables:**
```
VITE_SUPABASE_URL         # Supabase project URL
VITE_SUPABASE_ANON_KEY    # Supabase anonymous key for auth/DB
VITE_GEMINI_API_KEY       # Google Gemini API key (optional per-user override in settings)
```

## Build Output

- Output directory: `dist/`
- Bundle format: ES modules (ESNext)
- Source maps: Available during development

---

*Stack analysis: 2026-01-23*
