# VERCEL_DEPLOYMENT.md — IronTrack Pulse

## Deployment Model

- **Platform:** Vercel
- **Production URL:** `irontrackpulse.com`
- **Preview URL:** `irontrack-pulse.vercel.app` (legacy, still referenced in checkout fallback)
- **Auto-deploy:** Push to `main` triggers production deploy
- **Preview deploys:** Non-main branches get preview URLs automatically

---

## Build Configuration

### Build Command
```bash
npx next build
```

### Framework
- Next.js 16.2.3 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4

### `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};
```
- `pdf-parse` and `pdfjs-dist` are externalized for server-side PDF parsing
- Server actions body size limit: 20MB

### `vercel.json`
```json
{
  "functions": {
    "src/app/api/upload/route.ts": {
      "maxDuration": 300,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/notifications/check",
      "schedule": "0 12 * * *"
    }
  ]
}
```
- **Upload route:** 300-second timeout, 1024MB memory (handles large schedule files)
- **Daily cron:** Notification check runs at noon UTC every day

---

## Environment Variables (Vercel)

Set these in Vercel Dashboard → Project Settings → Environment Variables.

### Required

| Variable | Example | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Public — safe in browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Public — safe in browser |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | 🔴 Server only — never expose |
| `STRIPE_SECRET_KEY` | `sk_live_...` | 🔴 Server only |
| `STRIPE_PRICE_ID` | `price_1Abc...` | GC $19.99/mo monthly price |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | GC webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | `https://irontrackpulse.com` | Used for Stripe redirects, share links |

### Recommended (Missing from .env.example)

| Variable | Example | Notes |
|----------|---------|-------|
| `STRIPE_SUB_PRICE_ID` | `price_1Xyz...` | Sub $10/mo price — **set this to avoid dynamic price creation** |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Required for AI RFI drafting + daily brief |
| `WEB_PUSH_PUBLIC_KEY` | `BDxr...` | VAPID public key for push notifications |
| `WEB_PUSH_PRIVATE_KEY` | `5Z0i...` | VAPID private key for push notifications |
| `WEB_PUSH_EMAIL` | `mailto:admin@irontrackpulse.com` | VAPID subject (required by spec) |

### Variable Scoping

| Scope | Variables |
|-------|-----------|
| **Production + Preview + Development** | All `NEXT_PUBLIC_*` variables |
| **Production only** | `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Preview / Development** | `STRIPE_SECRET_KEY` (test), test webhook secret |

---

## Preview Deployments

- Every PR/branch push creates a unique preview URL
- Preview URLs use the same env vars as production **unless overridden** in Vercel
- ⚠️ **Risk:** If preview uses production Stripe keys, test payments will charge real cards
- **Best practice:** Set separate test Stripe keys for the Preview environment in Vercel

---

## Production Branch

- **Branch:** `main`
- **Auto-deploy on push:** Yes
- Never push broken code to `main` — always run `npx next build` locally first
- Never force-push to `main`

---

## Deployment Checklist

Before merging to main:

1. [ ] `npx next build` succeeds locally
2. [ ] `npx tsc --noEmit` passes (no type errors)
3. [ ] Tested core flows: login, signup, upload, dashboard
4. [ ] If touching Stripe: tested with test card `4242 4242 4242 4242`
5. [ ] If touching DB: migration SQL is committed but NOT auto-run
6. [ ] If adding env vars: documented and set in Vercel Dashboard
7. [ ] PR reviewed by owner for any Stripe/auth/RLS changes

---

## Rollback

### Quick Rollback
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Code Rollback
```bash
git revert <commit-sha>
git push origin main
```

### Database Rollback
- Supabase does not support automatic migration rollback
- Write a reverse migration SQL and run manually
- **Never DROP tables** — use `ALTER TABLE` to undo column additions
- Supabase daily backups available (check plan tier)

---

## Domain Configuration

- **Custom domain:** `irontrackpulse.com`
- **DNS:** Configured in Vercel (or external DNS pointing to Vercel)
- **SSL:** Auto-provisioned by Vercel
- **Redirect:** Ensure `www.irontrackpulse.com` → `irontrackpulse.com` (or vice versa)

---

## Performance Notes

- **Upload API** is the most resource-intensive route (300s timeout, 1024MB memory)
- **Schedule parsing** happens server-side — large `.mpp` files can use significant CPU
- **PDF generation** (field reports, coordination minutes, safety talks) is done server-side
- **Drawing viewer** uses client-side PDF rendering (`react-pdf` + `pdfjs-dist`)
- Lazy-loading is used for all project tabs (dynamic imports with `next/dynamic`)

---

## Monitoring

- Vercel provides built-in:
  - Deployment logs
  - Function invocation logs
  - Error tracking (runtime errors)
  - Analytics (if enabled)
- Check Vercel → Functions tab for timeout/memory issues on the upload route
- Check Supabase Dashboard for database performance (slow queries, connection count)
