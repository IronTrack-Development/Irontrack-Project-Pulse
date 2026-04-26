# SUPABASE_SETUP.md — IronTrack Pulse

## Overview

Supabase provides:
- **PostgreSQL database** — all application data
- **Auth** — email/password authentication for GC and Sub users
- **Storage** — file storage for photos, drawings, PDFs, SOPs, signatures
- **RLS (Row Level Security)** — access control policies on all tables

---

## Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client) | Supabase project URL (e.g. `https://raxdqjivrathfornpxug.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client) | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only 🔴 | Bypasses all RLS — **never expose client-side** |

---

## Client Architecture

Three Supabase client modules exist:

### 1. `src/lib/supabase.ts` — Server-side (API routes, non-cookie contexts)
- `supabase` — Lazy-initialized client using anon key (via Proxy)
- `getServiceClient()` — Creates service role client that **bypasses all RLS**
- Used in: API route handlers, webhook handlers, background jobs

### 2. `src/lib/supabase-browser.ts` — Client-side (React components)
- Uses `@supabase/ssr` `createBrowserClient()`
- Anon key only — respects RLS
- Used in: All `"use client"` components

### 3. `src/lib/supabase-server.ts` — Server Components & Route Handlers (cookie-aware)
- Uses `@supabase/ssr` `createServerClient()` with `cookies()` from `next/headers`
- Reads/writes auth cookies — needed for authenticated server-side requests
- Used in: Server components, middleware, some API routes

### 4. `src/middleware.ts` — Middleware (session refresh)
- Creates its own `createServerClient` with request/response cookie handling
- Refreshes expired Supabase sessions on every request
- Checks `user_subscriptions` for GC paywall

---

## Auth Configuration

- **Provider:** Email/Password (Supabase built-in)
- **Signup flows:**
  - GC: `/signup` → `supabase.auth.signUp({ email, password })`
  - Sub: `/signup/sub` → `supabase.auth.signUp()` + `POST /api/auth/register-sub`
- **Login flows:**
  - GC: `/login` → `supabase.auth.signInWithPassword()`
  - Sub: `/login/sub` → `supabase.auth.signInWithPassword()`
- **Auth callback:** `GET /api/auth/callback` (handles email confirmation redirects)
- **Session management:** Cookie-based via `@supabase/ssr`

### Auth-Related Code
| File | Purpose |
|------|---------|
| `src/app/signup/page.tsx` | GC signup form |
| `src/app/signup/sub/page.tsx` | Sub signup form |
| `src/app/login/page.tsx` | GC login form |
| `src/app/login/sub/page.tsx` | Sub login form |
| `src/app/api/auth/callback/route.ts` | OAuth/email confirmation callback |
| `src/app/api/auth/register-sub/route.ts` | Creates `sub_companies` record after sub auth signup |
| `src/middleware.ts` | Session refresh, auth check, subscription check |

---

## Storage Buckets

All buckets are created in migration SQL files and are **public** (`public: true`).

| Bucket ID | Created In | Purpose | Public |
|-----------|-----------|---------|--------|
| `daily-log-photos` | Migration 011 | Daily log photos (GPS, timestamp) | ✅ |
| `rfi-photos` | Migration 016 | RFI supporting photos | ✅ |
| `tm-attachments` | Migration 017 | T&M signatures + receipt photos | ✅ |
| `punch-photos` | Migration 018 | Punch list issue/completed photos | ✅ |
| `drawings` | Migration 019 | Drawing set PDFs + sheet images | ✅ |
| `sub-checkin-photos` | Migration 021 | Sub foreman site photos | ✅ |
| `sub-production-photos` | Migration 021 | Sub production tracking photos | ✅ |
| `sub-sop-files` | Migration 021 | Sub SOP document PDFs | ✅ |
| `sub-blocker-photos` | Migration 021 | Sub blocker evidence photos | ✅ |

**⚠️ All buckets are public.** Anyone with the storage URL can access files. This is fine for V1/beta but should be reviewed before handling sensitive documents (plans under NDA, personal photos, etc.).

Storage policies are `allow_all` for uploads/reads per bucket.

### Upload API
- `POST /api/storage-upload` — General storage upload route
- `POST /api/upload` — Schedule file upload (parsing + storage, 300s timeout)
- Various per-feature upload endpoints (e.g., `/api/projects/[id]/daily-logs/[logId]/upload-photo`)

---

## RLS (Row Level Security)

See `docs/DATABASE_SCHEMA.md` for the full RLS breakdown.

### Summary
- **User-scoped tables (6):** `daily_projects`, `schedule_uploads`, `parsed_activities`, `daily_risks`, `daily_briefs`, `user_subscriptions`
  - Policy: `user_id = auth.uid()` or `project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())`
  - Service role bypass exists
- **User SELECT-only (2):** `user_uploads`, `user_storage`
- **Service role only (1):** `notification_log`
- **Open access / `allow_all` (~30 tables):** All other tables

### What This Means
- Authenticated users can see their own projects and related data
- BUT: for most feature tables (daily logs, safety talks, coordination meetings, RFIs, punch list, T&M, Sub Ops, etc.), **any authenticated user can read/write any row**
- This is documented as "V1 — open access" in every migration
- The service role key bypasses everything

### RLS Warnings 🔴
1. **Do not "fix" the open policies** without a full audit — features depend on them
2. The `allow_all` policy means the anon key can also access these tables (RLS uses `true`)
3. Hardening to user-scoped policies requires:
   - Adding `user_id` to all tables (or using project-based ownership)
   - Updating all API routes that use service client vs. user client
   - Full regression testing

---

## What Not to Modify Without Owner Approval

1. **Auth configuration** — email templates, confirmation flows, redirect URLs, providers
2. **Service role key** — never share, never commit, never expose in client code
3. **RLS policies** — don't harden without understanding the auth model
4. **Storage bucket visibility** — changing from public to private breaks all existing file URLs
5. **Seeded data** — `jurisdictions` (107 rows), `toolbox_talk_templates` (20 rows), `coordination_meeting_types` (5 rows)
6. **Database functions** — `update_updated_at()`, `increment_daily_uploads()`, `increment_user_storage()`, `decrement_user_storage()`

---

## Supabase Project Details

- **Project URL:** `https://raxdqjivrathfornpxug.supabase.co` (referenced in README)
- **Dashboard:** `https://supabase.com/dashboard/project/raxdqjivrathfornpxug`
- **SQL Editor:** `https://supabase.com/dashboard/project/raxdqjivrathfornpxug/editor`

---

## Migration Workflow

Migrations are **not auto-applied**. To run a new migration:

1. Write SQL in `src/migrations/NNN_description.sql`
2. Open Supabase SQL Editor
3. Paste SQL and execute
4. Verify with a simple SELECT query
5. Commit the migration file to the repo
6. Document in `docs/DATABASE_SCHEMA.md`

**Never run destructive migrations (DROP TABLE, DELETE, ALTER TABLE DROP COLUMN) without explicit owner approval.**
