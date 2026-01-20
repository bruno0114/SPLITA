# Technology Stack

**Analysis Date:** 2025-01-20

## Languages

**Primary:**
- TypeScript ~5.8.2 - All application code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- SQL - Database migrations and RLS policies (`supabase_*.sql`)
- HTML - Single index.html entry point (`index.html`)

## Runtime

**Environment:**
- Node.js (no explicit version pinned; uses ESM modules)
- Browser (React 19 SPA targeting modern browsers)

**Package Manager:**
- npm (lockfile present: `package-lock.json`)
- Lockfile: present

## Frameworks

**Core:**
- React 19.2.3 - UI framework with JSX/TSX components
- React Router DOM 6.30.3 - Client-side routing (`src/App.tsx`)
- Vite 6.2.0 - Build tool and dev server (`vite.config.ts`)

**UI:**
- Tailwind CSS (via CDN) - Utility-first CSS framework (loaded in `index.html`)
- Lucide React 0.562.0 - Icon library

**Testing:**
- Not configured (no test framework detected)

**Build/Dev:**
- Vite 6.2.0 - Dev server and production bundler
- @vitejs/plugin-react 5.0.0 - React Fast Refresh and JSX transform

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.78.0 - Backend-as-a-Service client (auth, database, storage)
- `@google/genai` 1.37.0 - Google Gemini AI SDK for expense extraction and financial advice
- `react-router-dom` 6.30.3 - SPA routing

**Infrastructure:**
- `@types/node` 22.14.0 - Node.js type definitions
- `@types/react-router-dom` 5.3.3 - Router type definitions

## Configuration

**Environment Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL (required)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key (required)
- `VITE_GEMINI_API_KEY` - Optional system-level Gemini key (user keys stored in profiles table)

**Build Configuration:**
- `vite.config.ts` - Vite configuration with React plugin, path aliases, env loading
- `tsconfig.json` - TypeScript configuration targeting ES2022, bundler module resolution

**TypeScript Path Aliases:**
- `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)

## Build Commands

```bash
npm run dev      # Start Vite dev server on port 3000
npm run build    # Production build to /dist
npm run preview  # Preview production build
```

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser for testing (ES2022 target)

**Production:**
- Static file hosting (Vite outputs to `dist/`)
- Supabase project (database, auth, storage)
- Optional: Google AI Studio account for Gemini API key

## Notable Patterns

**Module System:**
- ESM (`"type": "module"` in package.json)
- Import maps in `index.html` for CDN-loaded dependencies

**CSS Approach:**
- Tailwind CSS loaded via CDN script (`https://cdn.tailwindcss.com`)
- Custom Tailwind config inline in `index.html`
- CSS custom properties for theme (light/dark mode)
- No compiled CSS files; all utility classes

**Fonts:**
- Plus Jakarta Sans (primary)
- Inter (secondary)
- Loaded via Google Fonts CDN

---

*Stack analysis: 2025-01-20*
