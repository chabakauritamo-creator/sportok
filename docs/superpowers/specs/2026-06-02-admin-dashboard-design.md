# Admin Dashboard — Design Spec

**Date:** 2026-06-02  
**Scope:** Admin-only dashboard with Media Library CRUD, Users management, and content image management  
**Supersedes:** Cloudinary upload spec (`2026-06-02-cloudinary-upload-design.md`) — absorbs and extends it

---

## 1. Routes & Architecture

```
app/[locale]/admin/
├── layout.tsx            ← requireAdmin() guard + sidebar shell (server component)
├── page.tsx              ← dashboard overview (counts: media, users, news, matches)
├── media/page.tsx        ← Media Library CRUD
├── users/page.tsx        ← Users management
├── news/page.tsx         ← News hero image replacement
├── matches/page.tsx      ← Match hero image replacement
└── teams/page.tsx        ← Team logo replacement

app/api/admin/
├── media/
│   ├── route.ts          ← GET (list all), POST (save record after upload)
│   └── [id]/route.ts     ← DELETE (Cloudinary destroy + DB delete)
├── users/
│   ├── route.ts          ← GET (list all users)
│   └── [id]/route.ts     ← PATCH (role toggle), DELETE (remove user)

app/api/upload/sign/route.ts      ← GET: generate signed Cloudinary upload params
app/api/news/[slug]/route.ts      ← add PATCH handler (update hero URL)
app/api/matches/[slug]/route.ts   ← add PATCH handler (update hero URL)
app/api/teams/[id]/route.ts       ← new: GET (list) + PATCH (update logo URL)
```

**Auth:** `requireAdmin(locale)` called once in `admin/layout.tsx`. All child routes inherit protection. No per-route guard needed.

---

## 2. Data Model — Media

New Mongoose model `models/Media.ts`:

```typescript
{
  url:        string     // Cloudinary secure_url
  publicId:   string     // Cloudinary public_id (required for server-side delete)
  filename:   string     // original filename
  uploadedAt: Date       // default: Date.now
  uploadedBy: ObjectId   // ref → User
  usedIn:     string[]   // e.g. ['news/barca-vs-psg', 'team/barcelona']
}
```

**Upload flow:**
1. Client `GET /api/upload/sign` → `{ signature, timestamp, api_key, cloud_name }`
2. Browser POSTs directly to Cloudinary → returns `{ secure_url, public_id }`
3. Client `POST /api/admin/media` with `{ url, publicId, filename }` → creates Media record
4. Client `PATCH /api/news/[slug]` (or matches/teams) with `{ hero: url }` → updates content + appends slug to `Media.usedIn`

**Delete flow:**
1. `DELETE /api/admin/media/[id]`
2. Server calls `cloudinary.uploader.destroy(publicId)` via Node SDK
3. Deletes Media document from MongoDB
4. Does NOT auto-unlink from content — broken image on content page signals admin to replace

---

## 3. Users Management

**API endpoints:**
| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/users` | List all users: `{ _id, email, name, role, createdAt }` |
| PATCH | `/api/admin/users/[id]` | Body `{ role: 'user' \| 'admin' }` — toggle role |
| DELETE | `/api/admin/users/[id]` | Delete user account |

**Safety rules:**
- Admin cannot delete or demote their own account: check `session.user.id !== id`
- Cannot delete last admin: check `adminCount > 1` before delete or role demote

**UI (`admin/users/page.tsx`):**
- Table columns: Email | Name | Role | Since | Actions
- Role toggle: single button, no confirm (reversible action)
- Delete: confirm dialog required (irreversible)
- Own row: toggle + delete buttons disabled, tooltip "Cannot modify own account"

---

## 4. Media Library UI

**`admin/media/page.tsx`:**
- "Upload New Image" button at top → file picker → full upload flow → grid refreshes
- Responsive grid of MediaCard components
- Each card: thumbnail (160×120) | filename | upload date | usedIn slugs (or "unused")
- Delete button on each card → confirm dialog → Cloudinary destroy + DB delete → card removed
- `router.refresh()` after upload or delete

**Components:**
| Component | Location | Type | Purpose |
|-----------|----------|------|---------|
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | client | Sidebar nav with active link highlight |
| `MediaGrid` | `components/admin/MediaGrid.tsx` | client | Grid container for MediaCards |
| `MediaCard` | `components/admin/MediaCard.tsx` | client | Single image card with delete |
| `ImageUploader` | `components/admin/ImageUploader.tsx` | client | File input + sign + Cloudinary POST + PATCH |
| `UserTable` | `components/admin/UserTable.tsx` | client | Users table with role toggle + delete |
| `ConfirmDialog` | `components/admin/ConfirmDialog.tsx` | client | Reusable confirm modal |

---

## 5. Admin Layout & Sidebar

**`admin/layout.tsx`** (server component):
- Top header: "Admin Panel" label + SignOutButton
- Left sidebar + `{children}` content area
- Sidebar uses `<AdminSidebar>` (client, reads `usePathname()` for active state)

**Sidebar links:**
```
Overview
─────────────
Media Library  → /[locale]/admin/media
Users          → /[locale]/admin/users
─────────────
News           → /[locale]/admin/news
Matches        → /[locale]/admin/matches
Teams          → /[locale]/admin/teams
```

---

## 6. Image Upload Flow (Sign Endpoint)

**`GET /api/upload/sign`:**
- Checks admin session → 401 if not admin
- Generates: `timestamp = Math.round(Date.now() / 1000)`
- Signature: `sha1('folder=sportok&timestamp=' + timestamp + CLOUDINARY_API_SECRET)`
- Returns: `{ signature, timestamp, api_key, cloud_name, folder: 'sportok' }`

**`ImageUploader` client component:**
- Props: `resourceType: 'news' | 'match' | 'team' | 'media'`, `slug?: string`, `onSuccess: (url: string) => void`
- Validates file size ≤ 10MB before upload
- Shows progress % via `XMLHttpRequest` upload events
- On Cloudinary success: calls `POST /api/admin/media`, then optional `PATCH` on content
- States: idle | uploading (n%) | success | error

---

## 7. Dependencies

**New package:**
```bash
npm install cloudinary
```
Used server-side only in `DELETE /api/admin/media/[id]` for `cloudinary.uploader.destroy(publicId)`.

**Environment variables (`.env.local`):**
```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

---

## 8. i18n Keys

Add to both `messages/ka.json` and `messages/en.json`:

```json
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
  "media": {
    "upload": "Upload New Image",
    "deleteConfirm": "Delete this image? This cannot be undone.",
    "unused": "unused",
    "uploading": "Uploading...",
    "tooLarge": "File must be under 10MB",
    "saveFailed": "Image uploaded but save failed — URL:"
  },
  "users": {
    "role": "Role",
    "since": "Since",
    "deleteConfirm": "Delete this user? This cannot be undone.",
    "selfWarning": "Cannot modify own account",
    "makeAdmin": "Make Admin",
    "makeUser": "Make User"
  }
}
```

---

## 9. Security

| Concern | Mitigation |
|---------|-----------|
| Non-admin access | `requireAdmin()` in layout — redirects to login |
| Unauthenticated API calls | All `/api/admin/*` check admin session → 401 |
| API secret exposure | `CLOUDINARY_API_SECRET` server-only, never in client bundle |
| Oversized uploads | Client rejects >10MB; Cloudinary preset restricts resource type |
| Self-delete/demote | Server checks `session.user.id !== id` |
| Last admin deletion | Server checks `adminCount > 1` |

---

## 10. Out of Scope

- Create users via admin (registration flow exists)
- Edit user email or name (belongs in user profile settings)
- Image cropping or transformation UI
- Bulk upload or bulk delete
- Cloudinary Media Library widget
- Content create/delete (Phase 7 full CRUD admin)
- Auto-unlink deleted media from content
