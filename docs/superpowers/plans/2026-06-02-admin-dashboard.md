# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only dashboard at `/[locale]/admin/` with Cloudinary image upload, Media Library CRUD, Users management (role toggle + delete), and per-content image replacement pages.

**Architecture:** Shared `admin/layout.tsx` calls `requireAdmin(locale)` once — all child routes inherit protection. Images upload browser→Cloudinary via server-signed requests; `Media` Mongoose collection tracks every upload. Server components fetch MongoDB directly (no HTTP round-trip). Client components handle mutations and call `router.refresh()` to re-sync server data.

**Tech Stack:** Next.js 16 App Router, Mongoose 9, Cloudinary Node SDK v3, Node.js `crypto` (SHA-1 signing), Tailwind CSS 4, TypeScript

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `models/Media.ts` | Mongoose schema for uploaded images |
| `lib/cloudinary.ts` | Configured cloudinary v2 singleton |
| `app/api/upload/sign/route.ts` | GET — generate signed Cloudinary params |
| `app/api/admin/media/route.ts` | GET list + POST create Media record |
| `app/api/admin/media/[id]/route.ts` | DELETE — Cloudinary destroy + DB delete |
| `app/api/admin/users/route.ts` | GET list all users |
| `app/api/admin/users/[id]/route.ts` | PATCH role toggle + DELETE user |
| `app/api/teams/route.ts` | GET list all teams |
| `app/api/teams/[id]/route.ts` | PATCH team logo (Team doc + embedded in Match) |
| `app/[locale]/admin/layout.tsx` | requireAdmin guard + sidebar shell |
| `app/[locale]/admin/page.tsx` | Overview: counts for media/users/news/matches |
| `app/[locale]/admin/media/page.tsx` | Media Library page |
| `app/[locale]/admin/users/page.tsx` | Users management page |
| `app/[locale]/admin/news/page.tsx` | News hero image replacement |
| `app/[locale]/admin/matches/page.tsx` | Match hero image replacement |
| `app/[locale]/admin/teams/page.tsx` | Team logo replacement |
| `components/admin/AdminSidebar.tsx` | Client sidebar with active-link highlight |
| `components/admin/ConfirmDialog.tsx` | Reusable confirm modal |
| `components/admin/ImageUploader.tsx` | File input + sign + XHR upload + Media POST |
| `components/admin/MediaGrid.tsx` | Client grid wrapper with upload + refresh |
| `components/admin/MediaCard.tsx` | Single image card with delete |
| `components/admin/UserTable.tsx` | Client table with role toggle + delete |
| `components/admin/ContentImageTable.tsx` | Reusable table for news/matches/teams image pages |

### Modified files
| File | Change |
|------|--------|
| `next.config.ts` | Add `res.cloudinary.com` to remotePatterns |
| `messages/en.json` | Add `admin` key block |
| `messages/ka.json` | Add `admin` key block |
| `app/api/news/[slug]/route.ts` | Add PATCH handler |
| `app/api/matches/[slug]/route.ts` | Add PATCH handler |

---

## Task 1: Install Cloudinary SDK + configure environment + update next.config.ts

**Files:**
- Modify: `next.config.ts`
- Modify: `.env.local`

- [ ] **Step 1: Install cloudinary package**

```bash
cd /Users/chubaka/Desktop/vibecoding/sportok
npm install cloudinary
```

Expected: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Add env vars to .env.local**

Open `.env.local` and add these three lines (use your actual values from Cloudinary dashboard):

```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

- [ ] **Step 3: Add Cloudinary to next.config.ts remotePatterns**

Current `next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
```

Replace with:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "chore: install cloudinary SDK, add env config and remotePattern"
```

---

## Task 2: Media Mongoose model + Cloudinary singleton

**Files:**
- Create: `models/Media.ts`
- Create: `lib/cloudinary.ts`

- [ ] **Step 1: Create models/Media.ts**

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMedia extends Document {
  url: string;
  publicId: string;
  filename: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
  usedIn: string[];
}

const MediaSchema = new Schema<IMedia>({
  url: { type: String, required: true },
  publicId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usedIn: [{ type: String }],
});

export const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>('Media', MediaSchema);
```

- [ ] **Step 2: Create lib/cloudinary.ts**

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add models/Media.ts lib/cloudinary.ts
git commit -m "feat: add Media mongoose model and cloudinary singleton"
```

---

## Task 3: Add admin i18n keys to both locale files

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ka.json`

- [ ] **Step 1: Add admin block to messages/en.json**

Add after the `"common"` block (before the closing `}`):

```json
,
  "admin": {
    "title": "Admin Panel",
    "nav": {
      "overview": "Overview",
      "media": "Media Library",
      "users": "Users",
      "news": "News",
      "matches": "Matches",
      "teams": "Teams"
    },
    "overview": {
      "heading": "Dashboard"
    },
    "media": {
      "heading": "Media Library",
      "upload": "Upload New Image",
      "deleteConfirm": "Delete this image? This cannot be undone.",
      "unused": "unused",
      "uploading": "Uploading...",
      "tooLarge": "File must be under 10MB",
      "uploadFailed": "Upload unavailable, try again",
      "saveFailed": "Image uploaded but save failed",
      "replaceImage": "Replace Image"
    },
    "users": {
      "heading": "Users",
      "role": "Role",
      "since": "Since",
      "actions": "Actions",
      "deleteConfirm": "Delete this user? This cannot be undone.",
      "selfWarning": "Cannot modify own account",
      "makeAdmin": "Make Admin",
      "makeUser": "Make User",
      "delete": "Delete"
    }
  }
```

- [ ] **Step 2: Add admin block to messages/ka.json**

Add after the `"common"` block (before the closing `}`):

```json
,
  "admin": {
    "title": "ადმინ პანელი",
    "nav": {
      "overview": "მთავარი",
      "media": "მედია",
      "users": "მომხმარებლები",
      "news": "სიახლეები",
      "matches": "თამაშები",
      "teams": "გუნდები"
    },
    "overview": {
      "heading": "დაშბორდი"
    },
    "media": {
      "heading": "მედია ბიბლიოთეკა",
      "upload": "ახალი სურათის ატვირთვა",
      "deleteConfirm": "წავშალოთ სურათი? ეს შეუქცევადია.",
      "unused": "გამოუყენებელი",
      "uploading": "იტვირთება...",
      "tooLarge": "ფაილი უნდა იყოს 10MB-ზე ნაკლები",
      "uploadFailed": "ატვირთვა მიუწვდომელია, სცადე თავიდან",
      "saveFailed": "სურათი ატვირთულია, მაგრამ შენახვა ვერ მოხერხდა",
      "replaceImage": "სურათის შეცვლა"
    },
    "users": {
      "heading": "მომხმარებლები",
      "role": "როლი",
      "since": "თარიღი",
      "actions": "მოქმედება",
      "deleteConfirm": "წავშალოთ მომხმარებელი? ეს შეუქცევადია.",
      "selfWarning": "საკუთარი ანგარიშის შეცვლა შეუძლებელია",
      "makeAdmin": "ადმინად დანიშვნა",
      "makeUser": "მომხმარებლად გადაყვანა",
      "delete": "წაშლა"
    }
  }
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. The `Dictionary` type auto-updates from the JSON inference.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/ka.json
git commit -m "feat: add admin i18n keys to en and ka locales"
```

---

## Task 4: Cloudinary sign API endpoint

**Files:**
- Create: `app/api/upload/sign/route.ts`

- [ ] **Step 1: Create app/api/upload/sign/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createHash } from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=sportok&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    folder: 'sportok',
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify endpoint returns 401 for unauthenticated requests**

```bash
curl -s http://localhost:3001/api/upload/sign | jq .
```

Expected: `{"error":"Unauthorized"}`

- [ ] **Step 4: Commit**

```bash
git add app/api/upload/sign/route.ts
git commit -m "feat: add Cloudinary signed upload endpoint"
```

---

## Task 5: Admin Media API (GET list, POST create, DELETE)

**Files:**
- Create: `app/api/admin/media/route.ts`
- Create: `app/api/admin/media/[id]/route.ts`

- [ ] **Step 1: Create app/api/admin/media/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Media } from '@/models/Media';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const media = await Media.find().sort({ uploadedAt: -1 }).lean();
  return NextResponse.json(media);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { url, publicId, filename, usedIn } = body;
  if (!url || !publicId || !filename) {
    return NextResponse.json({ error: 'url, publicId, filename required' }, { status: 400 });
  }
  await connectDB();
  const media = await Media.create({
    url,
    publicId,
    filename,
    uploadedBy: session.user.id,
    usedIn: usedIn ?? [],
  });
  return NextResponse.json(media, { status: 201 });
}
```

- [ ] **Step 2: Create app/api/admin/media/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Media } from '@/models/Media';
import { cloudinary } from '@/lib/cloudinary';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await connectDB();
  const media = await Media.findById(id);
  if (!media) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    await cloudinary.uploader.destroy(media.publicId);
  } catch {
    // Cloudinary delete failed — remove DB record anyway to avoid orphans
  }
  await Media.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify endpoints return 401 unauthenticated**

```bash
curl -s http://localhost:3001/api/admin/media | jq .
```

Expected: `{"error":"Unauthorized"}`

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/media/route.ts app/api/admin/media/[id]/route.ts
git commit -m "feat: add admin media API (GET, POST, DELETE)"
```

---

## Task 6: Admin Users API (GET list, PATCH role toggle, DELETE)

**Files:**
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create app/api/admin/users/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const users = await User.find()
    .select('email name role createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(users);
}
```

- [ ] **Step 2: Create app/api/admin/users/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot modify own account' }, { status: 403 });
  }
  const { role } = await request.json();
  if (role !== 'user' && role !== 'admin') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  await connectDB();
  if (role === 'user') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove last admin' }, { status: 403 });
    }
  }
  const user = await User.findByIdAndUpdate(id, { role }, { new: true })
    .select('email name role')
    .lean();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete own account' }, { status: 403 });
  }
  await connectDB();
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete last admin' }, { status: 403 });
    }
  }
  await User.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/users/route.ts app/api/admin/users/[id]/route.ts
git commit -m "feat: add admin users API (GET, PATCH role, DELETE)"
```

---

## Task 7: PATCH news/matches routes + Teams API

**Files:**
- Modify: `app/api/news/[slug]/route.ts`
- Modify: `app/api/matches/[slug]/route.ts`
- Create: `app/api/teams/route.ts`
- Create: `app/api/teams/[id]/route.ts`

- [ ] **Step 1: Add PATCH to app/api/news/[slug]/route.ts**

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { slug } = await params;
    const { hero } = await request.json();
    if (!hero || typeof hero !== 'string') {
      return NextResponse.json({ error: 'hero URL required' }, { status: 400 });
    }
    await connectDB();
    const article = await NewsArticle.findOneAndUpdate(
      { slug },
      { hero },
      { new: true }
    ).lean();
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add PATCH to app/api/matches/[slug]/route.ts**

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { slug } = await params;
    const { hero } = await request.json();
    if (!hero || typeof hero !== 'string') {
      return NextResponse.json({ error: 'hero URL required' }, { status: 400 });
    }
    await connectDB();
    const match = await Match.findOneAndUpdate(
      { slug },
      { hero },
      { new: true }
    ).lean();
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create app/api/teams/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Team } from '@/models/Team';

export async function GET() {
  await connectDB();
  const teams = await Team.find().lean();
  return NextResponse.json(teams);
}
```

- [ ] **Step 4: Create app/api/teams/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Team } from '@/models/Team';
import { Match } from '@/models/Match';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { logo } = await request.json();
    if (!logo || typeof logo !== 'string') {
      return NextResponse.json({ error: 'logo URL required' }, { status: 400 });
    }
    await connectDB();
    const team = await Team.findOneAndUpdate({ id }, { logo }, { new: true }).lean();
    if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await Promise.all([
      Match.updateMany({ 'home.id': id }, { $set: { 'home.logo': logo } }),
      Match.updateMany({ 'away.id': id }, { $set: { 'away.logo': logo } }),
    ]);
    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/news/[slug]/route.ts app/api/matches/[slug]/route.ts \
        app/api/teams/route.ts app/api/teams/[id]/route.ts
git commit -m "feat: add PATCH to news/matches routes, add teams API"
```

---

## Task 8: Admin layout + AdminSidebar component

**Files:**
- Create: `app/[locale]/admin/layout.tsx`
- Create: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create components/admin/AdminSidebar.tsx**

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dictionary } from '@/i18n/config';

interface AdminSidebarProps {
  locale: string;
  t: Dictionary;
}

const NAV_GROUPS = [
  [{ key: 'overview' as const, path: '' }],
  [
    { key: 'media' as const, path: '/media' },
    { key: 'users' as const, path: '/users' },
  ],
  [
    { key: 'news' as const, path: '/news' },
    { key: 'matches' as const, path: '/matches' },
    { key: 'teams' as const, path: '/teams' },
  ],
];

export function AdminSidebar({ locale, t }: AdminSidebarProps) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;

  return (
    <aside className="w-48 shrink-0 border-r border-[var(--color-border)] p-4 min-h-screen">
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4 font-medium">
        {t.admin.title}
      </p>
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="mb-4">
          {gi > 0 && (
            <hr className="border-[var(--color-border)] mb-3" />
          )}
          {group.map(({ key, path }) => {
            const href = `${base}${path}`;
            const active =
              path === ''
                ? pathname === base || pathname === `${base}/`
                : pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                className={`block py-1.5 px-2 text-sm rounded mb-1 transition-colors ${
                  active
                    ? 'bg-[var(--color-accent)] text-black font-medium'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {t.admin.nav[key]}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Create app/[locale]/admin/layout.tsx**

```typescript
import { requireAdmin } from '@/lib/auth';
import { getDictionary } from '@/i18n/config';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getDictionary(locale);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <AdminSidebar locale={locale} t={t} />
      <main className="flex-1 p-6 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Test redirect for non-admin**

With the dev server running, open an incognito window and navigate to `http://localhost:3001/en/admin`. Should redirect to `/en/login`.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/admin/layout.tsx components/admin/AdminSidebar.tsx
git commit -m "feat: add admin layout with requireAdmin guard and sidebar"
```

---

## Task 9: ConfirmDialog + ImageUploader components

**Files:**
- Create: `components/admin/ConfirmDialog.tsx`
- Create: `components/admin/ImageUploader.tsx`

- [ ] **Step 1: Create components/admin/ConfirmDialog.tsx**

```typescript
'use client';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-lg p-6 max-w-sm w-full mx-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-sm text-[var(--color-text)] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-surface-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-[var(--color-danger)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create components/admin/ImageUploader.tsx**

```typescript
'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  resourceType: 'news' | 'match' | 'team' | 'media';
  slug?: string;
  teamId?: string;
  label?: string;
  onSuccess: (url: string, mediaId: string) => void;
}

export function ImageUploader({
  resourceType,
  slug,
  teamId,
  label,
  onSuccess,
}: ImageUploaderProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      return;
    }

    setError(null);
    setProgress(0);

    try {
      const signRes = await fetch('/api/upload/sign');
      if (!signRes.ok) throw new Error('Upload unavailable, try again');
      const { signature, timestamp, api_key, cloud_name, folder } =
        await signRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', api_key);
      formData.append('folder', folder);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

      const uploaded = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (ev) => {
            if (ev.lengthComputable)
              setProgress(Math.round((ev.loaded / ev.total) * 100));
          });
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
            else {
              const msg =
                JSON.parse(xhr.responseText)?.error?.message ?? 'Upload failed';
              reject(new Error(msg));
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.open('POST', cloudUrl);
          xhr.send(formData);
        }
      );

      const usedIn: string[] = [];
      if (resourceType === 'news' && slug) usedIn.push(`news/${slug}`);
      if (resourceType === 'match' && slug) usedIn.push(`match/${slug}`);
      if (resourceType === 'team' && teamId) usedIn.push(`team/${teamId}`);

      const mediaRes = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          filename: file.name,
          usedIn,
        }),
      });
      if (!mediaRes.ok) {
        throw new Error(`Image uploaded but save failed — URL: ${uploaded.secure_url}`);
      }
      const mediaDoc = await mediaRes.json();

      if (resourceType === 'news' && slug) {
        await fetch(`/api/news/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hero: uploaded.secure_url }),
        });
      } else if (resourceType === 'match' && slug) {
        await fetch(`/api/matches/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hero: uploaded.secure_url }),
        });
      } else if (resourceType === 'team' && teamId) {
        await fetch(`/api/teams/${teamId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo: uploaded.secure_url }),
        });
      }

      setProgress(null);
      onSuccess(uploaded.secure_url, mediaDoc._id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(null);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
        className="px-3 py-1.5 text-xs bg-[var(--color-accent)] text-black font-medium rounded hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
      >
        {progress !== null ? `Uploading... ${progress}%` : (label ?? 'Replace Image')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/ConfirmDialog.tsx components/admin/ImageUploader.tsx
git commit -m "feat: add ConfirmDialog and ImageUploader admin components"
```

---

## Task 10: Admin overview page

**Files:**
- Create: `app/[locale]/admin/page.tsx`

- [ ] **Step 1: Create app/[locale]/admin/page.tsx**

```typescript
import { connectDB } from '@/lib/db';
import { Media } from '@/models/Media';
import { User } from '@/models/User';
import { NewsArticle } from '@/models/NewsArticle';
import { Match } from '@/models/Match';
import { getDictionary } from '@/i18n/config';

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  await connectDB();
  const [mediaCount, userCount, newsCount, matchCount] = await Promise.all([
    Media.countDocuments(),
    User.countDocuments(),
    NewsArticle.countDocuments(),
    Match.countDocuments(),
  ]);

  const stats = [
    { label: t.admin.nav.media, count: mediaCount },
    { label: t.admin.nav.users, count: userCount },
    { label: t.admin.nav.news, count: newsCount },
    { label: t.admin.nav.matches, count: matchCount },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[var(--color-text)]">
        {t.admin.overview.heading}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, count }) => (
          <div
            key={label}
            className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface)]"
          >
            <p className="text-2xl font-bold text-[var(--color-text)]">{count}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Test in browser**

Navigate to `http://localhost:3001/en/admin` while logged in as admin. Should see the overview page with 4 stat cards.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/admin/page.tsx
git commit -m "feat: add admin overview page with content counts"
```

---

## Task 11: Media Library page (MediaCard + MediaGrid + page)

**Files:**
- Create: `components/admin/MediaCard.tsx`
- Create: `components/admin/MediaGrid.tsx`
- Create: `app/[locale]/admin/media/page.tsx`

- [ ] **Step 1: Create components/admin/MediaCard.tsx**

```typescript
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

export interface MediaItem {
  _id: string;
  url: string;
  filename: string;
  uploadedAt: string;
  usedIn: string[];
}

interface MediaCardProps {
  item: MediaItem;
  deleteConfirmMessage: string;
  onDelete: (id: string) => void;
}

export function MediaCard({ item, deleteConfirmMessage, onDelete }: MediaCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
        <div className="relative w-full h-32 bg-[var(--color-surface-2)]">
          <Image
            src={item.url}
            alt={item.filename}
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>
        <div className="p-2">
          <p className="text-xs text-[var(--color-text)] truncate" title={item.filename}>
            {item.filename}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {new Date(item.uploadedAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-[var(--color-text-dim)] mt-0.5 truncate">
            {item.usedIn.length > 0 ? item.usedIn.join(', ') : 'unused'}
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            className="mt-2 w-full text-xs px-2 py-1 border border-[var(--color-danger)] text-[var(--color-danger)] rounded hover:bg-[var(--color-danger)] hover:text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        message={deleteConfirmMessage}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(item._id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 2: Create components/admin/MediaGrid.tsx**

```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MediaCard, MediaItem } from './MediaCard';
import { ImageUploader } from './ImageUploader';

interface MediaGridProps {
  initialMedia: MediaItem[];
  uploadLabel: string;
  deleteConfirmMessage: string;
}

export function MediaGrid({ initialMedia, uploadLabel, deleteConfirmMessage }: MediaGridProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    setDeleting(null);
    startTransition(() => router.refresh());
  }

  function handleUploadSuccess() {
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-4">
        <ImageUploader
          resourceType="media"
          label={uploadLabel}
          onSuccess={handleUploadSuccess}
        />
      </div>
      {initialMedia.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {initialMedia.map((item) => (
            <div key={item._id} className={deleting === item._id ? 'opacity-40' : ''}>
              <MediaCard
                item={item}
                deleteConfirmMessage={deleteConfirmMessage}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create app/[locale]/admin/media/page.tsx**

```typescript
import { connectDB } from '@/lib/db';
import { Media } from '@/models/Media';
import { MediaGrid } from '@/components/admin/MediaGrid';
import { getDictionary } from '@/i18n/config';
import { MediaItem } from '@/components/admin/MediaCard';

export default async function AdminMediaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  await connectDB();
  const raw = await Media.find().sort({ uploadedAt: -1 }).lean();
  const media: MediaItem[] = raw.map((m) => ({
    _id: (m._id as { toString(): string }).toString(),
    url: m.url,
    filename: m.filename,
    uploadedAt: m.uploadedAt.toISOString(),
    usedIn: m.usedIn,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[var(--color-text)]">
        {t.admin.media.heading}
      </h1>
      <MediaGrid
        initialMedia={media}
        uploadLabel={t.admin.media.upload}
        deleteConfirmMessage={t.admin.media.deleteConfirm}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/MediaCard.tsx components/admin/MediaGrid.tsx \
        app/[locale]/admin/media/page.tsx
git commit -m "feat: add Media Library page with grid, upload, and delete"
```

---

## Task 12: Users management page

**Files:**
- Create: `components/admin/UserTable.tsx`
- Create: `app/[locale]/admin/users/page.tsx`

- [ ] **Step 1: Create components/admin/UserTable.tsx**

```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ConfirmDialog';

export interface UserRow {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface UserTableProps {
  initialUsers: UserRow[];
  currentUserId: string;
  makeAdminLabel: string;
  makeUserLabel: string;
  deleteLabel: string;
  deleteConfirmMessage: string;
  selfWarning: string;
}

export function UserTable({
  initialUsers,
  currentUserId,
  makeAdminLabel,
  makeUserLabel,
  deleteLabel,
  deleteConfirmMessage,
  selfWarning,
}: UserTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleRole(id: string, currentRole: 'user' | 'admin') {
    setLoading(id);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setLoading(null);
    startTransition(() => router.refresh());
  }

  async function deleteUser(id: string) {
    setLoading(id);
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setLoading(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-left">
              <th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Role</th>
              <th className="pb-2 pr-4 font-medium">Since</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => {
              const isSelf = user._id === currentUserId;
              const isLoading = loading === user._id;
              return (
                <tr
                  key={user._id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="py-2 pr-4 text-[var(--color-text)]">{user.email}</td>
                  <td className="py-2 pr-4 text-[var(--color-text)]">{user.name}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        user.role === 'admin'
                          ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[var(--color-text-muted)]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {isSelf ? (
                      <span
                        className="text-xs text-[var(--color-text-dim)]"
                        title={selfWarning}
                      >
                        —
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRole(user._id, user.role)}
                          disabled={isLoading}
                          className="text-xs px-2 py-1 border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors"
                        >
                          {user.role === 'admin' ? makeUserLabel : makeAdminLabel}
                        </button>
                        <button
                          onClick={() => setConfirmId(user._id)}
                          disabled={isLoading}
                          className="text-xs px-2 py-1 border border-[var(--color-danger)] text-[var(--color-danger)] rounded hover:bg-[var(--color-danger)] hover:text-white disabled:opacity-50 transition-colors"
                        >
                          {deleteLabel}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={confirmId !== null}
        message={deleteConfirmMessage}
        onConfirm={() => {
          if (confirmId) deleteUser(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
```

- [ ] **Step 2: Create app/[locale]/admin/users/page.tsx**

```typescript
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UserTable, UserRow } from '@/components/admin/UserTable';
import { getDictionary } from '@/i18n/config';
import { auth } from '@/lib/auth';

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);
  const session = await auth();

  await connectDB();
  const raw = await User.find()
    .select('email name role createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const users: UserRow[] = raw.map((u) => ({
    _id: (u._id as { toString(): string }).toString(),
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[var(--color-text)]">
        {t.admin.users.heading}
      </h1>
      <UserTable
        initialUsers={users}
        currentUserId={session!.user.id}
        makeAdminLabel={t.admin.users.makeAdmin}
        makeUserLabel={t.admin.users.makeUser}
        deleteLabel={t.admin.users.delete}
        deleteConfirmMessage={t.admin.users.deleteConfirm}
        selfWarning={t.admin.users.selfWarning}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/UserTable.tsx app/[locale]/admin/users/page.tsx
git commit -m "feat: add Users management page with role toggle and delete"
```

---

## Task 13: Content image replacement pages (news, matches, teams)

**Files:**
- Create: `components/admin/ContentImageTable.tsx`
- Create: `app/[locale]/admin/news/page.tsx`
- Create: `app/[locale]/admin/matches/page.tsx`
- Create: `app/[locale]/admin/teams/page.tsx`

- [ ] **Step 1: Create components/admin/ContentImageTable.tsx**

```typescript
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploader } from './ImageUploader';

export interface ContentRow {
  id: string;
  label: string;
  imageUrl: string;
  resourceType: 'news' | 'match' | 'team';
  slug?: string;
  teamId?: string;
}

interface ContentImageTableProps {
  rows: ContentRow[];
  replaceLabel: string;
}

export function ContentImageTable({ rows, replaceLabel }: ContentImageTableProps) {
  const router = useRouter();
  const [images, setImages] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.id, r.imageUrl]))
  );

  function handleSuccess(id: string, url: string) {
    setImages((prev) => ({ ...prev, [id]: url }));
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-left">
            <th className="pb-2 pr-4 font-medium w-20">Image</th>
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              <td className="py-2 pr-4">
                <div className="relative w-16 h-10 rounded overflow-hidden bg-[var(--color-surface-2)]">
                  {images[row.id] && (
                    <Image
                      src={images[row.id]}
                      alt={row.label}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>
              </td>
              <td className="py-2 pr-4 text-[var(--color-text)]">{row.label}</td>
              <td className="py-2">
                <ImageUploader
                  resourceType={row.resourceType}
                  slug={row.slug}
                  teamId={row.teamId}
                  label={replaceLabel}
                  onSuccess={(url) => handleSuccess(row.id, url)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create app/[locale]/admin/news/page.tsx**

```typescript
import { connectDB } from '@/lib/db';
import { NewsArticle } from '@/models/NewsArticle';
import { ContentImageTable, ContentRow } from '@/components/admin/ContentImageTable';
import { getDictionary } from '@/i18n/config';

export default async function AdminNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  await connectDB();
  const articles = await NewsArticle.find()
    .select('slug hero title')
    .sort({ publishedAt: -1 })
    .lean();

  const rows: ContentRow[] = articles.map((a) => ({
    id: a.slug,
    label: (a.title as { ka: string; en: string })[locale as 'ka' | 'en'] ?? a.slug,
    imageUrl: a.hero,
    resourceType: 'news',
    slug: a.slug,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[var(--color-text)]">
        {t.admin.nav.news}
      </h1>
      <ContentImageTable rows={rows} replaceLabel={t.admin.media.replaceImage} />
    </div>
  );
}
```

- [ ] **Step 3: Create app/[locale]/admin/matches/page.tsx**

```typescript
import { connectDB } from '@/lib/db';
import { Match } from '@/models/Match';
import { ContentImageTable, ContentRow } from '@/components/admin/ContentImageTable';
import { getDictionary } from '@/i18n/config';

export default async function AdminMatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  await connectDB();
  const matches = await Match.find()
    .select('slug hero home away')
    .sort({ kickoff: -1 })
    .lean();

  const rows: ContentRow[] = matches.map((m) => {
    const home = m.home as { name: { ka: string; en: string } };
    const away = m.away as { name: { ka: string; en: string } };
    const homeName = home.name[locale as 'ka' | 'en'] ?? m.slug;
    const awayName = away.name[locale as 'ka' | 'en'] ?? '';
    return {
      id: m.slug,
      label: `${homeName} vs ${awayName}`,
      imageUrl: (m.hero as string) ?? '',
      resourceType: 'match',
      slug: m.slug,
    };
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[var(--color-text)]">
        {t.admin.nav.matches}
      </h1>
      <ContentImageTable rows={rows} replaceLabel={t.admin.media.replaceImage} />
    </div>
  );
}
```

- [ ] **Step 4: Create app/[locale]/admin/teams/page.tsx**

```typescript
import { connectDB } from '@/lib/db';
import { Team } from '@/models/Team';
import { ContentImageTable, ContentRow } from '@/components/admin/ContentImageTable';
import { getDictionary } from '@/i18n/config';

export default async function AdminTeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  await connectDB();
  const teams = await Team.find().lean();

  const rows: ContentRow[] = teams.map((team) => ({
    id: team.id,
    label: team.name[locale as 'ka' | 'en'] ?? team.id,
    imageUrl: team.logo,
    resourceType: 'team',
    teamId: team.id,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[var(--color-text)]">
        {t.admin.nav.teams}
      </h1>
      <ContentImageTable rows={rows} replaceLabel={t.admin.media.replaceImage} />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ContentImageTable.tsx \
        app/[locale]/admin/news/page.tsx \
        app/[locale]/admin/matches/page.tsx \
        app/[locale]/admin/teams/page.tsx
git commit -m "feat: add content image replacement pages for news, matches, teams"
```

---

## Task 14: Final typecheck + lint + end-to-end smoke test

- [ ] **Step 1: Full typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors (warnings OK if pre-existing).

- [ ] **Step 3: Manual smoke test checklist**

With dev server running and logged in as admin user:

| Test | Expected |
|------|----------|
| Visit `/en/admin` | Overview page with 4 stat cards |
| Visit `/en/admin/media` | Media Library grid (empty or with uploads) |
| Upload an image on media page | Progress bar → image appears in grid |
| Delete an uploaded image | Confirm dialog → image disappears |
| Visit `/en/admin/users` | Table of all users |
| Click "Make Admin" on a non-admin user | Role badge changes to admin |
| Click "Make User" to revert | Role badge changes back |
| Visit `/en/admin/news` | List of news articles with thumbnails |
| Upload image for a news article | Thumbnail updates in table |
| Visit `/en/admin/teams` | List of teams (empty if Team collection not seeded) |
| Visit `/en/admin` in incognito (no auth) | Redirect to `/en/login` |
| Sidebar navigation | Active link highlighted correctly |

- [ ] **Step 4: Commit if any fixes applied**

```bash
git add -A
git commit -m "fix: address typecheck and lint issues from final review"
```

---

## Notes for implementer

- **Team collection:** If `Team.find()` returns empty on `/admin/teams`, the seed script hasn't populated the standalone Team collection. Teams are embedded in Match documents. The teams page will just show an empty table — that's correct behavior, not a bug.
- **Dictionary type:** `t.admin.*` is fully typed from JSON inference. If TypeScript complains about `t.admin`, verify both JSON files have the `admin` block added in Task 3.
- **Auth session in server pages:** `admin/layout.tsx` calls `requireAdmin()` which throws/redirects — child pages don't need to repeat the check. However, `admin/users/page.tsx` calls `auth()` a second time to get `session.user.id` for the self-protection UI — this is intentional.
- **Cloudinary publicId format:** After upload, `public_id` from Cloudinary includes the folder prefix, e.g. `sportok/abc123`. The `cloudinary.uploader.destroy()` call uses this full path including folder.
