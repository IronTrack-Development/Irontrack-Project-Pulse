# BUSINESS_MODEL.md — IronTrack Pulse

## Pricing

| Tier | Price | Who | Billing |
|------|-------|-----|---------|
| **General Contractor** | $19.99/month | GC firms, PMs, superintendents | Stripe monthly subscription |
| **Subcontractor** | $10/month | Sub companies (trade contractors) | Stripe monthly subscription (separate product) |

Both are monthly subscriptions. No annual option, no per-project pricing, no seat limits (as currently implemented).

---

## Revenue Target

**$3,500/month MRR**

### Math to get there:

| Mix | GC Accounts | Sub Accounts | MRR |
|-----|------------|-------------|-----|
| GC only | 175 | 0 | $3,498 |
| Even mix | 100 | 150 | $3,499 |
| Sub-heavy | 50 | 300 | $3,999 |

The most realistic path is a **GC-led, sub-following model**: each GC account that actively uses the platform invites 3–10 subs, who convert to paying sub accounts.

---

## Stripe Implementation

### GC Subscription Flow
1. GC signs up at `/signup` → Supabase auth created
2. Middleware checks `user_subscriptions` table for `status = 'active'`
3. If no active subscription → redirected to `/subscribe`
4. `/subscribe` page → calls `/api/stripe/checkout` → Stripe Checkout session
5. Stripe processes payment → webhook at `/api/stripe/webhook` → updates `user_subscriptions.status = 'active'`
6. User redirected to `/dashboard`

**Env vars:** `STRIPE_PRICE_ID` (GC monthly price), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### Sub Subscription Flow
1. Sub signs up at `/signup/sub` → Supabase auth + sub_company record created
2. Sub accesses `/sub/dashboard`
3. Sub Ops features prompt upgrade → calls `/api/stripe/sub-checkout`
4. Stripe processes payment → webhook at `/api/stripe/sub-webhook` → updates `sub_companies.subscription_status = 'active'`

**Env vars:** `STRIPE_SUB_PRICE_ID` (Sub monthly price — if not set, sub-checkout creates price dynamically ⚠️), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Growth Engine: GC-to-Sub Invite Loop

The primary growth mechanism is embedded in the product:

1. **GC uploads a schedule** → identifies subs on the project
2. **GC adds subs to project directory** (manual or via QR join)
3. **GC shares week view or sub view link** with subs (zero friction — no login required for subs)
4. **Subs interact with their schedule** via the no-auth token view
5. **Sub sees value** (their trades, their scope, real-time data)
6. **Sub converts** to a $10/month Sub Ops account to manage their own operations

**Network effect:** Every GC account has leverage to convert 3–10 subs. At 50 GC accounts with 6 sub conversions each = 300 sub accounts.

---

## Conversion Priorities

### Priority 1: GC Activation
- Get GCs past upload → first schedule view (the "aha moment")
- Upload flow must work on mobile (was a bug in v1.5, fixed)
- Value is immediate on first use — today's activities, risks detected, health score shown

### Priority 2: Sub Invitation
- GC must find it easy to add subs and share links
- Share flow must be zero-friction for the sub (no account required)
- QR code week share is the killer feature here

### Priority 3: Sub Conversion
- Sub must see Sub Ops value before being asked to pay
- The free sub view (tokenized link) demonstrates value; Sub Ops account upgrades it
- ⚠️ **Currently**: sub billing is partially implemented. Sub Ops features do not gate on subscription status in all places — needs verification.

---

## Revenue Risk Factors

| Risk | Mitigation |
|------|-----------|
| GC churn if upload fails | Fix mobile upload bugs first priority |
| Subs don't convert if free view is sufficient | Add Sub Ops features only available to paid sub accounts |
| Stripe webhook failure = users locked out | Middleware has try/catch that lets users through on DB errors |
| Single-user GC accounts | Sub Ops creates stickiness beyond schedule viewing |
| Competitor pricing pressure | Price point is already extremely competitive |

---

## Current Subscription Status Check Logic

From `src/middleware.ts`:
- Checks `user_subscriptions` table for the authenticated user
- If `status !== 'active'` → redirect to `/subscribe`
- If no row found → **allows through** (intentional: new user flow / beta bypass)
- If DB error → **allows through** (prevents lockout)
- Sub routes (`/sub/*`) → no GC subscription check; sub has separate billing

This means: users with no subscription row are not blocked. This may be intentional for beta or early users.

---

## Unit Economics (Estimates)

| Metric | Value |
|--------|-------|
| GC MRR per account | $19.99 |
| Sub MRR per account | $10.00 |
| Stripe fee (est.) | ~3% + $0.30 |
| GC net per account | ~$19.09 |
| Sub net per account | ~$9.40 |
| Break-even MRR target | $3,500 |
| Accounts needed (GC only) | 175 |
| Accounts needed (50/50 mix) | ~100 GC + 150 Sub |

No infrastructure cost data available in codebase. Supabase and Vercel plan tiers are ⚠️ unverified.
