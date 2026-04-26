# AGENTS.md — IronTrack Pulse: Codex Operating Manual

> **Read this before touching any code.** This is the repo-level operating manual for Codex and any AI agent working in this codebase.

---

## What Is This

**IronTrack Pulse** is a production SaaS for construction field management. It is deployed at [irontrackpulse.com](https://irontrackpulse.com) and serves paying customers. This is not a side project. Breaking changes have real consequences.

**Stack:**
- Next.js 16.2.3 (App Router, TypeScript) — **Note: this is NOT the standard Next.js 14 you may know. Read `/node_modules/next/dist/docs/` before making assumptions about conventions.**
- React 19
- Supabase (PostgreSQL + RLS + Auth + Storage)
- Stripe (GC subscriptions + Sub subscriptions)
- Tailwind CSS v4
- Anthropic Claude SDK (AI features: RFI drafting, schedule generator)
- Vercel (auto-deploy on push to `main`)

---

## Business Context

| User Type | Price | Notes |
|-----------|-------|-------|
| General Contractor (GC) | $19.99/month | Full platform access via Stripe subscription |
| Subcontractor (Sub) | $10/month | Sub Ops platform via separate Stripe sub-webhook |

Revenue target: $3,500/month (~175 GC accounts, or mixed GC + Sub).

**Primary users:** Superintendents, Project Managers, GC companies, Subcontractors.

---

## Commands

```bash
# Install
npm install

# Dev server
npm run dev
# or double-click START.bat (runs on port 3030)

# Build (production check)
npx next build

# Lint
# No lint script configured in package.json — run TypeScript check instead:
npx tsc --noEmit

# Seed demo data (optional)
npx tsx src/seed/seed-demo.ts
```

---

## Priority Order (What Codex Should Work On)

1. **Bug fixes** — broken flows, auth failures, payment failures, data loss
2. **UX polish** — mobile responsiveness, loading states, error messages
3. **New features** — only with explicit approval from project owner

---

## Deployment Rules

- **Push to `main` = auto-deploy to Vercel production.** Never push broken code to main.
- Always test `npx next build` locally before merging.
- Preview deployments are available on all non-main branches.
- The upload API function has `maxDuration: 300` and `memory: 1024` (see `vercel.json`).
- A daily cron runs at `/api/notifications/check` at noon (see `vercel.json`).

---

## PR Creation Guidelines

- One concern per PR. Don't bundle unrelated changes.
- PR title format: `[type]: description` where type is `fix`, `feat`, `refactor`, `docs`, or `chore`.
- Always include: what changed, why, and any manual testing steps.
- If the PR touches database schema, migrations, Stripe, or auth — flag it explicitly and do NOT merge without human review.
- Never force-push to `main`.

---

## Database Safety Rules 🔴 CRITICAL

1. **Never drop tables.** Even if a column or table seems unused.
2. **Never run destructive migrations** without explicit owner approval.
3. **Never modify RLS policies** without approval. Most tables currently use V1 open-access policies (`allow_all`). This is intentional for the beta phase — do not "fix" it without understanding the auth model.
4. All migrations live in `src/migrations/`. Run them manually in Supabase SQL Editor — they are NOT auto-run on deploy.
5. **Backfill scripts are in migrations** as comments. Read them before running.
6. The `user_subscriptions` table controls GC access. The `sub_companies` table controls Sub access. Handle these with extreme care.
7. Supabase project URL is embedded in `README.md`. **Do not expose service role keys in code or commits.**

---

## Stripe Safety Rules 🔴 CRITICAL

1. **Never modify live Stripe products or prices** in production.
2. Use **test mode keys** (`sk_test_...`) for all local development.
3. The GC checkout uses `STRIPE_PRICE_ID` env var. The Sub checkout uses `STRIPE_SUB_PRICE_ID`.
4. If `STRIPE_SUB_PRICE_ID` is not set, the sub-checkout route **creates a new price dynamically** — this is dangerous in production. Always set this env var in Vercel.
5. Webhook secrets: `STRIPE_WEBHOOK_SECRET` (GC) and `STRIPE_WEBHOOK_SECRET` (shared — ⚠️ verify if separate secrets are needed for sub-webhook).
6. Never log full Stripe event objects — they contain customer PII.

---

## Supabase Safety Rules 🔴 CRITICAL

1. **Never modify Supabase Auth config** (email templates, providers, redirect URLs) without owner approval.
2. Storage buckets are public (`public: true`) — all uploaded files are publicly accessible by URL. Do not store PII or sensitive documents without discussing this first.
3. The service role key bypasses all RLS. Only use it in server-side API routes. Never expose it client-side.
4. `src/lib/supabase.ts` — service client. `src/lib/supabase-browser.ts` — client-side. `src/lib/supabase-server.ts` — server components/API routes using `@supabase/ssr`.

---

## Known Fragile Areas ⚠️

| Area | Issue |
|------|-------|
| `src/app/api/upload/route.ts` | 300s Vercel timeout — large files may still fail on slow connections |
| `src/migrations/021_sub_ops.sql` | `sub_companies` table does not have `user_id` column in migration, but `register-sub` API references it — verify actual DB state before touching |
| `src/lib/schedule-engine.ts` | Procurement predecessor linking is partially implemented (see `DEMO-UPDATES-SUMMARY.md`) — 10 activities still need predecessor links |
| `src/app/schedule-generator/page.tsx` | Phase 8 trade activities incomplete (26 activities not yet added to MASTER_TEMPLATE) |
| `.env.example` | Missing: `STRIPE_SUB_PRICE_ID`, `ANTHROPIC_API_KEY`, `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` |
| RLS Policies | Most tables use `allow_all` (V1). Not user-scoped. Do not harden without full auth audit. |
| Sub company `company_name` vs `name` | `sub_companies` migration uses `name TEXT`, but some API routes reference `company_name` — needs verification |
| `STRIPE_WEBHOOK_SECRET` | Same env var name appears to be used for both GC and sub webhooks — confirm if they share a secret or need separate vars |

---

## File Structure Overview

```
src/
├── app/
│   ├── api/           # All API routes (Next.js Route Handlers)
│   ├── dashboard/     # GC dashboard
│   ├── projects/[id]/ # Project detail (all tabs)
│   ├── upload/        # Schedule upload wizard
│   ├── schedule-generator/ # AI schedule simulator
│   ├── sub/           # Sub Ops dashboard
│   ├── view/[token]/  # Tokenized sub view (no login required)
│   ├── join/[projectId]/ # Project join via QR/invite
│   ├── signup/        # GC signup
│   ├── signup/sub/    # Sub signup
│   ├── login/         # GC login
│   ├── subscribe/     # Stripe subscription gate
│   └── [static pages] # terms, privacy, status, release-notes
├── components/        # All UI components (organized by feature)
├── lib/               # Utilities, engines, Supabase clients
├── migrations/        # SQL migration files (run manually in Supabase)
├── seed/              # Demo data seeder
└── types/             # TypeScript type definitions
```

---

## Environment Variables Required

See `docs/VERCEL_DEPLOYMENT.md` for the full list. The `.env.example` file is **incomplete** — refer to deployment docs.

---

## Testing

No automated test suite is configured. Manual testing checklist before any deploy:

- [ ] `npx next build` completes without errors
- [ ] `npx tsc --noEmit` passes
- [ ] Login/signup flow works (both GC and Sub)
- [ ] Stripe checkout completes (use test card `4242 4242 4242 4242`)
- [ ] Schedule upload parses correctly
- [ ] Dashboard loads with project data
- [ ] Sub view token link works without login
