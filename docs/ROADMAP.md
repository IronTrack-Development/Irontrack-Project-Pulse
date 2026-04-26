# ROADMAP.md — IronTrack Pulse

Items here are derived from TODOs in code, partially-built features, and the `DEMO-UPDATES-SUMMARY.md`. This is **not a committed plan** — everything requires owner approval before implementation.

---

## Must-Have Before Public Debut

These are incomplete features or bugs that block a professional public launch:

### 1. Schedule Engine — Complete Trade Activities (30 min estimate)
**Status:** Partially complete (see `DEMO-UPDATES-SUMMARY.md`)
**What's missing:**
- 26 trade activities not yet added to `MASTER_TEMPLATE` in `src/lib/schedule-engine.ts`
- Phases missing: remaining demolition (Phase 2), wet/dry utilities, sitework (Phase 2), waterproofing below-grade (Phase 3), ceiling grid/ACT, insulation (Phase 7), specialties/elevator/fire alarm/low voltage/sitework paving/waterproofing above-grade (Phase 8)
- Script exists: `complete-schedule-updates.ps1` — ready to run
**Impact:** Schedule Generator shows incomplete trade options

### 2. Schedule Engine — Procurement Predecessor Links (15 min estimate)
**Status:** Planned, not implemented
**What's missing:** 10 existing installation activities need predecessor references to procurement deliveries:
- Activity 4000 (Steel Erection) → P104
- Activity 6020 (Storefront) → P304
- Activity 7060 (Doors) → P404
- Activity 5020 (HVAC Ductwork) → P504
- Activity 5010 (Fire Sprinkler) → P604
- Activity 5040 (Electrical Rough) → P704
- Activity 6040 (Roofing) → P803
- Activity 8010 (Carpet) → P1003
- Activity 4100 (CMU Wall) → P1103
- Activity 3020 (Rebar) → P1204
**Impact:** Procurement critical path doesn't drive installation timing correctly

### 3. Fix `.env.example` — Missing Variables
**Status:** `.env.example` is incomplete
**Missing variables:**
```env
STRIPE_SUB_PRICE_ID=          # Sub $10/mo Stripe price ID
ANTHROPIC_API_KEY=             # Required for AI RFI drafting + daily brief
WEB_PUSH_PUBLIC_KEY=           # Required for push notifications (VAPID)
WEB_PUSH_PRIVATE_KEY=          # Required for push notifications (VAPID)
WEB_PUSH_EMAIL=                # Required for web push
STRIPE_SUB_WEBHOOK_SECRET=     # Verify if separate from main webhook secret
```
**Impact:** New developers can't configure the app correctly

### 4. Verify Sub Company `user_id` Column
**Status:** Potential schema/code mismatch
**Issue:** `src/migrations/021_sub_ops.sql` creates `sub_companies` with columns `name`, `trade`, `contact_name`, etc. — no `user_id`. But `src/app/api/auth/register-sub/route.ts` tries to query by `user_id` and insert with `user_id`.
**Action:** Verify actual Supabase DB state. If `user_id` column doesn't exist, add migration.

### 5. Sub Subscription Gating
**Status:** Sub Ops features may not properly gate on `subscription_status`
**Issue:** Sub billing is implemented (`sub-checkout`, `sub-webhook`) but code verification needed that Sub Ops features actually check `subscription_status = 'active'` on `sub_companies`
**Impact:** Subs may access paid features without paying

### 6. Verify Ready Check SMS/Email Sending
**Status:** Ready check UI generates message text, but actual sending mechanism unclear
**Issue:** `ReadyCheckModal` generates message text and send method (sms/email/copy). Backend at `/api/projects/[id]/ready-checks` stores the record. It's unclear if actual SMS/email is sent or if "copy" is the only real mechanism.
**Action:** Verify if SMS/email integration exists or if this is copy-to-send UX only. Document honestly on feature page.

### 7. Spanish Localization — Verify Coverage
**Status:** `src/lib/i18n.ts` has translations for navigation and common strings. Feature tabs and complex flows may not be fully translated.
**Action:** Audit coverage; either complete or remove from marketing claims

### 8. Quantity Grouping UI in Schedule Generator
**Status:** Not started (per `DEMO-UPDATES-SUMMARY.md`)
**What's missing:** Quantities panel in `schedule-generator/page.tsx` needs reorganization with headers:
- Interior Finishes, MEP, Building Envelope, Sitework/Utilities, Other
**Impact:** UX is cluttered for the 40+ quantity fields

---

## Post-Launch (Good to Have)

These add real value but aren't blocking launch:

### Sub Ops Standalone Pricing
**Current state:** Landing page shows "Coming Soon" card for Sub Ops standalone at TBD price
**What's needed:** Separate Stripe product/price for standalone Sub Ops (no GC schedule tools); currently subs get Sub Ops as part of the $10/month plan
**Files:** Landing page pricing section, `src/app/api/stripe/sub-checkout/route.ts`

### Non-Arizona Inspections
**Current state:** Inspection module only seeds Arizona jurisdictions (107 total)
**What's needed:** Other state jurisdiction databases; or a generic "custom jurisdiction" input
**Files:** `src/migrations/012_inspections.sql`, `src/migrations/013b_jurisdiction_inspection_codes.sql`

### Photo Markup
**Current state:** `src/components/markup/` exists with `MarkupCanvas.tsx`, `PhotoMarkup.tsx`, `MarkupWrapper.tsx`
**Status:** Component files exist — integration status and completeness ⚠️ needs verification
**What's needed:** Full markup canvas integration in field reports and daily logs

### Sub Notification to Foreman on Dispatch
**Current state:** Dispatches created but foreman notification mechanism unclear
**What's needed:** Push notification or SMS to foreman when dispatched
**Files:** `src/app/api/sub-ops/companies/[companyId]/dispatches/`, `src/lib/notifications.ts`

### Project Deletion with Storage Cleanup
**Current state:** `UPLOAD_LIMITS_IMPLEMENTATION.md` notes `decrement_user_storage()` function exists but no deletion handler calls it
**What's needed:** When project deleted, call `decrement_user_storage()` and clean up Supabase Storage files
**Files:** `src/app/api/projects/[id]/route.ts`, storage cleanup logic

### Admin Dashboard (Storage Usage)
**Current state:** `UPLOAD_LIMITS_IMPLEMENTATION.md` lists as future enhancement
**What's needed:** Admin view of all users' storage usage for cost management

### Email Notifications at Storage Limit
**Current state:** Settings page shows visual warning at 80% storage
**What's needed:** Proactive email notification when approaching limits

### XER Export (Primavera P6)
**Current state:** Import from XER exists (`src/lib/xer-parser.ts`). Export exists only for MSPDI.
**What's needed:** Export back to XER format for P6 users
**Revenue relevance:** Medium — P6 users are enterprise

### XLSX Export for Activities
**Current state:** `src/lib/export-xlsx.ts` exists
**Status:** ⚠️ Needs verification — unclear if it's exposed in the UI
**What's needed:** Download full activity list as Excel

---

## Later Ideas

Only IronTrack Pulse. Items for consideration after revenue target is hit:

### Multi-User GC Accounts
**Current state:** GC subscription is per-user-id. No team/org concept.
**What's needed:** Team seats, project-level access control, org admin
**Revenue impact:** Enables $X/user/month or team pricing upsells

### RLS Hardening (User-Scoped)
**Current state:** Most tables use V1 open-access policies (`allow_all`). User scoping only exists on `daily_projects`, `user_subscriptions`, `user_uploads`, `user_storage`, `push_subscriptions`.
**What's needed:** Full RLS audit and policy update for all tables
**Caution:** High-risk change — requires careful testing

### iOS/Android Native Apps
**Current state:** Release notes page has iOS/Android platform filters but no native app releases
**Status:** Web app is mobile-responsive. Native apps not built.
**Revenue impact:** High — field use on mobile is critical

### Offline Mode
**Current state:** `src/lib/daily-log-offline.ts` exists — suggests offline was considered
**Status:** ⚠️ Extent of offline capability unclear; likely partial or stubbed
**What's needed:** Service worker, local data queue, sync on reconnect
**Revenue impact:** High for field use in areas with poor connectivity

### Sub Progress Reports to GC
**Current state:** Sub tokenized view allows subs to submit reports. GC can see via `/api/projects/[id]/sub-status` and `/api/projects/[id]/subs/[subId]/reports`
**Status:** Working. ⚠️ GC-facing sub report aggregation view completeness needs verification.

### AI Schedule Optimization
**Current state:** Schedule Generator uses deterministic CPM, not AI
**What's needed:** AI recommendations for schedule compression, crew optimization, recovery actions
**Revenue impact:** High-value add for PM users

### More Building Types / Regions
**Current state:** Schedule Generator has 17 building types (US commercial construction)
**What's needed:** Heavy civil, infrastructure, tenant improvement templates; non-US jurisdictions
