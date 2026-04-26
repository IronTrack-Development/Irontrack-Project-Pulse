# USER_WORKFLOWS.md — IronTrack Pulse

All workflows documented here are based on actual code in the repo. Routes, API endpoints, and component files are referenced throughout.

---

## GC Workflows

### 1. Signup & Subscription (New GC)

1. User visits `/signup`
2. Enters email + password → `supabase.auth.signUp()`
3. Email confirmation sent (Supabase Auth)
4. On return, middleware checks `user_subscriptions` → no row found → user is allowed through (beta bypass)
5. If subscription required, redirected to `/subscribe`
6. `/subscribe` → POST `/api/stripe/checkout` → Stripe Checkout session created
7. User completes payment → Stripe webhook fires → `user_subscriptions.status = 'active'`
8. Redirect to `/dashboard?success=true`

**Key files:** `src/app/signup/page.tsx`, `src/app/subscribe/page.tsx`, `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/middleware.ts`

---

### 2. Project Creation

1. GC lands on `/dashboard`
2. Clicks "Add Project" → `AddProjectModal` opens
3. Fills: project name, number, client name, location, start date, target finish date
4. POST `/api/projects` → creates `daily_projects` row with `user_id`
5. Project card appears on dashboard with health score = 100

**Key files:** `src/app/dashboard/page.tsx`, `src/components/AddProjectModal.tsx`, `src/app/api/projects/route.ts`

---

### 3. Schedule Upload

1. GC navigates to `/upload` (or upload button on dashboard)
2. Drag-and-drop or tap to select file (`.xlsx`, `.xls`, `.csv`, `.mpp`, `.xer`, `.xml`)
3. File sent to POST `/api/upload` (max 100MB, 300s timeout on Vercel)
4. Server parses file → column mapping wizard shown
5. GC maps columns (or accepts auto-detected mapping)
6. Trade inference runs on activity names (28 keyword rules in `src/lib/trade-inference.ts`)
7. WBS hierarchy normalized (`src/lib/wbs-normalizer.ts`)
8. Activities inserted into `parsed_activities`
9. Risk detection runs automatically (`src/lib/risk-engine.ts`)
10. Health score calculated (`src/lib/health-score.ts`)
11. Redirect to `/projects/[id]`

**Key files:** `src/app/upload/page.tsx`, `src/app/api/upload/route.ts`, `src/lib/trade-inference.ts`, `src/lib/wbs-normalizer.ts`, `src/lib/risk-engine.ts`

---

### 4. Project View — Daily Intelligence

GC navigates to `/projects/[id]`. Tabs lazy-load on demand:

| Tab | Route/Component | What it shows |
|-----|----------------|---------------|
| **Overview** | `OverviewTab` | Health circle, completion %, milestones, active risks |
| **Today** | `TodayTab` | Today's active work, overdue items, action items |
| **Day Plan** | `DayPlanTab` | Today-plan view with weather and activity list |
| **Week** | `WeekTab` | 7-day grouped activities, week QR share |
| **6-Week** | `SixWeekTab` | 6-week lookahead |
| **Activities** | `ActivitiesTab` | Searchable/sortable full activity table |
| **Priority** | `PriorityTab` | Critical path tasks, behind-schedule, upcoming inspections |
| **Progress** | `ProgressTab` | Progress update UI for all activities |
| **Reforecast** | `ReforecastTab` | CPM reforecast, forecast finish delta, recovery actions |
| **Lookahead** | `LookaheadTab` | 7/14/21-day lookahead |
| **Milestones** | `MilestonesTab` | Timeline with status badges |
| **Risks** | `RisksTab` | Auto-detected risks with resolve/snooze |

**Key files:** `src/app/projects/[id]/page.tsx`, `src/components/tabs/`

---

### 5. Progress Update

1. GC opens **Progress** tab or clicks activity in any tab
2. `ActivityDrawer` slides in with activity details
3. GC enters new percent complete or remaining duration
4. POST `/api/projects/[id]/progress` → updates `parsed_activities`
5. POST `/api/projects/[id]/schedule/recalculate` → CPM engine re-runs
6. Progress logged in `progress_updates` table
7. New `schedule_snapshots` record created
8. Forecast finish date updates across all views

**Key files:** `src/components/tabs/ProgressTab.tsx`, `src/components/ProgressUpdateModal.tsx`, `src/app/api/projects/[id]/progress/route.ts`, `src/app/api/projects/[id]/schedule/recalculate/route.ts`, `src/lib/reforecast-engine.ts`

---

### 6. Daily Log

1. GC navigates to `/projects/[id]/daily-log` or opens `DailyLogTab`
2. `DailyLogWizard` guides through: weather → crew → delays → toolbox talk → incidents → visitors → photos
3. Voice input available for narrative fields (`src/lib/use-voice-input.ts`)
4. Photos captured/uploaded → stored in `daily-log-photos` Supabase bucket
5. POST `/api/projects/[id]/daily-logs` → creates `daily_logs` row
6. Progress snapshots per activity: POST `/api/projects/[id]/daily-logs/[logId]/progress`
7. Photos: POST `/api/projects/[id]/daily-logs/[logId]/upload-photo`
8. Weekly/monthly/quarterly/yearly rollups available via rollup dashboard

**Key files:** `src/components/daily-log/DailyLogWizard.tsx`, `src/app/api/projects/[id]/daily-logs/route.ts`, `src/components/daily-log/RollupDashboard.tsx`

---

### 7. Field Reports

1. GC opens **Field Reports** tab (`FieldReportsTab`)
2. Creates new report → `AddReportModal` or `MultiAddFlow` (add multiple issues at once)
3. Per issue: title, note, location, priority (high/medium/low), category (QA/QC/safety/schedule), photo capture
4. POST `/api/projects/[id]/field-reports` → `issue_reports` + `report_issues`
5. Photos uploaded: POST `/api/projects/[id]/reports/[reportId]/upload-photo`
6. Generate PDF: POST `/api/projects/[id]/field-reports/pdf`
7. Report shared or exported

**Key files:** `src/components/field-reports/FieldReportsDashboard.tsx`, `src/components/field-reports/MultiAddFlow.tsx`, `src/app/api/projects/[id]/field-reports/`

---

### 8. Safety — Toolbox Talk

1. GC opens **Safety** tab (`SafetyTab`)
2. `NewTalkModal` → select date, topic, category, presenter
3. Pick OSHA template or create custom → talking points shown/editable
4. `TalkDetail` → present talk to crew
5. Crew signs in via `AttendanceSheet` (name, trade, company, digital signature)
6. Mark talk complete → POST `/api/projects/[id]/safety/[talkId]/complete`
7. Generate PDF: GET `/api/projects/[id]/safety/[talkId]/pdf`
8. Manage templates via `TemplateManager`

**Key files:** `src/components/safety/`, `src/app/api/projects/[id]/safety/`

---

### 9. Coordination Meeting

1. GC opens **Coordination** tab
2. `NewMeetingModal` → select meeting type, date, location, facilitator
3. Agenda auto-populated from schedule data (`coordination_agenda_items`)
4. Add/edit agenda items, flag conflicts
5. Track attendees (`coordination_attendees`)
6. Add action items with owner, trade, due date
7. Complete meeting → POST `/api/projects/[id]/coordination/[meetingId]/complete`
8. Export PDF meeting minutes: GET `/api/projects/[id]/coordination/[meetingId]/pdf`
9. `ConflictDetector` component shows trade conflicts from schedule

**Key files:** `src/components/coordination/`, `src/app/api/projects/[id]/coordination/`

---

### 10. RFI Creation (with AI Drafting)

1. GC opens **RFIs** tab (`RFIsTab`)
2. `RFICreateFlow` → select activity, describe issue, attach photos
3. Optional: click "AI Draft" → POST `/api/projects/[id]/rfis/ai-draft` → Claude generates professional RFI text
4. Review/edit → submit → creates `rfis` row
5. Track status: draft → submitted → under review → answered → closed
6. Photos attached: POST `/api/projects/[id]/rfis/[rfiId]/photos`
7. Link RFI to drawing via drawing pins

**Key files:** `src/components/rfis/RFICreateFlow.tsx`, `src/app/api/projects/[id]/rfis/ai-draft/route.ts`

---

### 11. Submittals

1. GC opens **Submittals** tab (`SubmittalsTab`)
2. `SubmittalForm` → submittal number, spec section, title, assigned to, required by date, lead time
3. POST `/api/projects/[id]/submittals` → creates `submittals` row
4. Track ball-in-court (contractor/architect/engineer/owner/sub)
5. Update status: not started → in preparation → submitted → under review → approved/rejected
6. Each status change logged in `submittal_revisions`

**Key files:** `src/components/submittals/`, `src/app/api/projects/[id]/submittals/`

---

### 12. Drawings

1. GC opens **Drawings** tab (`DrawingsTab`)
2. Upload drawing set (PDF) → POST `/api/projects/[id]/drawings/upload-url` → Supabase Storage
3. `SheetOrganizer` → classify sheets by discipline and number
4. `SheetViewer` → view individual sheets with pan/zoom
5. Add pins linked to RFIs, punch items, submittals: POST `/api/projects/[id]/drawings/sheets/[sheetId]/pins`
6. `RevisionBanner` shows when a newer revision is available

**Key files:** `src/components/drawings/`, `src/app/api/projects/[id]/drawings/`

---

### 13. T&M Tracker

1. GC opens **T&M** tab (`TMTab`)
2. `TMTicketForm` → ticket number, sub, date, description
3. Add labor line items (trade, workers, hours, rate)
4. Add material line items (item, qty, unit, unit cost, receipt photo)
5. Add equipment line items (type, hours, rate)
6. Total auto-calculated in database (generated columns)
7. Sub signs: POST `/api/projects/[id]/tm-tickets/[ticketId]/sign`
8. GC signs: separate signature capture
9. Print receipt: GET `/api/projects/[id]/tm-tickets/[ticketId]/receipt`

**Key files:** `src/components/tm/`, `src/app/api/projects/[id]/tm-tickets/`

---

### 14. Punch List

1. GC opens **Punch List** tab (`PunchListTab`)
2. `PunchItemForm` → description, location (building/floor/room), trade, priority, due date
3. Assign to sub from directory (`company_contacts`)
4. Capture issue photos
5. Track status: open → in progress → ready for reinspect → closed / disputed
6. `PunchProgressRing` shows completion percentage
7. Summary: GET `/api/projects/[id]/punch-list/summary`

**Key files:** `src/components/punch/`, `src/app/api/projects/[id]/punch-list/`

---

### 15. Inspections

1. GC opens **Inspections** tab (`InspectionsTab`)
2. `JurisdictionSelector` → pick from 107 Arizona jurisdictions (or search by name/county)
3. Once jurisdiction locked to project: `inspection_requests` can be created
4. Select inspection type, permit number, requested date, contact info, time window
5. Portal link shown (Accela/EnerGov/CitizenServe) or phone number for offline jurisdictions
6. Status: scheduled → redirected → called → completed / failed

**Key files:** `src/components/inspections/`, `src/app/api/jurisdictions/route.ts`, `src/app/api/projects/[id]/inspections/route.ts`

---

### 16. Directory

1. GC opens **Directory** tab (`DirectoryTab`)
2. `AddContactModal` → name, company, email, phone, role, trade/discipline
3. POST `/api/projects/[id]/directory` → creates `company_contacts` + `project_contacts`
4. Search existing contacts: GET `/api/company-contacts/search`
5. Generate QR code: GET `/api/projects/[id]/directory/qr` → creates `directory_join_tokens` row
6. Share QR → sub scans → `/join/[projectId]` → sub enters name, company → appears in directory

**Key files:** `src/components/directory/`, `src/app/api/projects/[id]/directory/`, `src/app/join/[projectId]/page.tsx`

---

### 17. Sub Management & Ready Check

1. GC opens **Subs** tab (`SubsTab`)
2. Lists subs on project with their assigned trades
3. Click sub → view their schedule share link
4. Generate tokenized link: POST `/api/projects/[id]/subs/[subId]/share`
5. **Ready Check:** tap activity → `ReadyCheckModal` opens → select check type, generate message
6. Send via SMS/email copy → sub receives message with custom text
7. Track: sent → awaiting response → confirmed / no response / issue flagged

**Key files:** `src/components/ReadyCheckModal.tsx`, `src/app/api/projects/[id]/ready-checks/`

---

### 18. Week QR Share

1. GC opens **Week** tab
2. Clicks `WeekQRModal` → generates QR code for week 1, 2, or 3
3. POST `/api/projects/[id]/week-share` → creates `week_share_links` token
4. Sub scans QR → `/view/week/[token]` → sees this week's activities for their trade
5. No login required

**Key files:** `src/components/WeekQRModal.tsx`, `src/app/view/week/[token]/page.tsx`

---

## Sub Workflows

### 19. Sub Signup

1. Sub visits `/signup/sub`
2. Enters company name, contact name, email, password, phone
3. Creates Supabase auth user + POST `/api/auth/register-sub` → creates `sub_companies` row
4. Redirected to `/sub/dashboard`

**Key files:** `src/app/signup/sub/page.tsx`, `src/app/api/auth/register-sub/route.ts`

---

### 20. Sub Ops — Morning Dispatch

1. Sub logs in → `/sub/dashboard`
2. `SubDispatchTab` → `DispatchBoard` shows today's dispatches
3. Create dispatch → assign foreman, project, scope of work, safety focus, material notes
4. Foreman receives dispatch (⚠️ notification mechanism not fully verified in code)
5. Foreman acknowledges: POST `/api/sub-ops/companies/[companyId]/dispatches/[dispatchId]/acknowledge`
6. SOPs can be attached to dispatch

**Key files:** `src/components/sub-ops/DispatchBoard.tsx`, `src/app/api/sub-ops/companies/[companyId]/dispatches/`

---

### 21. Sub Ops — Foreman Check-In

1. Foreman opens app
2. POST `/api/sub-ops/companies/[companyId]/checkins` → logs crew count, hours, on-site photo
3. Add production log: POST `/api/sub-ops/companies/[companyId]/checkins/[checkinId]/production`
4. Log production quantity with photo: POST `.../production-photo`

**Key files:** `src/components/sub-ops/CheckInView.tsx`, `src/app/api/sub-ops/companies/[companyId]/checkins/`

---

### 22. Sub Ops — Blocker Report

1. Foreman encounters issue on site
2. POST `/api/sub-ops/companies/[companyId]/blockers` → logs category, description, impact, photo
3. GC sees blockers in Sub Ops dashboard
4. Resolved: PATCH `/api/sub-ops/companies/[companyId]/blockers/[blockerId]` → `status = 'resolved'`

**Key files:** `src/components/sub-ops/BlockersList.tsx`, `src/app/api/sub-ops/companies/[companyId]/blockers/`

---

### 23. Sub Ops — Handoff Tracker

1. Multi-department subs (e.g., HVAC: sheet metal → piping → controls)
2. Create handoff areas and templates
3. `HandoffTracker` → Kanban board view showing handoffs by area
4. Add checklist items, attach photos
5. Mark handoff complete → next department can begin

**Key files:** `src/components/sub-ops/HandoffTracker.tsx`, `src/app/api/sub-ops/companies/[companyId]/handoffs/`

---

### 24. Sub Tokenized View (No Login)

1. GC shares link or sub scans QR
2. Sub opens `/view/[token]` — no login required
3. Sub sees: their trades' activities this week, dependencies visible
4. Sub can submit report: POST `/api/view/[token]/report` (manpower, hours, delays, notes, photos)
5. Acknowledge receipt: POST `/api/view/[token]/acknowledge` (name + timestamp)
6. Past reports visible: GET `/api/view/[token]/reports`

**Key files:** `src/app/view/[token]/page.tsx`, `src/app/api/view/[token]/`

---

## Admin / Setup Workflows

### 25. Database Setup Check

- GET `/api/setup` → checks if all required tables exist, returns status

### 26. Settings

- `/settings` — storage usage, theme, language preference
- Reads `user_uploads` and `user_storage` tables for quota display

### 27. Schedule Generator (GC Enterprise Feature)

1. GC navigates to `/schedule-generator` (requires active subscription + auth)
2. Selects building type (17 types), structure type, total SF, stories, trades
3. Override quantities for specific trade items
4. Click Generate → POST `/api/schedule-generator` → generates CPM schedule
5. View: Gantt by phase, trade filter, download XLSX
6. Procurement Phase 0 auto-generated for 12 material chains

**Key files:** `src/app/schedule-generator/page.tsx`, `src/app/api/schedule-generator/route.ts`, `src/lib/schedule-engine.ts`, `src/lib/production-rates.ts`
