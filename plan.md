# Sportok — Development Roadmap

> **Status:** MVP complete. This document tracks planned phases. Do not modify existing UI, components, layout, styling, or colors unless explicitly building Phase 1 tasks.

**Goal:** Georgian sports hub — live scores, fixtures, odds, news, team stats — bilingual (ka/en).

**Current stack:** Next.js 16, Tailwind CSS, next-intl, lucide-react, mock data only.

**Target stack additions:** shadcn/ui, MongoDB + Mongoose, AI translation pipeline, sports API.

---

## Phase 1: Frontend Polish & Responsive UI

**Goal:** Make the existing MVP pixel-perfect and fully responsive across all breakpoints before any backend work.

### Tasks

- [ ] Audit all pages on mobile (320px), tablet (768px), desktop (1280px+)
- [ ] Fix `ThreeColumn` layout: collapse sidebars to bottom on mobile, single-column on small screens
- [ ] Fix `Header`: hamburger menu on mobile, hide `NavLinks` behind toggle
- [ ] Fix `MatchCard`: ensure odds grid and team names don't overflow on narrow screens
- [ ] Fix `NewsCard`: image aspect ratio preserved on all breakpoints
- [ ] Fix `FormTable`: horizontal scroll or wrap on small screens
- [ ] Add loading skeletons for `MatchCard`, `NewsCard`, `LiveWidget` (prep for real async data)
- [ ] Add `not-found.tsx` page under `app/[locale]/`
- [ ] Add `error.tsx` page under `app/[locale]/`
- [ ] Add `loading.tsx` page under `app/[locale]/`
- [ ] Install shadcn/ui: `npx shadcn@latest init` — choose dark theme, CSS variables
- [ ] Replace `AdSlot` placeholder with shadcn `Card` component
- [ ] Add shadcn `Badge` to `MatchCard` for LIVE / status indicators
- [ ] Add shadcn `Skeleton` components for loading states
- [ ] Add shadcn `Separator` to `Footer` and section dividers
- [ ] Verify Georgian font rendering (Noto Sans Georgian or BPG font) — add to `globals.css` if missing
- [ ] Cross-browser test: Chrome, Firefox, Safari

---

## Phase 2: Backend Setup — MongoDB / Mongoose

**Goal:** Stand up data layer. No scraping yet — seed with existing mock data to verify schemas work end-to-end.

### Tasks

- [ ] `npm install mongoose` + `npm install -D @types/mongoose`
- [ ] Create `lib/db.ts` — singleton Mongoose connection with connection pooling for Next.js
- [ ] Create `models/Team.ts` — Mongoose schema matching `lib/types.ts#Team`
- [ ] Create `models/League.ts` — Mongoose schema matching `lib/types.ts#League`
- [ ] Create `models/Match.ts` — Mongoose schema matching `lib/types.ts#Match`
- [ ] Create `models/NewsArticle.ts` — Mongoose schema matching `lib/types.ts#NewsArticle`
- [ ] Create `app/api/matches/route.ts` — GET returns all matches, POST creates match (admin only, stub auth for now)
- [ ] Create `app/api/matches/[slug]/route.ts` — GET single match by slug
- [ ] Create `app/api/news/route.ts` — GET paginated news list
- [ ] Create `app/api/news/[slug]/route.ts` — GET single article by slug
- [ ] Create `scripts/seed.ts` — imports `mockData` from `lib/mock-data.ts` and inserts into MongoDB
- [ ] Add `MONGODB_URI` to `.env.local` (document in `.env.example`)
- [ ] Run seed script, verify data in MongoDB Atlas or local instance
- [ ] Update `app/[locale]/page.tsx` to fetch from `/api/matches` instead of `mockData`
- [ ] Update `app/[locale]/news/page.tsx` to fetch from `/api/news`
- [ ] Update `app/[locale]/match/[slug]/page.tsx` to fetch from `/api/matches/[slug]`
- [ ] Update `app/[locale]/news/[slug]/page.tsx` to fetch from `/api/news/[slug]`
- [ ] Remove direct imports of `mockData` from all pages after API migration confirmed

---

## Phase 3: Content Scraping / Import Architecture

**Goal:** Design the pipeline for importing content from the Russian source website. **Do not implement scrapers yet.** Define interfaces and folder structure only.

### Tasks

- [ ] Document source website structure in `docs/scraping/source-analysis.md`: URL patterns, HTML structure, content types (matches, news, odds, team pages)
- [ ] Create `scraper/` directory with `README.md` explaining the planned architecture
- [ ] Create `scraper/types.ts` — raw scraped data types (before normalization)
- [ ] Create `scraper/normalizers/match.ts` — stub: function signature only, no implementation
- [ ] Create `scraper/normalizers/news.ts` — stub: function signature only, no implementation
- [ ] Create `scraper/normalizers/team.ts` — stub: function signature only, no implementation
- [ ] Create `scripts/import.ts` — stub CLI entry point: reads from `scraper/`, normalizes, upserts to MongoDB
- [ ] Define deduplication strategy in `docs/scraping/dedup-strategy.md`: slug-based, external ID-based, or content hash
- [ ] Define scheduling plan in `docs/scraping/schedule.md`: cron intervals per content type (news: hourly, fixtures: every 10min, etc.)
- [ ] Add `npm run import` script to `package.json` pointing to `scripts/import.ts`

---

## Phase 4: AI Translation Pipeline

**Goal:** Auto-translate/adapt scraped Russian content into Georgian (`ka`) and English (`en`) using an AI API.

### Tasks

- [ ] Choose provider: Claude API (Anthropic) or OpenAI — document choice in `docs/ai/provider.md`
- [ ] `npm install @anthropic-ai/sdk` (or `openai`)
- [ ] Add `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) to `.env.local` and `.env.example`
- [ ] Create `lib/ai/translate.ts` — `translateContent(text: string, targetLang: 'ka' | 'en'): Promise<string>`
- [ ] Create `lib/ai/prompts.ts` — translation prompts: news article, match preview, team bio, odds description
- [ ] Create `lib/ai/pipeline.ts` — orchestrates: raw text → translate to ka → translate to en → return `{ ka, en }`
- [ ] Add translation call inside `scraper/normalizers/news.ts` (flesh out stub from Phase 3)
- [ ] Add translation call inside `scraper/normalizers/match.ts` for preview text
- [ ] Create `app/api/admin/translate/route.ts` — POST endpoint to manually trigger translation of a stored article by ID
- [ ] Add retry logic in `lib/ai/translate.ts` for rate limit / timeout errors
- [ ] Log translation cost estimate per article to stdout during import
- [ ] Test translation quality on 5 real articles before wiring into automated pipeline

---

## Phase 5: Authentication Module

**Goal:** Real login/register backed by MongoDB. JWT sessions. Role-based: `user` and `admin`.

### Tasks

- [ ] `npm install next-auth@beta` (Next.js App Router compatible) + `npm install bcryptjs` + `npm install -D @types/bcryptjs`
- [ ] Create `models/User.ts` — fields: email, passwordHash, role (`'user' | 'admin'`), createdAt
- [ ] Create `app/api/auth/[...nextauth]/route.ts` — NextAuth config with Credentials provider
- [ ] Create `lib/auth.ts` — `getSession()`, `requireAuth()`, `requireAdmin()` helpers
- [ ] Add `NEXTAUTH_SECRET` and `NEXTAUTH_URL` to `.env.local` and `.env.example`
- [ ] Wire `app/[locale]/login/page.tsx` `AuthCard` form to POST `/api/auth/signin`
- [ ] Wire `app/[locale]/register/page.tsx` `AuthCard` form to POST `/api/auth/register` (custom route)
- [ ] Create `app/api/auth/register/route.ts` — validate email+password, hash with bcryptjs, insert User
- [ ] Add session-aware Header: show "Sign out" + username when logged in (update `components/Header.tsx`)
- [ ] Protect admin routes: middleware redirect to `/[locale]/login` if no session + admin role
- [ ] Add shadcn `Toast` for login errors and success messages

---

## Phase 6: Sports API Integration

**Goal:** Replace mock match data with real live scores, fixtures, odds, team form, and H2H from a sports data API.

### Tasks

- [ ] Choose provider: API-Football (api-football.com) or TheSportsDB — document in `docs/api/provider.md`
- [ ] `npm install axios` (or use native fetch — document choice)
- [ ] Add `SPORTS_API_KEY` and `SPORTS_API_BASE_URL` to `.env.local` and `.env.example`
- [ ] Create `lib/sports-api/client.ts` — base fetch wrapper with auth header, rate limit handling
- [ ] Create `lib/sports-api/fixtures.ts` — `getFixtures(sport, date)`, `getFixtureById(id)`
- [ ] Create `lib/sports-api/live.ts` — `getLiveMatches(sport)` for `LiveWidget`
- [ ] Create `lib/sports-api/odds.ts` — `getOdds(fixtureId)`
- [ ] Create `lib/sports-api/teams.ts` — `getTeamForm(teamId, last: number)`, `getH2H(teamA, teamB)`
- [ ] Create `app/api/live/route.ts` — proxies live matches, caches 60s (no API key exposure to client)
- [ ] Create `app/api/fixtures/route.ts` — proxies fixtures with cache
- [ ] Update `LiveWidget` to fetch from `/api/live`
- [ ] Update home page sport sections to fetch from `/api/fixtures`
- [ ] Update `app/[locale]/match/[slug]/page.tsx` to merge API odds + form with DB preview content
- [ ] Add ISR (`revalidate`) to fixture pages: 60s for live, 300s for upcoming
- [ ] Map API team IDs to MongoDB Team documents (add `externalId` field to `models/Team.ts`)

---

## Phase 7: Admin Panel & Content Management

**Goal:** Internal dashboard for managing matches, news, translations, and scraper runs.

### Tasks

- [ ] Create `app/[locale]/admin/layout.tsx` — protect with `requireAdmin()`, sidebar nav
- [ ] Create `app/[locale]/admin/page.tsx` — dashboard: counts of matches, articles, pending translations
- [ ] Create `app/[locale]/admin/news/page.tsx` — paginated article list with edit/delete/translate actions
- [ ] Create `app/[locale]/admin/news/[id]/page.tsx` — article editor with shadcn `Textarea`, preview pane
- [ ] Create `app/[locale]/admin/matches/page.tsx` — match list, status toggle (upcoming/live/finished)
- [ ] Create `app/[locale]/admin/matches/[id]/page.tsx` — match editor: odds, preview text, recommended bet
- [ ] Create `app/api/admin/news/route.ts` — CRUD for articles (GET list, POST create)
- [ ] Create `app/api/admin/news/[id]/route.ts` — PATCH update, DELETE
- [ ] Create `app/api/admin/matches/[id]/route.ts` — PATCH update match fields
- [ ] Create `app/api/admin/scraper/route.ts` — POST triggers manual import run (Phase 3 script)
- [ ] Add shadcn `DataTable` for article and match lists
- [ ] Add shadcn `Dialog` for delete confirmations
- [ ] Add shadcn `Form` + `Input` for article editor fields
- [ ] Add audit log: record who changed what and when (add `updatedBy` + `updatedAt` to models)

---

## Phase 8: Deployment & Production Setup

**Goal:** Production-ready on Vercel with CI, monitoring, and environment hygiene.

### Tasks

- [ ] Create `.env.example` with all required keys documented (no real values)
- [ ] Add `engines` field to `package.json`: `"node": ">=20"`
- [ ] Set up MongoDB Atlas cluster (M0 free tier acceptable for launch)
- [ ] Configure Vercel project: link repo, set all env vars from `.env.example`
- [ ] Add `vercel.json` with `headers` for cache-control on `/api/live` and `/api/fixtures`
- [ ] Set up GitHub Actions CI: `.github/workflows/ci.yml` — `npm ci` + `npm run lint` + `npm run build` on push to `main`
- [ ] Add `npm run typecheck` script to `package.json`: `tsc --noEmit`
- [ ] Add typecheck step to CI workflow
- [ ] Configure Vercel preview deployments for PRs
- [ ] Set up MongoDB Atlas IP allowlist: allow Vercel outbound IPs (or `0.0.0.0/0` with auth for MVP)
- [ ] Add Sentry or Vercel Analytics for error tracking: `npm install @sentry/nextjs`
- [ ] Configure `next.config.ts` image domains for any new image sources added during development
- [ ] Run Lighthouse audit on production URL — target 90+ performance on desktop
- [ ] Set up custom domain and SSL in Vercel dashboard
- [ ] Document deployment runbook in `docs/deploy.md`: how to deploy, rollback, re-seed, run scraper manually

---

## Notes

- **Phase order is strict**: each phase assumes the previous is complete and deployed.
- **Mock data** in `lib/mock-data.ts` stays in place until Phase 2 migration is verified.
- **No AI-generated code should modify** existing components in `components/`, pages in `app/[locale]/`, or styles in `app/globals.css` without an explicit task in this plan.
- **shadcn/ui** is additive only — install components via `npx shadcn@latest add <component>`, never edit generated files in `components/ui/` manually.
- **Georgian is the default locale** (`defaultLocale = 'ka'`). All new UI strings must have both `ka` and `en` entries in `messages/`.
