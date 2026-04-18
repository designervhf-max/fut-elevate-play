# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:8080
npm run build      # Production build
npm run build:dev  # Development mode build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

No test framework is configured in this project.

## Architecture

**EleveFut** is a mobile-first soccer match management platform (Portuguese-speaking market). Players organize recurring pickup games ("peladas"), track stats, draw teams, and vote for MVPs.

**Stack:**
- React 18 + TypeScript, Vite 5, React Router 6
- TanStack React Query for all server state
- React Hook Form + Zod for forms
- shadcn-ui + Radix UI + Tailwind CSS for UI
- Supabase (PostgreSQL + Auth + Edge Functions + RLS)
- Lovable OAuth (`@lovable.dev/cloud-auth-js`) for social sign-in

## Key Patterns

**Data fetching** — all reads go through TanStack Query hooks in `src/hooks/`. These wrap Supabase queries and are auto-invalidated on auth state changes. Prefer adding new queries as custom hooks there.

**Auth** — `src/integrations/lovable/` handles OAuth; `src/integrations/supabase/` holds the client and generated TypeScript types. RLS policies on Supabase tables enforce authorization server-side.

**Routing** — defined in `src/App.tsx`. Protected routes check auth state before rendering. Public match RSVP is at `/m/:matchId` (no auth required).

**Supabase Edge Functions** — in `supabase/functions/`. Each function has its own `index.ts`. The `determine-game-results` function uses `getClaims()` which doesn't exist — known bug (see `supabase/functions/determine-game-results/`).

**Subscription gating** — the `useSubscription` hook returns trial/pro status. Trial expiration logic has a known bug: it doesn't distinguish paid Pro from free-trial users.

## Directory Layout

```
src/
  pages/        # Route-level page components
  components/   # Shared UI (ui/ = shadcn primitives, skeletons/)
  hooks/        # All React Query hooks (data layer)
  integrations/ # Supabase client+types, Lovable OAuth
  lib/          # Zod schemas, utilities, progression logic
  App.tsx       # Router config
supabase/
  migrations/   # DB schema history
  functions/    # Edge Functions (delete-account, determine-game-results, match-preview, public-match-rsvp)
```

## Known Issues

- `supabase/functions/delete-account/index.ts` — CORS version conflict
- `supabase/functions/determine-game-results/` — calls non-existent `getClaims()`
- `src/pages/Home.tsx` — broken link `/create-game` should be `/create-pelada`
- Freemium trial logic doesn't distinguish paid Pro from free trial users
- Subscription creation trigger can fail with duplicate constraint
