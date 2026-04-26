# KNOWN_BUGS.md — IronTrack Pulse

Bugs and fragile areas found during codebase inspection. Severity rated: 🔴 Critical, 🟡 Medium, 🟢 Low.

---

## Authentication & Access

### 🟡 Sub Company `user_id` Column May Not Exist
**File:** `src/app/api/auth/register-sub/route.ts`, `src/migrations/021_sub_ops.sql`
**Issue:** Migration 021 creates `sub_companies` with columns `name`, `trade`, `contact_name`, `contact_email`, `contact_phone`, `logo_path` — no `user_id`. But the register-sub API:
- Queries: `.eq("user_id", resolvedUserId)`
- Inserts with: `user_id: resolvedUserId`

If the `user_id` column doesn't exist in the actual database, sub signup will throw a DB error.
**Impact:** Sub signup may be broken in production
**Fix:** Check actual Supabase schema. Add migration if column is missing:
```sql
ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
```

### 🟡 Stripe Sub Webhook — Missing Separate Webhook Secret
**File:** `src/app/api/stripe/sub-webhook/route.ts`
**Issue:** Uses `process.env.STRIPE_WEBHOOK_SECRET` (same as GC webhook). If subs have a separate Stripe webhook endpoint, they need a separate secret. Dev fallback skips signature verification when no secret is set.
**Impact:** In dev, webhook runs without signature verification (security risk). In prod, if secrets differ, webhook will fail.
**Fix:** Add `STRIPE_SUB_WEBHOOK_SECRET` to env and update route.

### 🟡 Subscription Check Allows All Users With No Row
**File:** `src/middleware.ts`
**Issue:** Middleware only redirects to `/subscribe` if subscription row exists AND `status !== 'active'`. If no row exists, user is allowed through. This may be intentional (beta bypass) but could be exploited.
**Impact:** Users without any subscription row bypass the paywall
**Note:** May be intentional design for beta. Verify with owner before "fixing."

### 🟢 Sub Ops Features May Not Gate on Subscription Status
**File:** `src/app/api/sub-ops/` routes
**Issue:** Sub Ops API routes don't appear to check `sub_companies.subscription_status` before allowing access. Sub can potentially use Sub Ops features without paying.
**Impact:** Revenue leak if sub billing is enabled
**Fix:** Add subscription status check to sub-ops API routes

---

## Payments

### 🔴 `STRIPE_SUB_PRICE_ID` Missing Creates Dynamic Prices
**File:** `src/app/api/stripe/sub-checkout/route.ts`
**Issue:** If `STRIPE_SUB_PRICE_ID` env var is not set, the route creates a new Stripe price on-the-fly:
```javascript
const price = await stripe.prices.create({
  unit_amount: 1000, // $10.00
  ...
});
```
This creates a new orphaned Stripe price every time a sub tries to subscribe without this env var set.
**Impact:** Stripe account littered with orphaned prices; billing becomes unmanageable
**Fix:** Always set `STRIPE_SUB_PRICE_ID` in Vercel environment variables

### 🟡 GC Checkout Stripe API Version Mismatch
**Files:** `src/app/api/stripe/checkout/route.ts` uses `'2024-12-18.acacia'`, while `src/app/api/stripe/webhook/route.ts` and `src/app/api/stripe/sub-checkout/route.ts` use `'2026-03-25.dahlia'`
**Issue:** Different API versions used across Stripe routes may cause inconsistent behavior
**Fix:** Standardize all Stripe clients to use the same API version

---

## File Upload

### 🟡 Upload API Timeout Risk
**File:** `src/app/api/upload/route.ts`, `vercel.json`
**Issue:** Upload is configured with 300s timeout and 1024MB memory on Vercel. Very large files or slow parsing may still time out. No chunked upload support.
**Impact:** Large `.mpp` or `.xer` files from big projects may fail
**Workaround:** File size capped at 100MB in upload API

### 🟡 Monthly Upload Limit Logic Bug Risk
**File:** `src/app/api/upload/route.ts`, `src/migrations/004_upload_limits.sql`
**Issue:** `user_uploads` tracks per-day counts. Monthly limit logic requires summing daily counts for current month in application code. If this logic has a bug, users could be incorrectly blocked.
**Impact:** False upload limit triggers → user locked out of uploads
**Status:** ⚠️ Needs code-level verification of monthly counting logic

### 🟢 `decrement_user_storage()` Never Called
**File:** `src/migrations/004_upload_limits.sql`
**Issue:** `decrement_user_storage()` DB function exists but no code calls it when projects or files are deleted. Storage counter only goes up.
**Impact:** User storage quota fills up even after deletions; users may hit limits incorrectly
**Fix:** Call `decrement_user_storage()` in project/file delete handlers

---

## Database & Schema

### 🟡 RLS V1 Open Policies on Most Tables
**Files:** Most migrations (007, 008, 011, 013, 014, 015, 016, 017, 018, 019, 021)
**Issue:** Most tables use `allow_all` RLS policies — any authenticated (or unauthenticated) user can read/write any row. This is documented as "V1" but is a significant security gap.
**Impact:** Users can theoretically access other users' project data
**Risk:** Only exploitable by users who know UUIDs (guessing 128-bit UUIDs is infeasible, but not zero risk)
**Fix:** Full RLS audit — scope all policies to `user_id` or project membership

### 🟡 `company_name` vs `name` in `sub_companies`
**File:** `src/migrations/021_sub_ops.sql`, `src/app/api/sub-ops/companies/`, `src/app/sub/dashboard/page.tsx`
**Issue:** Migration creates column `name TEXT NOT NULL`. Some API routes may reference `company_name`. Inconsistent naming could cause query errors.
**Impact:** Sub company name may not display correctly
**Fix:** Verify actual column name vs. all references in code

### 🟢 `daily_projects` RLS Has Multiple Policy Layers
**File:** `src/migrations/002_add_auth.sql`
**Issue:** Migration drops V1 policies and adds user-scoped + service role policies. But if migration 001 ran V1 policies and migration 002 ran later (separately), there could be policy conflicts.
**Impact:** Likely resolved in practice but worth verifying
**Fix:** Run `SELECT * FROM pg_policies WHERE tablename = 'daily_projects';` in Supabase to verify

---

## UI & UX

### 🟡 Offline Mode Uncertain
**File:** `src/lib/daily-log-offline.ts`
**Issue:** File exists suggesting offline capability was built or planned for daily logs. Actual extent of offline functionality is unclear — may be stubbed or incomplete.
**Impact:** If users try to use daily log on site without connectivity, behavior is undefined
**Fix:** Verify offline capability; document or remove misleading code

### 🟡 Spanish Localization Coverage
**File:** `src/lib/i18n.ts`
**Issue:** i18n file has translations for navigation and ~20 common strings. Complex feature flows (daily log wizard, field reports, Sub Ops) may not be translated.
**Impact:** Incomplete Spanish experience for bilingual crews
**Fix:** Full coverage audit; update or remove marketing claim

### 🟢 Drawing PDF Rendering Performance
**File:** `src/components/drawings/SheetViewer.tsx`
**Issue:** Uses `react-pdf` + `pdfjs-dist` which can be slow for large drawing sheets (24x36 PDFs at high resolution)
**Impact:** Poor UX when viewing large drawing files on mobile
**Fix:** Add lazy loading, thumbnail preview, or PDF.js web worker optimization

### 🟢 Photo Markup Integration
**File:** `src/components/markup/`
**Issue:** `MarkupCanvas.tsx`, `PhotoMarkup.tsx`, `MarkupWrapper.tsx` exist but integration into field reports and daily logs is unclear
**Impact:** Photo markup feature may not be accessible to users
**Fix:** Verify if markup is exposed in UI and document correctly

### 🟢 `demo-record` Route
**File:** `src/app/demo-record/page.tsx`
**Issue:** Route exists but purpose is unclear — likely a screen recording tool or demo flow. Should be protected or removed before full public launch.
**Impact:** Minor — exposed route with unclear purpose
**Fix:** Review and either protect, document, or remove

---

## API & Backend

### 🟡 `ANTHROPIC_API_KEY` Not in `.env.example`
**Files:** `src/app/api/projects/[id]/rfis/ai-draft/route.ts`, `src/app/api/projects/[id]/generate-brief/route.ts`, `src/app/api/schedule-generator/route.ts`
**Issue:** AI features require `ANTHROPIC_API_KEY` but it's not documented in `.env.example`
**Impact:** New developers won't know AI features need this key; features silently fail without it
**Fix:** Add to `.env.example` with placeholder

### 🟡 Push Notification Keys Not in `.env.example`
**Files:** `src/lib/web-push.ts`, `src/app/api/notifications/`
**Issue:** VAPID keys (`WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_EMAIL`) required for push notifications but not in `.env.example`
**Impact:** Push notifications silently fail in new deployments
**Fix:** Add to `.env.example`

### 🟢 Rate Limit Implementation
**File:** `src/lib/rate-limit.ts`
**Issue:** Rate limit file exists. Usage across API routes is ⚠️ not verified during inspection.
**Impact:** If rate limiting is inconsistently applied, some endpoints may be unprotected
**Fix:** Audit which routes use rate limiting

### 🟢 `NEXT_PUBLIC_APP_URL` Fallback Still References Old URL
**File:** `src/app/api/stripe/checkout/route.ts`
**Issue:** Fallback URL is `'https://irontrack-pulse.vercel.app'` (Vercel preview URL, not production domain)
**Impact:** If `NEXT_PUBLIC_APP_URL` is not set, Stripe redirects after payment go to wrong URL
**Fix:** Update fallback or ensure `NEXT_PUBLIC_APP_URL=https://irontrackpulse.com` is always set in Vercel

---

## Mobile-Specific

### 🟢 iOS File Picker for MPP/XER
**Note:** Fixed in v1.5.0 according to release notes. Verify fix is stable.

### 🟢 Bottom Navigation Overlap
**File:** `src/components/navigation/MobileBottomNav.tsx`
**Issue:** Mobile bottom nav may overlap content on some screen sizes. ⚠️ Not directly verified during inspection.
**Fix:** Test on various mobile screen sizes

---

## Documentation

### 🟡 Existing `AGENTS.md` Was a Placeholder
**File:** `AGENTS.md` (original, now replaced)
**Issue:** Original `AGENTS.md` only contained a Next.js version warning. All operational guidance was missing.
**Fix:** Replaced by this Codex handoff package.
