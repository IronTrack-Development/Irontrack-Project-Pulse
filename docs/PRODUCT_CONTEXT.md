# PRODUCT_CONTEXT.md — IronTrack Pulse

## What Is It

**IronTrack Pulse** is a web-based SaaS platform for construction field management. It gives general contractors and subcontractors a single platform to manage schedules, daily field operations, safety compliance, trade coordination, and documents — from any device, on any job site.

The product is live at **irontrackpulse.com**, built on Next.js + Supabase + Stripe, and deployed on Vercel.

---

## The Problem

Construction schedule management today is:
- **Manual** — schedules live in Microsoft Project or P6 and never leave the PM's laptop
- **Fragmented** — daily logs in Excel, safety forms on paper, punch lists in email threads
- **Expensive** — Procore starts at $500+/month per project; Fieldwire at $54+/user/month
- **Disconnected from the field** — subs don't get their schedule until they show up Monday morning

GCs and sups spend hours every week chasing information that should be instant. Subcontractors have no visibility into when they're needed until someone texts them. Issues that show up on site had warning signs in the schedule three weeks ago.

---

## Who It's For

| User | Role | Core Value |
|------|------|-----------|
| **Superintendent** | Runs the day-to-day on site | Daily logs, field reports, toolbox talks, coordination meetings, punch lists — all from phone |
| **Project Manager** | Owns the schedule and client relationship | Reforecast engine, milestone tracking, document management, sub portal, risk detection |
| **General Contractor (company)** | Multiple projects, multiple sups | One platform for all projects, shared directory, sub management, safety records |
| **Subcontractor** | Trades company doing work on GC jobs | Morning dispatch board, foreman management, production tracking, SOP library, handoff boards |

---

## Market Positioning

| Competitor | Price | IronTrack Advantage |
|------------|-------|---------------------|
| Procore | $500+/month/project | ~25x cheaper; field-first, not office-first |
| Fieldwire | $54+/user/month | Comparable field features, fraction of the cost |
| Microsoft Project | ~$30/user/month (schedule only) | Full field ops + schedule in one app |
| Excel/Paper | Free | Actually works; real tracking; defensible documentation |

**Price point:** $19.99/month GC, $10/month Sub. No per-project fees. No seat limits stated.

---

## Current Feature Set (What Actually Exists in Code)

### Schedule Intelligence
- Upload schedules: `.xlsx`, `.xls`, `.csv`, `.mpp` (via pdf-parse), `.xer` (Primavera), `.xml` (MSPDI)
- Auto column mapping with trade inference (28 keyword rule sets)
- WBS hierarchy normalization
- 3-week, 6-week lookahead views
- Day Plan (today's activities)
- Week view (7-day grouped by day)
- Critical path calculation (CPM engine)
- Reforecast engine — updates forecast finish when progress is entered
- Float calculation (total float, free float)
- MSPDI export (XML back to Microsoft Project)
- Schedule snapshots (point-in-time copies)
- Health score (0–100) per project
- Risk detection (6 rule types: delayed start, compression, milestone at risk, inspection, missing logic, long duration)
- Activity progress updates with audit trail
- Milestones view

### Field Operations
- **Daily Logs** — weather, crew counts by trade, deliveries, equipment, delay codes, toolbox talk, incidents, visitors; photo attachment; voice input; monthly/quarterly/yearly rollups; PDF export
- **Field Reports** — photo-first walkthrough observations; issue tracking (high/medium/low priority); professional PDF export; multi-add flow
- **Inspections** — 107 Arizona jurisdictions seeded with contact info and portal links (Accela, EnerGov, CitizenServe); inspection request scheduling
- **Punch List** — items with location (building/floor/room), trade assignment, priority (life safety/code/standard/cosmetic), status workflow, photo evidence
- **Progress Updates** — activity-level percent complete tracking with before/after audit trail

### Safety & Compliance
- **Toolbox Talks** — date, topic, presenter, duration, location, weather, talking points, corrective actions, follow-up tracking
- **20 Pre-built OSHA Templates** — falls, ladders, scaffolding, electrical, excavation, confined space, crane/rigging, silica, heat illness, cold stress, fire prevention, HazCom/GHS, LOTO, PPE, struck-by, hand tools, housekeeping, machine guarding
- **Attendance Tracking** — digital sign-in with name, trade, company
- **Digital Signatures** — sign attendance sheets
- **Safety PDF Export** — company-branded safety records
- **Custom Templates** — create project-specific toolbox talk templates

### Trade Coordination
- **Meeting Management** — coordination meetings with date, type, location, facilitator, agenda, attendees, notes
- **5 System Meeting Types** — Weekly Coordination, OAC Meeting, Pre-Pour, Pull Planning, Pre-Task Planning
- **Agenda Items** — linked to schedule activities, conflict flagging
- **Action Items** — assigned owner, company, trade, category, due date, status tracking
- **Conflict Detection** — trade overlap detection from schedule data
- **Coordination PDF Export** — meeting minutes

### Documents
- **Submittals** — number, spec section, title, ball-in-court, status workflow (7 states), lead time, revision history
- **RFIs** — number, subject, question, spec section, drawing reference, cost/schedule impact flags, response tracking, photo attachments
- **AI-Assisted RFI Drafting** — describe the issue, Claude generates a professional RFI (`/api/projects/[id]/rfis/ai-draft`)
- **Drawings** — upload drawing sets (PDF), organize by discipline (arch/struct/MEP/civil/etc), version control, sheet browser with viewer
- **Drawing Markup** — add pins linked to RFIs, punch items, submittals, notes, photos
- **T&M Tracker** — time and material tickets with labor/material/equipment line items, dual digital signatures (GC + Sub), dispute tracking, receipt photos

### Sub Management (GC Side)
- Add subcontractors to projects with trade assignments
- Generate tokenized share links (no-login sub view)
- Sub views filtered by trade — no float, predecessors, or critical path exposed
- Schedule receipt verification — timestamps when subs open links
- Acknowledge button — subs confirm receipt with name + timestamp
- ACK status dashboard

### Ready Check
- Tap any schedule activity → send mobilization check via SMS or email
- Sub confirms ready or flags an issue
- Follow-up tracking (count + timestamp)
- Templates: standard, critical path, friendly reminder

### Sub Ops (Subcontractor Operations Platform)
- **Company Setup** — company profile, logo
- **Morning Dispatch Board** — assign crews to jobs with scope, safety focus, material notes, special instructions
- **Foreman Management** — roster with trade, certifications, hire date, status (active/inactive)
- **Crew Manager** — company-wide crew roster
- **Department Management** — multi-department subs (e.g., sheet metal, piping, controls)
- **Check-ins** — foremen log on-site with crew count, hours, site photo
- **Production Tracking** — log work quantities with photos (LF pipe, SF drywall, etc.)
- **Blocker Reports** — field crew flags blockers by category (material/GC delay/weather/manpower/equipment/drawing/inspection/access)
- **SOP Library** — upload PDFs; foremen acknowledge read; track compliance
- **Dispatch SOPs** — attach SOPs to dispatches
- **Handoff Tracker** — department-to-department handoff board (Kanban-style)
- **Handoff Templates** — reusable checklist templates
- **Handoff Areas** — area-based handoff tracking with photos and checklists

### Directory
- Company-wide contacts (architect, engineer, subcontractor, supplier, owner, inspector, internal, other)
- Per-project contact assignments with roles
- QR code join flow — scan QR → submit contact info → appears in directory
- Company contact search

### Platform
- **Dark/Light theme** — toggle via settings
- **Spanish localization** — UI strings in `src/lib/i18n.ts`
- **Push notifications** — web push for at-risk activities (cron at noon daily)
- **Week QR Share** — generate QR code → subs scan → see weekly schedule (no login)
- **Schedule Generator** — AI-powered schedule simulator (protected route, GC only): select building type/trades/SF → generates CPM schedule with procurement chains, 17 trade categories, 87+ activities
- **Executive Snapshot** — shareable one-click project summary
- **Mobile-first design** — bottom nav, mobile menus, camera capture
- **Voice input** — voice-to-text for daily log notes
- **Settings** — storage usage, theme, language, company info
- **Release Notes** — version history page
- **Status page** — system status

---

## Differentiation

1. **Price** — $19.99/month all-in. No per-project fees. No enterprise contracts.
2. **Field-first** — designed for the phone in hand on a job site, not the desktop in the office
3. **Both sides of the relationship** — GC AND Sub tools in one platform (rare)
4. **Schedule intelligence** — reforecast, critical path, risk detection built-in (not add-ons)
5. **Sub Ops** — full subcontractor operations platform (dispatch, production, SOPs, handoffs) — goes far beyond a simple schedule viewer
6. **AI assist** — RFI drafting, schedule generation, daily brief generation
7. **No login required for subs** — share links and QR codes; zero friction for field crews
