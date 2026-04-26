# MARKETING_PLAN.md — IronTrack Pulse

How each marketing channel supports IronTrack Pulse customer acquisition and retention. This document connects the **external marketing stack** to the **in-product growth loops** documented in `GROWTH_FUNNEL.md`.

---

## Channel Strategy Overview

| Channel | Primary Purpose | Target Audience | Frequency |
|---------|----------------|-----------------|-----------|
| **LinkedIn** | Thought leadership + direct outreach | GC PMs, Superintendents, Construction execs | 3-5x/week |
| **Reddit** | Community engagement + awareness | r/construction, r/projectmanagement, r/SaaS | 2-3x/week |
| **Ghost Newsletter** | Email nurture + retention | Leads who signed up but haven't converted | Weekly |
| **Buffer** | Social scheduling + distribution | LinkedIn + other platforms | Daily |
| **Canva** | Visual content creation | All channels | As needed |
| **HubSpot** | CRM + lead tracking | Leads → customers pipeline | Ongoing |

---

## LinkedIn

### Why It Matters
Construction decision-makers (PMs, Supers, VPs of Operations) are on LinkedIn. It's the primary B2B channel for reaching GC buyers.

### Content Strategy
- **Field-first perspective** — posts from the superintendent's POV, not the software seller's POV
- **Pain-point content:** "Your sub showed up Monday with no idea what was on the schedule"
- **Feature reveals:** Share specific workflows (ready check, daily log, QR share) with screenshots
- **Social proof:** When users share wins, amplify them
- **Comparison content:** "$19.99/mo vs. Procore at $500+/mo — here's what you get"

### How It Connects to Product
- LinkedIn posts → landing page (`irontrackpulse.com`)
- Direct message outreach → signup invitation
- Kevin's personal brand = the human behind IronTrack (authenticity)

### Content Cadence
- 3-5 posts/week
- Mix: 60% value/education, 20% product/feature, 20% personal/story

---

## Reddit

### Target Subreddits
- **r/construction** — GCs, subs, field workers
- **r/projectmanagement** — PMs, schedulers
- **r/SaaS** — SaaS builders (product-building journey)
- **r/smallbusiness** — entrepreneurs building products
- **r/ConstructionManagement** — niche construction PM community

### Content Strategy
- **Answer questions** about construction scheduling, daily logs, sub management
- **Share the building journey** — authentic posts about building a SaaS for construction
- **Don't hard-sell** — provide value first, mention IronTrack when genuinely relevant
- **AMA-style posts** about building construction tech

### How It Connects to Product
- Reddit → landing page for awareness
- Comments include `irontrackpulse.com` link when relevant
- Long-form posts establish expertise and trust

### Rules
- Always follow subreddit rules on self-promotion
- Focus on being helpful, not promotional
- Build karma/reputation before linking to product

---

## Ghost Newsletter

### Purpose
Email nurture for leads who:
- Visited the landing page but didn't sign up
- Signed up but haven't uploaded a schedule
- Are inactive users who need re-engagement

### Newsletter Content
- **Weekly field intelligence digest** — construction industry news + IronTrack feature tips
- **"Feature of the week"** — deep dive on one IronTrack feature with use case
- **Customer stories** — how GCs use specific features (once users exist)
- **Product updates** — tied to release notes (`/release-notes`)

### How It Connects to Product
- Newsletter CTA → signup / login → dashboard
- Feature spotlights → direct links to specific product areas
- Re-engagement emails → remind users of value they're missing

### Integration
- ⚠️ No email capture form found in codebase — Ghost newsletter signup likely lives on external Ghost blog or landing page
- Consider adding email capture to landing page (popup or inline form)

---

## Buffer

### Purpose
Social media scheduling and distribution automation.

### How It's Used
- Schedule LinkedIn posts in advance (batch content creation)
- Cross-post to other platforms if relevant
- Track post performance (engagement, clicks)

### How It Connects to Product
- Buffer → LinkedIn/social → landing page → signup
- Consistent posting cadence without daily manual effort
- Analytics inform which content types drive traffic

---

## Canva

### Purpose
Visual content creation for all channels.

### Content Types
- **LinkedIn graphics** — feature screenshots with branded overlays
- **Comparison charts** — IronTrack vs. Procore vs. Fieldwire
- **Product screenshots** — annotated app screenshots for social proof
- **Newsletter images** — header graphics for Ghost newsletter
- **QR code materials** — physical printouts for job site QR sharing

### Brand System (from README)

| Token | Value | Usage |
|-------|-------|-------|
| Primary Orange | `#E85D1C` (landing) / `#F97316` (app) | CTA buttons, highlights |
| Background | `#0B0B0D` (dark) / `#F5F3EE` (landing) | Page backgrounds |
| Blue | `#3B82F6` | Data/AI elements |
| Green | `#22C55E` | On track / success |
| Yellow | `#EAB308` | Warning / watch |
| Red | `#EF4444` | At risk / error |

---

## HubSpot

### Purpose
CRM and lead pipeline management.

### How It's Used
- **Lead tracking** — capture leads from LinkedIn conversations, newsletter signups, Reddit interactions
- **Pipeline stages:** Lead → Trial → Active Customer → Churned
- **Contact management** — track which GCs have been contacted, their company size, projects
- **Deal tracking** — $19.99/mo GC accounts + $10/mo Sub accounts

### How It Connects to Product
- HubSpot CRM is the external tracking layer
- Product engagement data (uploads, daily logins) could be synced via webhook/API (⚠️ not currently implemented in code)
- Manual tracking of high-value leads from LinkedIn outreach

### Integration Gaps
- No HubSpot tracking code found in codebase
- No automatic lead capture from signup → HubSpot
- Currently likely used as a standalone CRM disconnected from the product
- **Opportunity:** Add HubSpot tracking pixel to landing page; send signup events via HubSpot API

---

## Channel-to-Funnel Mapping

```
LinkedIn post ─────────┐
Reddit post ───────────┤
Newsletter email ──────┤─→ Landing Page (/) ─→ Signup ─→ Upload ─→ Daily Use
Google search ─────────┤                                    │
Direct/referral ───────┘                                    ▼
                                                  Sub Invite Loop
                                                  (viral growth)
```

### Top-of-Funnel (Awareness)
- LinkedIn thought leadership
- Reddit community presence
- SEO / organic search (landing page)

### Mid-Funnel (Consideration)
- Ghost newsletter nurture
- LinkedIn DM conversations
- HubSpot lead tracking

### Bottom-of-Funnel (Conversion)
- Landing page → Signup flow
- Free trial / beta bypass → first upload
- Stripe checkout ($19.99/mo)

### Post-Conversion (Retention + Expansion)
- In-product engagement (daily logs, field reports, safety talks)
- Push notifications (noon daily cron)
- Newsletter feature spotlights
- GC → Sub invite loop ($10/mo sub conversion)

---

## Key Marketing Metrics to Track

| Metric | Source | Current Status |
|--------|--------|----------------|
| LinkedIn post impressions | LinkedIn / Buffer | Available |
| Landing page visitors | Vercel Analytics ⚠️ | Not confirmed if enabled |
| Signup rate | Supabase auth events | Available in Supabase Dashboard |
| Newsletter subscribers | Ghost | Available in Ghost Dashboard |
| Trial-to-paid conversion | Stripe Dashboard | Available |
| MRR | Stripe Dashboard | Available |
| Reddit post engagement | Reddit | Manual tracking |
| HubSpot pipeline value | HubSpot | Available |

---

## Marketing Priorities (Recommended)

1. **LinkedIn consistency** — 3-5 posts/week is the minimum. Kevin's personal brand is the engine.
2. **Landing page → signup conversion** — Ensure signup flow is frictionless. Consider adding social proof (testimonials, user count).
3. **Email capture** — Add newsletter signup to landing page. Currently no capture mechanism in the codebase.
4. **Reddit presence** — Be genuinely helpful in r/construction. Don't hard sell.
5. **Sub invite loop** — The best marketing is the product itself. Every GC who shares a schedule link is a distribution channel.
6. **HubSpot integration** — Connect signup events to HubSpot for pipeline visibility. Currently disconnected.
