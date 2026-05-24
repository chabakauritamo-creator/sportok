# Phase 2 + Auth: Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up MongoDB/Mongoose data layer, public API routes for matches and news, and NextAuth v5 credentials-based sign-up/sign-in — with no changes to frontend pages (they stay on mockData).

**Architecture:** Mongoose singleton connection cached on `global` to survive Next.js hot reload. NextAuth v5 handles JWT sessions with `role` in the token. API routes are fully independent from frontend pages — pages still import `mockData` directly.

**Tech Stack:** mongoose, next-auth@beta, bcryptjs, zod, tsx (dev), Next.js 16 App Router

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `.env.local` | Create | Real credentials (never commit) |
| `.env.example` | Create | Documented keys, no real values |
| `lib/db.ts` | Create | Singleton Mongoose connection |
| `lib/auth.ts` | Create | NextAuth v5 config + `auth()` / `requireAuth()` / `requireAdmin()` |
| `models/User.ts` | Create | User schema (email, passwordHash, role, createdAt) |
| `models/Team.ts` | Create | Team schema |
| `models/League.ts` | Create | League schema |
| `models/Match.ts` | Create | Match schema (all optional nested fields) |
| `models/NewsArticle.ts` | Create | NewsArticle schema |
| `app/api/auth/[...nextauth]/route.ts` | Create | NextAuth v5 GET+POST handler |
| `app/api/auth/register/route.ts` | Create | POST register endpoint |
| `app/api/matches/route.ts` | Create | GET all matches |
| `app/api/matches/[slug]/route.ts` | Create | GET single match |
| `app/api/news/route.ts` | Create | GET paginated news |
| `app/api/news/[slug]/route.ts` | Create | GET single article |
| `scripts/seed.ts` | Create | Upsert mockData into MongoDB |
| `components/Providers.tsx` | Create | SessionProvider wrapper (client component) |
| `app/layout.tsx` | Modify | Add `<Providers>` around `{children}` |
| `components/AuthCard.tsx` | Modify | Wire register fetch + `signIn()` |

---

## Task 1: Install Dependencies + Environment Files

**Files:**
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1.1: Install runtime dependencies**

```bash
cd /Users/chubaka/Desktop/vibecoding/sportok
npm install mongoose next-auth@beta bcryptjs zod
```

Expected: packages added to `node_modules`, `package.json` dependencies updated.

- [ ] **Step 1.2: Install dev dependencies**

```bash
npm install -D @types/bcryptjs tsx
```

- [ ] **Step 1.3: Create `.env.local`**

Create file at project root. Replace the URI with the actual MongoDB Atlas connection string and generate a secret.

```bash
openssl rand -base64 32
```

Then create `.env.local`:

```
MONGODB_URI=mongodb+srv://chabakauritamo_db_user:<password>@cluster0.o6bjjqd.mongodb.net/sportok?retryWrites=true&w=majority&appName=Cluster0
AUTH_SECRET=<output from openssl command above>
NEXTAUTH_URL=http://localhost:3001
```

> **Important:** `.env*` is already in `.gitignore` — this file will never be committed.

- [ ] **Step 1.4: Create `.env.example`**

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<db>?retryWrites=true&w=majority
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3001
```

- [ ] **Step 1.5: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "chore: install mongoose, next-auth@beta, bcryptjs, zod"
```

---

## Task 2: MongoDB Connection Singleton

**Files:**
- Create: `lib/db.ts`

- [ ] **Step 2.1: Create `lib/db.ts`**

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

- [ ] **Step 2.2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: add mongoose singleton connection"
```

---

## Task 3: Mongoose Models

**Files:**
- Create: `models/User.ts`
- Create: `models/Team.ts`
- Create: `models/League.ts`
- Create: `models/Match.ts`
- Create: `models/NewsArticle.ts`

- [ ] **Step 3.1: Create `models/User.ts`**

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
```

- [ ] **Step 3.2: Create `models/Team.ts`**

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  id: string;
  name: { ka: string; en: string };
  logo: string;
  short?: string;
}

const TeamSchema = new Schema<ITeam>({
  id: { type: String, required: true, unique: true },
  name: {
    ka: { type: String, required: true },
    en: { type: String, required: true },
  },
  logo: { type: String, required: true },
  short: { type: String },
});

export const Team: Model<ITeam> =
  mongoose.models.Team ?? mongoose.model<ITeam>('Team', TeamSchema);
```

- [ ] **Step 3.3: Create `models/League.ts`**

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeague extends Document {
  id: string;
  name: { ka: string; en: string };
  country: string;
  sport: 'football' | 'basketball' | 'tennis';
}

const LeagueSchema = new Schema<ILeague>({
  id: { type: String, required: true, unique: true },
  name: {
    ka: { type: String, required: true },
    en: { type: String, required: true },
  },
  country: { type: String, required: true },
  sport: { type: String, enum: ['football', 'basketball', 'tennis'], required: true },
});

export const League: Model<ILeague> =
  mongoose.models.League ?? mongoose.model<ILeague>('League', LeagueSchema);
```

- [ ] **Step 3.4: Create `models/Match.ts`**

Match embeds League and Team objects directly (denormalized) to match the existing `lib/types.ts` shape.

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

const BilingualSchema = new Schema({ ka: String, en: String }, { _id: false });

const TeamEmbedSchema = new Schema(
  {
    id: String,
    name: { ka: String, en: String },
    logo: String,
    short: String,
  },
  { _id: false }
);

const LeagueEmbedSchema = new Schema(
  {
    id: String,
    name: { ka: String, en: String },
    country: String,
    sport: String,
  },
  { _id: false }
);

const PastMatchSchema = new Schema(
  {
    id: String,
    date: String,
    home: { name: String, logo: String },
    away: { name: String, logo: String },
    score: { home: Number, away: Number },
    result: { type: String, enum: ['W', 'D', 'L'] },
  },
  { _id: false }
);

export interface IMatch extends Document {
  slug: string;
  sport: 'football' | 'basketball' | 'tennis';
  league: object;
  home: object;
  away: object;
  kickoff: Date;
  venue?: string;
  referee?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  liveMinute?: number;
  score?: { home: number; away: number };
  odds: { home: number; draw?: number; away: number };
  recommendedBet?: object;
  homeLast5?: object[];
  awayLast5?: object[];
  h2hLast5?: object[];
  preview?: object;
  hero?: string;
}

const MatchSchema = new Schema<IMatch>({
  slug: { type: String, required: true, unique: true, index: true },
  sport: { type: String, enum: ['football', 'basketball', 'tennis'], required: true },
  league: { type: LeagueEmbedSchema, required: true },
  home: { type: TeamEmbedSchema, required: true },
  away: { type: TeamEmbedSchema, required: true },
  kickoff: { type: Date, required: true },
  venue: String,
  referee: String,
  status: { type: String, enum: ['SCHEDULED', 'LIVE', 'FINISHED'], required: true },
  liveMinute: Number,
  score: { home: Number, away: Number },
  odds: {
    home: { type: Number, required: true },
    draw: Number,
    away: { type: Number, required: true },
  },
  recommendedBet: {
    selection: BilingualSchema,
    price: Number,
    bookmaker: String,
    confidence: { type: String, enum: ['low', 'medium', 'high'] },
  },
  homeLast5: [PastMatchSchema],
  awayLast5: [PastMatchSchema],
  h2hLast5: [PastMatchSchema],
  preview: {
    ka: { title: String, body: String },
    en: { title: String, body: String },
  },
  hero: String,
});

export const Match: Model<IMatch> =
  mongoose.models.Match ?? mongoose.model<IMatch>('Match', MatchSchema);
```

- [ ] **Step 3.5: Create `models/NewsArticle.ts`**

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsArticle extends Document {
  slug: string;
  hero: string;
  publishedAt: Date;
  author: { ka: string; en: string };
  readMinutes: number;
  tags: string[];
  title: { ka: string; en: string };
  excerpt: { ka: string; en: string };
  body: { ka: string; en: string };
}

const BilingualSchema = new Schema({ ka: String, en: String }, { _id: false });

const NewsArticleSchema = new Schema<INewsArticle>({
  slug: { type: String, required: true, unique: true, index: true },
  hero: { type: String, required: true },
  publishedAt: { type: Date, required: true },
  author: { type: BilingualSchema, required: true },
  readMinutes: { type: Number, required: true },
  tags: [{ type: String }],
  title: { type: BilingualSchema, required: true },
  excerpt: { type: BilingualSchema, required: true },
  body: { type: BilingualSchema, required: true },
});

export const NewsArticle: Model<INewsArticle> =
  mongoose.models.NewsArticle ?? mongoose.model<INewsArticle>('NewsArticle', NewsArticleSchema);
```

- [ ] **Step 3.6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.7: Commit**

```bash
git add models/
git commit -m "feat: add Mongoose models (User, Team, League, Match, NewsArticle)"
```

---

## Task 4: NextAuth v5 Config + SessionProvider

**Files:**
- Create: `lib/auth.ts`
- Create: `components/Providers.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 4.1: Create `lib/auth.ts`**

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { redirect } from 'next/navigation';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;
        const valid = await bcryptjs.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/ka/login',
  },
});

export async function requireAuth(locale: string) {
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);
  return session;
}

export async function requireAdmin(locale: string) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') redirect(`/${locale}/login`);
  return session;
}
```

- [ ] **Step 4.2: Create `components/Providers.tsx`**

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 4.3: Modify `app/layout.tsx`**

Read current content:
```typescript
import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'Sportok', template: '%s · Sportok' },
  description: 'Sports analysis, odds, recommended bets and news.',
};

export const viewport: Viewport = {
  themeColor: '#07111c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

Replace with:
```typescript
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: { default: 'Sportok', template: '%s · Sportok' },
  description: 'Sports analysis, odds, recommended bets and news.',
};

export const viewport: Viewport = {
  themeColor: '#07111c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4.4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.5: Commit**

```bash
git add lib/auth.ts components/Providers.tsx app/layout.tsx
git commit -m "feat: add NextAuth v5 config with Credentials provider and SessionProvider"
```

---

## Task 5: Auth API Routes (NextAuth Handler + Register)

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/auth/register/route.ts`

- [ ] **Step 5.1: Create `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 5.2: Create `app/api/auth/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    await User.create({ name, email, passwordHash });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 5.3: Start dev server and test register endpoint**

```bash
npm run dev
```

In a separate terminal:

```bash
# Test validation error (password too short)
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","password":"short"}' | jq .
```
Expected: `{"error":"Password must be at least 8 characters"}`

```bash
# Test successful register
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' | jq .
```
Expected: `{"ok":true}`

```bash
# Test duplicate email
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' | jq .
```
Expected: `{"error":"Email already registered"}`

- [ ] **Step 5.4: Test NextAuth session endpoint**

```bash
curl -s http://localhost:3001/api/auth/session | jq .
```
Expected: `{}` (no session yet, which is correct)

- [ ] **Step 5.5: Commit**

```bash
git add app/api/auth/
git commit -m "feat: add NextAuth handler and register API route"
```

---

## Task 6: Matches API Routes

**Files:**
- Create: `app/api/matches/route.ts`
- Create: `app/api/matches/[slug]/route.ts`

- [ ] **Step 6.1: Create `app/api/matches/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Match } from '@/models/Match';

export async function GET() {
  try {
    await connectDB();
    const matches = await Match.find({}).sort({ kickoff: -1 }).lean();
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 6.2: Create `app/api/matches/[slug]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Match } from '@/models/Match';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    const match = await Match.findOne({ slug }).lean();
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 6.3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6.4: Commit**

```bash
git add app/api/matches/
git commit -m "feat: add matches API routes (GET all, GET by slug)"
```

---

## Task 7: News API Routes

**Files:**
- Create: `app/api/news/route.ts`
- Create: `app/api/news/[slug]/route.ts`

- [ ] **Step 7.1: Create `app/api/news/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const skip = (page - 1) * limit;

    await connectDB();
    const [articles, total] = await Promise.all([
      NewsArticle.find({}).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      NewsArticle.countDocuments(),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 7.2: Create `app/api/news/[slug]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    const article = await NewsArticle.findOne({ slug }).lean();
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 7.3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7.4: Commit**

```bash
git add app/api/news/
git commit -m "feat: add news API routes (GET paginated list, GET by slug)"
```

---

## Task 8: Seed Script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 8.1: Create `scripts/seed.ts`**

```typescript
import mongoose from 'mongoose';
import { mockData } from '../lib/mock-data';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

// Inline minimal schemas for seeding (avoids model registration conflicts)
const BilingualSchema = new mongoose.Schema({ ka: String, en: String }, { _id: false });
const TeamEmbedSchema = new mongoose.Schema(
  { id: String, name: { ka: String, en: String }, logo: String, short: String },
  { _id: false }
);
const LeagueEmbedSchema = new mongoose.Schema(
  { id: String, name: { ka: String, en: String }, country: String, sport: String },
  { _id: false }
);
const PastMatchSchema = new mongoose.Schema(
  {
    id: String, date: String,
    home: { name: String, logo: String },
    away: { name: String, logo: String },
    score: { home: Number, away: Number },
    result: String,
  },
  { _id: false }
);

const MatchSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  sport: String,
  league: LeagueEmbedSchema,
  home: TeamEmbedSchema,
  away: TeamEmbedSchema,
  kickoff: Date,
  venue: String, referee: String,
  status: String,
  liveMinute: Number,
  score: { home: Number, away: Number },
  odds: { home: Number, draw: Number, away: Number },
  recommendedBet: {
    selection: BilingualSchema,
    price: Number, bookmaker: String, confidence: String,
  },
  homeLast5: [PastMatchSchema],
  awayLast5: [PastMatchSchema],
  h2hLast5: [PastMatchSchema],
  preview: {
    ka: { title: String, body: String },
    en: { title: String, body: String },
  },
  hero: String,
});

const NewsSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  hero: String,
  publishedAt: Date,
  author: BilingualSchema,
  readMinutes: Number,
  tags: [String],
  title: BilingualSchema,
  excerpt: BilingualSchema,
  body: BilingualSchema,
});

const MatchModel = mongoose.models.Match ?? mongoose.model('Match', MatchSchema);
const NewsModel = mongoose.models.NewsArticle ?? mongoose.model('NewsArticle', NewsSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected to MongoDB');

  // Upsert matches
  let matchCount = 0;
  for (const match of mockData.allMatches) {
    await MatchModel.findOneAndUpdate(
      { slug: match.slug },
      { ...match, kickoff: new Date(match.kickoff) },
      { upsert: true, new: true }
    );
    matchCount++;
  }
  console.log(`Seeded ${matchCount} matches`);

  // Upsert news articles
  let newsCount = 0;
  for (const article of mockData.news) {
    await NewsModel.findOneAndUpdate(
      { slug: article.slug },
      { ...article, publishedAt: new Date(article.publishedAt) },
      { upsert: true, new: true }
    );
    newsCount++;
  }
  console.log(`Seeded ${newsCount} news articles`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 8.2: Add seed script to `package.json`**

In `package.json`, add to the `scripts` section:

```json
"seed": "tsx scripts/seed.ts"
```

The full `scripts` block becomes:
```json
"scripts": {
  "dev": "next dev --port 3001",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "seed": "tsx scripts/seed.ts"
}
```

- [ ] **Step 8.3: Run the seed script**

```bash
npm run seed
```

Expected output:
```
Connected to MongoDB
Seeded 12 matches
Seeded 5 news articles
Done
```

- [ ] **Step 8.4: Verify API returns seeded data (dev server must be running)**

```bash
# Should return array of matches
curl -s http://localhost:3001/api/matches | jq 'length'

# Should return paginated news
curl -s 'http://localhost:3001/api/news?page=1&limit=5' | jq '{total, pages}'

# Should return a specific match
curl -s http://localhost:3001/api/matches/barcelona-vs-psg | jq '.slug'

# Should return 404 for unknown slug
curl -s http://localhost:3001/api/matches/does-not-exist | jq .
```

Expected: matches array length > 0, news total > 0, valid match slug, `{"error":"Match not found"}` for 404.

- [ ] **Step 8.5: Commit**

```bash
git add scripts/seed.ts package.json
git commit -m "feat: add seed script to populate MongoDB from mockData"
```

---

## Task 9: Wire AuthCard

**Files:**
- Modify: `components/AuthCard.tsx`

The existing `AuthCard` has a `handle` function that shows a "backend not wired" message after a fake delay. Replace it with real `signIn` and register fetch calls.

- [ ] **Step 9.1: Update `components/AuthCard.tsx`**

Replace the entire file content with:

```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { Dictionary } from '@/i18n/config';

type Mode = 'login' | 'register';

export function AuthCard({ mode, locale, t }: { mode: Mode; locale: string; t: Dictionary }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    if (mode === 'register') {
      if (password !== confirm) {
        setMsg(locale === 'ka' ? 'პაროლები არ ემთხვევა.' : 'Passwords do not match.');
        setPending(false);
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error ?? (locale === 'ka' ? 'შეცდომა.' : 'Error.'));
        setPending(false);
        return;
      }

      // Auto-login after register
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setMsg(locale === 'ka' ? 'რეგისტრაცია შესრულდა. გთხოვთ შეხვიდეთ.' : 'Registered. Please sign in.');
        setPending(false);
        return;
      }
    } else {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setMsg(locale === 'ka' ? 'არასწორი ელ-ფოსტა ან პაროლი.' : 'Invalid email or password.');
        setPending(false);
        return;
      }
    }

    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="card mx-auto w-full max-w-md p-6 md:p-8">
      <h1 className="heading-accent mb-6">
        {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
      </h1>
      <form onSubmit={handle} className="space-y-4">
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.name}</span>
            <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.email}</span>
          <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.password}</span>
          <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">{t.auth.confirmPassword}</span>
            <input type="password" required minLength={8} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? '...' : mode === 'login' ? t.auth.loginBtn : t.auth.registerBtn}
        </button>
        {msg && (
          <div className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-3 text-[12px] text-[var(--color-text-muted)]">
            {msg}
          </div>
        )}
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">{t.auth.or}</span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <button type="button" className="btn btn-ghost w-full">
        {t.auth.googleSignIn}
      </button>

      <p className="mt-6 text-center text-[12px] text-[var(--color-text-muted)]">
        {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
        <Link
          href={`/${locale}/${mode === 'login' ? 'register' : 'login'}`}
          className="text-[var(--color-accent)] font-semibold hover:underline"
        >
          {mode === 'login' ? t.nav.register : t.nav.login}
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 9.2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9.3: Test register flow in browser**

1. Open `http://localhost:3001/ka/register`
2. Fill in name, email, password (≥8 chars), confirm password
3. Submit — should redirect to `http://localhost:3001/ka`
4. Open `http://localhost:3001/ka/login`, sign in with same credentials
5. Should redirect to home

- [ ] **Step 9.4: Test error states in browser**

1. Register with mismatched passwords → should show "Passwords do not match"
2. Register with existing email → should show "Email already registered"
3. Login with wrong password → should show "Invalid email or password"

- [ ] **Step 9.5: Commit**

```bash
git add components/AuthCard.tsx
git commit -m "feat: wire AuthCard to register API and NextAuth credentials signIn"
```

---

## Task 10: Final Verification

- [ ] **Step 10.1: Full typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10.2: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 10.3: Verify all API endpoints**

With dev server running:

```bash
# Matches
curl -s http://localhost:3001/api/matches | jq 'length'
curl -s http://localhost:3001/api/matches/barcelona-vs-psg | jq '{slug, status}'
curl -s http://localhost:3001/api/matches/nonexistent | jq .

# News
curl -s 'http://localhost:3001/api/news?page=1&limit=3' | jq '{total, pages, articleCount: (.articles | length)}'
curl -s http://localhost:3001/api/news/ronaldo-arabia-quarter-final | jq '{slug}'
curl -s http://localhost:3001/api/news/nonexistent | jq .

# Auth
curl -s http://localhost:3001/api/auth/session | jq .
```

- [ ] **Step 10.4: Verify frontend still works on mockData**

Open `http://localhost:3001/ka` — home page should load exactly as before with all matches and news visible. No regressions.

- [ ] **Step 10.5: Final commit**

```bash
git add -A
git commit -m "chore: phase 2 + auth backend complete — API routes live, frontend on mockData"
```

---

## Summary

After completing all tasks:

| Endpoint | Status |
|----------|--------|
| `GET /api/matches` | Live, returns seeded data |
| `GET /api/matches/[slug]` | Live |
| `GET /api/news` | Live, paginated |
| `GET /api/news/[slug]` | Live |
| `POST /api/auth/register` | Live |
| `POST /api/auth/[...nextauth]` | Live (signIn/signOut/session) |

Frontend pages untouched — still read from `mockData`. Page migration to API calls is a separate task in a later phase.
