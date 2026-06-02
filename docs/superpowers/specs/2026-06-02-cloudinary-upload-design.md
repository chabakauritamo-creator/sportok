# Cloudinary File Upload — Design Spec

**Date:** 2026-06-02  
**Scope:** Admin-only image upload for NewsArticle.hero, Match.hero, Team.logo  
**Approach:** Client → Cloudinary direct upload (signed), new /admin/ page

---

## 1. Architecture & Data Flow

```
Admin browser
    │
    ├─ GET /api/upload/sign  ──► signs params with CLOUDINARY_API_SECRET
    │      returns { signature, timestamp, api_key, cloud_name }
    │
    ├─ POST https://api.cloudinary.com/v1_1/dherpeaxx/image/upload
    │      (direct browser → Cloudinary, signed)
    │      returns { secure_url }
    │
    └─ PATCH /api/news/[slug]      ┐
       PATCH /api/matches/[slug]   ├── saves secure_url to MongoDB
       PATCH /api/teams/[id]       ┘
```

**Auth guard:** Admin page server component calls `requireAdmin(locale)` → redirects non-admins to `/[locale]/login`.  
Sign endpoint and all PATCH endpoints also verify admin session → 401 if not.

---

## 2. New Files

| File | Purpose |
|------|---------|
| `app/[locale]/admin/page.tsx` | Server component, 3-tab admin page |
| `app/api/upload/sign/route.ts` | GET — generate Cloudinary signed upload params |
| `components/admin/ImageUploader.tsx` | Client component — file input, upload, progress |
| `app/api/teams/[id]/route.ts` | GET + PATCH for teams |

## Modified Files

| File | Change |
|------|--------|
| `app/api/news/[slug]/route.ts` | Add PATCH handler |
| `app/api/matches/[slug]/route.ts` | Add PATCH handler |
| `messages/ka.json` | Add `admin` translation keys |
| `messages/en.json` | Add `admin` translation keys |
| `.env.local` | Add Cloudinary env vars |

---

## 3. Component Design

### `app/[locale]/admin/page.tsx`
- Server component
- Calls `requireAdmin(locale)` at top
- Fetches news, matches, teams from MongoDB on load
- Renders 3 tabs: News | Matches | Teams
- Each tab renders a table: thumbnail (80×80) | name/title | `<ImageUploader>` button

### `components/admin/ImageUploader.tsx`
- Client component (`'use client'`)
- Props: `resourceType: 'news' | 'match' | 'team'`, `slug: string`, `currentUrl: string`, `onSuccess: (url: string) => void`
- Internal flow:
  1. File input `accept="image/*"`, client-side size check (max 10MB)
  2. `GET /api/upload/sign` to get signature
  3. `XMLHttpRequest` POST to Cloudinary (exposes upload progress)
  4. On success: calls PATCH endpoint with `secure_url`
  5. Calls `onSuccess(url)` → parent calls `router.refresh()`
- States: idle | uploading (% progress) | success | error

### `/api/upload/sign/route.ts`
```ts
// GET handler — admin session check, then:
const timestamp = Math.round(Date.now() / 1000)
const params = `folder=sportok&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
const signature = sha1(params)
return { signature, timestamp, api_key: CLOUDINARY_API_KEY, cloud_name: CLOUDINARY_CLOUD_NAME }
```

### PATCH `/api/news/[slug]`
```ts
// Body: { hero: string }
// Validates URL is a string, updates NewsArticle.hero in MongoDB
```

### PATCH `/api/matches/[slug]`
```ts
// Body: { hero: string }
// Updates Match.hero in MongoDB
```

### GET + PATCH `/api/teams/[id]`
```ts
// GET: returns all teams (for admin tab)
// PATCH body: { logo: string }
// Updates Team.logo in MongoDB
```

---

## 4. Security

| Concern | Mitigation |
|---------|-----------|
| Unauthenticated uploads | Sign endpoint checks admin session; 401 if not admin |
| Secret exposure | `CLOUDINARY_API_SECRET` server-only, never in client bundle |
| Oversized files | Client rejects >10MB before upload attempt |
| Wrong file type | `accept="image/*"` on input; Cloudinary preset restricts to images |
| PATCH without upload | PATCH endpoints also require admin session |

---

## 5. Error Handling

| Scenario | Behavior |
|----------|---------|
| File >10MB | Inline error, no upload |
| Sign request fails | "Upload unavailable, try again" |
| Cloudinary upload fails | Show Cloudinary error string |
| PATCH fails | "Image uploaded but save failed — URL: [url]" (manual recovery) |
| Not admin | Redirect to login page |

---

## 6. i18n Keys (both ka.json and en.json)

```json
"admin": {
  "title": "Admin",
  "tabs": { "news": "News", "matches": "Matches", "teams": "Teams" },
  "table": { "image": "Image", "name": "Name", "action": "Action" },
  "upload": {
    "button": "Replace Image",
    "uploading": "Uploading...",
    "success": "Uploaded",
    "error": "Upload failed",
    "tooLarge": "File must be under 10MB",
    "saveFailed": "Image uploaded but save failed — URL:"
  }
}
```

---

## 7. Environment Variables

```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

These go in `.env.local` only. Never committed to git.

---

## 8. Out of Scope

- Create / delete news articles, matches, teams (Phase 7 full admin panel)
- Bulk upload
- Image cropping / transformation UI
- Upload for user avatars
- Cloudinary Media Library widget (heavier dependency)
