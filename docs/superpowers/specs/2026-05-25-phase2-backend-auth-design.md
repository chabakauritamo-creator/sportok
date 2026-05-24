# Phase 2 + Auth: Backend Design

**Date:** 2026-05-25  
**Scope:** MongoDB/Mongoose data layer + NextAuth v5 sign-up/sign-in  
**Out of scope:** Page migrations (frontend stays on mockData), admin panel, OAuth providers

---

## 1. Architecture Overview

```
lib/
  db.ts                        ← singleton Mongoose connection (global cache)
  auth.ts                      ← NextAuth config + auth()/requireAuth()/requireAdmin()

models/
  Team.ts
  League.ts
  Match.ts
  NewsArticle.ts
  User.ts

app/api/
  auth/
    [...nextauth]/route.ts     ← NextAuth v5 GET+POST handler
    register/route.ts          ← POST: validate → hash → insert User
  matches/
    route.ts                   ← GET all matches
    [slug]/route.ts            ← GET single match by slug
  news/
    route.ts                   ← GET paginated news
    [slug]/route.ts            ← GET single article by slug

scripts/
  seed.ts                      ← import mockData → upsert to MongoDB

components/
  AuthCard.tsx                 ← wire register fetch + signIn() (existing file)

.env.local                     ← MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL
.env.example                   ← documented keys, no real values
```

Frontend pages remain on `mockData`. API routes exist but no pages call them yet.

---

## 2. Data Models

### User (new)
| Field | Type | Notes |
|-------|------|-------|
| email | String | required, unique, lowercase |
| passwordHash | String | required |
| role | String | enum `['user', 'admin']`, default `'user'` |
| createdAt | Date | default `Date.now` |

### Team
| Field | Type |
|-------|------|
| id | String (unique) |
| name | `{ ka: String, en: String }` |
| logo | String |
| short | String (optional) |

### League
| Field | Type |
|-------|------|
| id | String (unique) |
| name | `{ ka: String, en: String }` |
| country | String |
| sport | enum `['football', 'basketball', 'tennis']` |

### Match
| Field | Type | Notes |
|-------|------|-------|
| slug | String | unique, indexed |
| sport | enum | |
| league | embedded League | |
| home / away | embedded Team | |
| kickoff | Date | |
| status | enum `['SCHEDULED', 'LIVE', 'FINISHED']` | |
| odds | `{ home, draw?, away }` | |
| score, liveMinute, venue, referee | optional | |
| recommendedBet, homeLast5, awayLast5, h2hLast5, preview, hero | optional | |

### NewsArticle
| Field | Type |
|-------|------|
| slug | String (unique, indexed) |
| title / excerpt / body | `{ ka: String, en: String }` |
| author | `{ ka: String, en: String }` |
| hero | String |
| publishedAt | Date |
| tags | `[String]` |
| readMinutes | Number |

**Indexes:** `slug` on Match + NewsArticle. `email` unique on User.

---

## 3. API Routes

All routes return JSON. Read endpoints are public (no auth required).

### Matches
```
GET  /api/matches              → all matches sorted by kickoff desc
GET  /api/matches/[slug]       → single match or 404
```

### News
```
GET  /api/news?page=1&limit=10 → { articles, total, page, pages }
GET  /api/news/[slug]          → single article or 404
```

### Auth
```
POST /api/auth/register        → { name, email, password } → { ok: true }
                                  400 on validation error
                                  409 if email already taken
GET/POST /api/auth/[...nextauth] → NextAuth v5 handler
```

### Error shape (all routes)
```json
{ "error": "human-readable message" }
```

No write endpoints for matches/news — deferred to Phase 7 (admin panel).

---

## 4. Auth Flow

### Register
1. `POST /api/auth/register` with `{ name, email, password }`
2. Zod validate: email valid, password ≥ 8 chars, name ≥ 2 chars
3. Check email uniqueness — return 409 if taken
4. `bcryptjs.hash(password, 12)`
5. Insert User document
6. Return `{ ok: true }`
7. AuthCard calls `signIn('credentials', ...)` automatically after success

### Login
1. NextAuth Credentials provider receives `{ email, password }`
2. Find User by email — return null if not found (NextAuth shows error)
3. `bcryptjs.compare(password, hash)` — return null if mismatch
4. Return `{ id, email, name, role }` to NextAuth
5. NextAuth issues JWT containing `{ id, email, role }`

### Session
- Strategy: `jwt` (stateless, no sessions collection needed)
- `role` propagated via `jwt()` + `session()` callbacks in NextAuth config
- Server-side access: `auth()` from `lib/auth.ts`

### lib/auth.ts exports
```typescript
auth()                      // get current session — safe in server components + route handlers
requireAuth(locale: string) // redirects to /[locale]/login if no session
requireAdmin(locale: string)// redirects to /[locale]/login if no session or role !== 'admin'
```

### AuthCard wiring
- **Register mode:** `fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({...}) })` → on success call `signIn('credentials', { email, password, redirect: false })` (both from `next-auth/react`)
- **Login mode:** `signIn('credentials', { email, password, redirect: false })` directly (from `next-auth/react`)
- Both use existing `msg` state for inline errors
- On successful login: `router.push(`/${locale}`)` (home page, locale from props)

### Middleware
No changes to `proxy.ts`. Admin route protection deferred to Phase 7.

---

## 5. Seed Script

`scripts/seed.ts`:
1. Connect to MongoDB via `lib/db.ts`
2. Import `mockData` from `lib/mock-data.ts`
3. Upsert all matches by `slug` (idempotent)
4. Upsert all news articles by `slug`
5. Log counts on completion
6. Disconnect

Run with: `npx tsx scripts/seed.ts`

---

## 6. Environment Variables

`.env.local`:
```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=<random 32+ char string>
NEXTAUTH_URL=http://localhost:3001
```

`.env.example`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<db>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3001
```

---

## 7. Dependencies to Install

```bash
npm install mongoose next-auth@beta bcryptjs zod
npm install -D @types/bcryptjs tsx
```
