# GROWTH_FUNNEL.md — IronTrack Pulse

Growth funnel stages mapped to actual code flows in the application.

---

## GC Funnel: Visitor → Paying Customer → Retained User

### Stage 1: Awareness → Landing Page Visit

**Route:** `/` (`src/app/page.tsx`)

The landing page is a full marketing site with:
- Hero section: "Run Your Job. Don't Chase It."
- Two CTA buttons: "I'm a General Contractor" → `/signup` | "I'm a Subcontractor" → `/signup/sub`
- Feature showcase: 8 product categories with visual mockups
- Integration bar: MS Project, Primavera P6, Excel, XML, CSV
- "Who We Serve" section: Superintendents, PMs, Subcontractors
- Pricing section: $19.99/mo GC, $10/mo Sub (on landing page)
- Competitor comparison positioning vs. Procore ($500+/mo) and Fieldwire
- Footer links: Terms, Privacy, Status, Release Notes, Contact email

**Conversion point:** "Get Started" buttons → `/signup` or `/signup/sub`

---

### Stage 2: Signup → Account Creation

**Route:** `/signup` (`src/app/signup/page.tsx`)

- Email + password form
- Supabase auth.signUp()
- Email confirmation sent
- On confirmation → redirect to dashboard

**Friction points:**
- Email confirmation required (Supabase default) — can lose users here
- No social auth (Google, GitHub, etc.) — email/password only

---

### Stage 3: Subscription → Payment

**Route:** `/subscribe` (`src/app/subscribe/page.tsx`)

- Shows $19.99/mo price card
- "Subscribe with Stripe" button
- Redirects to Stripe Checkout (hosted page)
- On success → `/dashboard?success=true`

**⚠️ Current behavior:** Middleware allows users through if no `user_subscriptions` row exists (beta bypass). Users may reach the dashboard without paying.

---

### Stage 4: First Value — Upload & See Results

**Routes:** `/upload` → `/projects/[id]`

This is the **"aha moment"** — the first time a GC uploads a schedule and sees:
1. Activities parsed and organized by day
2. Health score calculated
3. Risks automatically detected
4. Today's activities shown
5. 3-week lookahead generated

**Key insight:** If upload fails (mobile bug, large file timeout, format not supported), the user never reaches the aha moment. Upload reliability is the #1 retention driver.

---

### Stage 5: Daily Engagement — Field Operations

**Route:** `/projects/[id]` (various tabs)

Daily drivers that bring users back:
- **Day Plan tab:** "What's happening today?"
- **Daily Log:** Fill out construction log on site
- **Field Reports:** Photo-first walkthrough observations
- **Safety tab:** Daily toolbox talk
- **Progress updates:** Update percent complete → see reforecast

**Push notifications** (`/api/notifications/check` cron at noon) alert users about at-risk activities.

---

### Stage 6: Team Engagement — Sub Invitations

**Routes:** Sub Management, Week QR Share, Ready Check

This is where growth compounds:
1. GC adds subs to project directory (`DirectoryTab`)
2. GC generates share link or QR code for weekly schedule
3. Sub receives link → views schedule at `/view/[token]` (no login required)
4. Sub acknowledges receipt → GC sees ACK status
5. Sub sees value → potential conversion to paid Sub account

**The sub invitation loop is the primary viral growth mechanism.**

---

### Stage 7: Sub Conversion → $10/month

**Routes:** `/signup/sub` → `/sub/dashboard`

Sub conversion path:
1. Sub experiences value through tokenized view (free, no login)
2. Sub wants more: dispatch board, foreman management, production tracking
3. Sub signs up at `/signup/sub`
4. Sub accesses Sub Ops features
5. Sub subscribes via `/api/stripe/sub-checkout` → $10/month

**⚠️ Unclear:** Whether Sub Ops features currently gate on subscription status. If not, subs get full access without paying.

---

### Stage 8: Retention — Documentation & Compliance

Features that create switching costs:
- **Daily logs** — historical record of every field day
- **Safety talks** — OSHA compliance documentation with attendance records
- **Coordination meeting minutes** — PDF-exported records
- **Punch list** — close-out documentation
- **Submittals + RFIs** — document management with revision history
- **T&M tickets** — signed financial records
- **Schedule snapshots** — point-in-time schedule comparisons

The more data in the system, the harder it is to leave.

---

## Sub Funnel: Invitation → Engagement → Conversion

```
GC shares link ─→ Sub views schedule (no login) ─→ Sub acknowledges receipt
        │                                                    │
        ▼                                                    ▼
 Sub sees value ─→ Sub signs up ($10/mo) ─→ Sub uses Sub Ops daily
        │
        ▼
 Sub invites foremen ─→ Foremen use dispatch + check-in
```

### Key Sub touchpoints (from code):
1. **Tokenized view** (`/view/[token]`) — zero friction, no login
2. **QR week share** (`/view/week/[token]`) — scan QR on site → see this week's schedule
3. **Join flow** (`/join/[projectId]`) — scan QR → enter info → added to directory
4. **Sub Ops dashboard** (`/sub/dashboard`) — after signup, full operations platform
5. **Foreman check-in** — daily production logging from field

---

## Funnel Metrics (What to Track)

Based on code flows, these are the measurable conversion points:

| Stage | Metric | How to Measure |
|-------|--------|----------------|
| Landing → Signup | Signup rate | Supabase auth user creation events |
| Signup → First Upload | Activation rate | `schedule_uploads` table — count users with ≥1 upload |
| Upload → Daily Use | Retention | `daily_logs`, `progress_updates` — daily active users |
| GC → Sub Invite | Viral coefficient | `week_share_links` created, `/view/[token]` visits |
| Sub View → Sub Signup | Sub conversion | `sub_companies` creation events |
| Sub Signup → Paid | Sub monetization | `sub_companies.subscription_status = 'active'` |

---

## Funnel Gaps (Based on Code Inspection)

| Gap | Impact | Fix |
|-----|--------|-----|
| No onboarding flow after signup | GCs may not know to upload a schedule | Add guided first-run experience |
| Upload failure = lost user | Mobile/large file issues kill activation | Continue hardening upload reliability |
| No email follow-up | Users who sign up but don't upload are lost | Add email drip campaign (requires email service) |
| Sub Ops may not gate on payment | Revenue leak from non-paying subs | Verify and enforce subscription check |
| No analytics/tracking in code | Can't measure funnel conversion rates | Add Vercel Analytics or Mixpanel |
| No referral mechanism | Growth limited to direct GC→Sub invites | Consider GC referral incentives |
