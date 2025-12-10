# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plex Wrapped is a web application that generates Spotify Wrapped-style year-in-review experiences for Plex music listeners. Users log in with their Plex account, we fetch their listening history via the Plex API, and render a beautiful, shareable stats experience.

**Live site:** https://plexwrapped.com
**Full roadmap:** See `SPEC.md` for complete project specification

## Tech Stack

- **Frontend:** SvelteKit 2 with Svelte 5
- **Styling:** Tailwind CSS with Plex-inspired color palette
- **Database:** Supabase (PostgreSQL)
- **Auth:** Plex OAuth
- **Hosting:** Netlify (auto-deploys from `main` branch)
- **Testing:** Vitest
- **Validation:** Zod

## Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build
npm run preview      # Preview production build locally
npm run test         # Run tests with Vitest
npm run test:coverage # Run tests with coverage
npm run check        # TypeScript checking
npm run lint         # ESLint + Prettier check
npm run format       # Auto-format code
```

Run a single test file:

```bash
npx vitest run src/lib/services/stats.test.ts
```

## Development Workflow

### Git & CI Process

1. **Start each task** by creating a feature branch from `main`:

   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/task-name   # or fix/, docs/, ci/
   ```

2. **Write tests first** (TDD) - tests go in `*.test.ts` files alongside source

3. **Run checks locally** before committing:

   ```bash
   npm run lint      # Prettier + ESLint
   npm run check     # TypeScript/Svelte checking
   npm test -- --run # Vitest
   npm run build     # Production build
   ```

4. **Commit with conventional commits** (feat:, fix:, docs:, ci:, etc.)

5. **Push and create PR**:

   ```bash
   git push -u origin feature/task-name
   gh pr create --title "feat: description" --body "..."
   ```

6. **CI runs automatically** on PR - 5 parallel jobs:

   - `lint` - Prettier formatting + ESLint rules
   - `typecheck` - svelte-check with TypeScript
   - `test` - Vitest test suite
   - `build` - Production build verification
   - `security` - npm audit + TruffleHog secret scanning

7. **Merge to main** triggers Netlify auto-deploy to production

### Branch Protection (GitHub)

- PRs required to merge to `main`
- All CI checks must pass
- Branch must be up to date before merging

### Security Principles

- **Zero Trust:** All inputs validated with Zod
- **Secure tokens:** httpOnly cookies (not localStorage)
- **CSP headers:** Configured in svelte.config.js
- **Secret scanning:** TruffleHog runs on every PR

### Build in Public

After completing each task, generate a Threads post for @jonthebeef documenting the progress. Keep it conversational, authentic, and focused on what was built/learned.

## Architecture

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── services/       # Business logic (plex.ts, auth.ts, stats.ts, supabase.ts)
│   ├── stores/         # Svelte stores for state management
│   ├── utils/          # Validation schemas, helpers
│   └── server/         # Server-only code (secrets, DB operations)
├── routes/
│   ├── +page.svelte    # Landing page
│   ├── wrapped/        # Main wrapped experience (authenticated)
│   ├── share/[id]/     # Public shareable wrapped view
│   └── auth/callback/  # Plex OAuth callback handler
└── app.html            # HTML shell
```

### Key Data Flow

1. User clicks "Sign in with Plex" → Plex OAuth flow
2. OAuth callback receives token → stored in httpOnly cookie
3. Token used to fetch user's Plex servers and play history
4. Stats calculated from play history → rendered as wrapped experience
5. Results cached in Supabase for sharing

### Plex API Integration

Key endpoints used (all require `X-Plex-Token` header):

- `POST https://plex.tv/api/v2/pins` - Create auth PIN
- `GET https://plex.tv/api/v2/pins/{id}` - Poll for auth token
- `GET https://plex.tv/api/v2/resources` - Get user's servers
- `GET {serverUrl}/status/sessions/history/all` - Get play history

### Security Configuration

CSP directives in `svelte.config.js` allow connections to:

- `plex.tv` and `*.plex.direct` (Plex API)
- `*.supabase.co` (Database)

Security headers in `netlify.toml`:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict Referrer-Policy

## Tailwind Theme

Plex-inspired colors defined in `tailwind.config.js`:

- `plex` / `plex-dark` / `plex-light` - Plex gold (#e5a00d)
- `surface` / `surface-card` / `surface-elevated` - Dark backgrounds (#1f1f1f, #2a2a2a)

## Environment Variables

See `.env.example` for required variables:

- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `SUPABASE_SERVICE_KEY` - Server-side only
- `PUBLIC_PLEX_CLIENT_ID` - Plex app identifier
- `PUBLIC_APP_URL` - App URL for OAuth callbacks
- `LOOPS_API_KEY` - Email service (optional)

## Current Progress

Completed:

- [x] SvelteKit + Tailwind scaffold
- [x] Netlify deployment configured
- [x] Security headers and CSP

Next up (see SPEC.md for full roadmap):

- [ ] Plex OAuth flow
- [ ] Fetch play history
- [ ] Stats calculation
- [ ] Wrapped UI experience
- [ ] Supabase integration
- [ ] Share functionality
