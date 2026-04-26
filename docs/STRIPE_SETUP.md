# STRIPE_SETUP.md — IronTrack Pulse

## Overview

IronTrack Pulse has **two separate Stripe billing flows**:
1. **GC (General Contractor)** — $19.99/month subscription
2. **Sub (Subcontractor)** — $10/month subscription

Both use Stripe Checkout (redirect-to-hosted-page) and Stripe webhooks for status updates.

---

## Products & Prices

### GC Subscription
- **Price:** $19.99/month recurring
- **Stripe Price ID:** Set via `STRIPE_PRICE_ID` env var
- **Product:** Created manually in Stripe Dashboard
- **Checkout route:** `POST /api/stripe/checkout` (`src/app/api/stripe/checkout/route.ts`)
- **Webhook route:** `POST /api/stripe/webhook` (`src/app/api/stripe/webhook/route.ts`)
- **DB table:** `user_subscriptions`

### Sub Subscription
- **Price:** $10/month recurring
- **Stripe Price ID:** Set via `STRIPE_SUB_PRICE_ID` env var
- **Product name:** "IronTrack Progress Reports — Monthly"
- **⚠️ DANGER:** If `STRIPE_SUB_PRICE_ID` is not set, the code creates a new price on every checkout attempt:
  ```javascript
  const price = await stripe.prices.create({
    unit_amount: 1000, // $10.00
    currency: "usd",
    recurring: { interval: "month" },
    product_data: { name: "IronTrack Progress Reports — Monthly" },
  });
  ```
  **Always set this env var in production.**
- **Checkout route:** `POST /api/stripe/sub-checkout` (`src/app/api/stripe/sub-checkout/route.ts`)
- **Webhook route:** `POST /api/stripe/sub-webhook` (`src/app/api/stripe/sub-webhook/route.ts`)
- **DB table:** `sub_companies` (columns: `stripe_customer_id`, `subscription_status`, `subscription_ends_at`)

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | Yes | API key (`sk_test_...` for dev, `sk_live_...` for prod) |
| `STRIPE_PRICE_ID` | Yes | GC $19.99/month price ID (e.g. `price_1Abc...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes (prod) | Webhook signing secret for GC webhook |
| `STRIPE_SUB_PRICE_ID` | Yes (prod) | Sub $10/month price ID — **set this to avoid dynamic price creation** |
| `NEXT_PUBLIC_APP_URL` | Recommended | Used for Stripe success/cancel redirect URLs |

⚠️ `.env.example` only lists `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`. The sub-specific variables are missing.

---

## Webhook Events Handled

### GC Webhook (`/api/stripe/webhook`)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `user_subscriptions.status = 'active'`, save `stripe_subscription_id` + `stripe_customer_id` |
| `customer.subscription.updated` | Update `user_subscriptions.status` + `current_period_end` |
| `customer.subscription.deleted` | Set `user_subscriptions.status = 'canceled'` |

### Sub Webhook (`/api/stripe/sub-webhook`)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `sub_companies.subscription_status = 'active'`, save `stripe_customer_id`, `subscription_ends_at` |
| `customer.subscription.updated` | Update `sub_companies.subscription_status` + `subscription_ends_at` |
| `customer.subscription.deleted` | Set `sub_companies.subscription_status = 'inactive'` |
| `invoice.payment_failed` | Set `sub_companies.subscription_status = 'past_due'` |

---

## Stripe API Versions

⚠️ **Version inconsistency detected:**

| File | API Version |
|------|-------------|
| `src/app/api/stripe/checkout/route.ts` | `'2024-12-18.acacia'` (with `@ts-expect-error`) |
| `src/app/api/stripe/webhook/route.ts` | `'2026-03-25.dahlia'` |
| `src/app/api/stripe/sub-checkout/route.ts` | `'2026-03-25.dahlia'` |
| `src/app/api/stripe/sub-webhook/route.ts` | `'2026-03-25.dahlia'` |

**Recommendation:** Standardize all to `'2026-03-25.dahlia'` (latest).

---

## Checkout Flow Details

### GC Flow
1. User on `/subscribe` clicks "Subscribe"
2. Frontend: `POST /api/stripe/checkout` with `{ projectId }` (optional)
3. Backend:
   - Get authenticated user from Supabase session
   - Look up or create Stripe customer
   - Create Stripe Checkout session with `STRIPE_PRICE_ID`
   - Return `{ url: session.url }`
4. Frontend redirects to Stripe-hosted checkout page
5. After payment: redirects to `/dashboard?success=true`
6. Stripe fires `checkout.session.completed` → webhook updates `user_subscriptions`

**Success URL:** `${NEXT_PUBLIC_APP_URL}/dashboard?success=true`  
**Cancel URL:** `${NEXT_PUBLIC_APP_URL}/subscribe?canceled=true`  
**Fallback URL:** `https://irontrack-pulse.vercel.app` (⚠️ old Vercel preview URL — update)

### Sub Flow
1. Sub Ops dashboard triggers checkout
2. Frontend: `POST /api/stripe/sub-checkout` with `{ sub_company_id, return_url }`
3. Backend:
   - Fetch sub company from DB (uses service client — no auth check ⚠️)
   - Look up or create Stripe customer
   - Use `STRIPE_SUB_PRICE_ID` or create price dynamically
   - Create Stripe Checkout session
   - Return `{ url, session_id }`
4. Redirect to Stripe checkout
5. After payment: redirects to `${return_url}?checkout=success`

---

## Webhook Security

### GC Webhook
- Requires `STRIPE_WEBHOOK_SECRET` — throws error if not set
- Signature verification is mandatory

### Sub Webhook
- Uses `STRIPE_WEBHOOK_SECRET` (same env var as GC ⚠️)
- **Dev fallback:** If secret is not set, skips signature verification and parses body as JSON
  ```javascript
  console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
  event = JSON.parse(body) as Stripe.Event;
  ```
  **🔴 This is unsafe for production.** Consider adding `STRIPE_SUB_WEBHOOK_SECRET` as a separate env var.

---

## Test Mode Requirements

For local development:
1. Use test mode keys (`sk_test_...` / `pk_test_...`)
2. Create a test product + price in Stripe Dashboard
3. Set `STRIPE_PRICE_ID` to the test price ID
4. Set `STRIPE_SUB_PRICE_ID` to a test sub price ID
5. Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
6. Set `STRIPE_WEBHOOK_SECRET` to the CLI-provided signing secret
7. Test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## Production Safety Rules 🔴

1. **Never modify live Stripe products or prices** without owner approval
2. **Never use test keys in production** — verify `STRIPE_SECRET_KEY` starts with `sk_live_`
3. **Always set `STRIPE_SUB_PRICE_ID`** to prevent dynamic price creation
4. **Never log full Stripe event objects** — they contain customer PII
5. **Standardize API versions** across all Stripe client instantiations
6. **Consider separate webhook secrets** for GC and Sub webhook endpoints
7. **Monitor Stripe Dashboard** for orphaned prices (from missing `STRIPE_SUB_PRICE_ID`)
8. The sub-checkout endpoint has **no auth check** — it uses service client directly. Verify this is intentional or add auth.
