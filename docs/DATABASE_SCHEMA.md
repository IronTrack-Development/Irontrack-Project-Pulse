# DATABASE_SCHEMA.md — IronTrack Pulse

All tables documented from migration files in `src/migrations/`. Migrations are run **manually** in the Supabase SQL Editor — they are NOT auto-applied on deploy.

---

## Migration Run Order

| # | File | Purpose |
|---|------|---------|
| 001 | `001_irontrack_daily.sql` | Core tables: projects, uploads, activities, risks, briefs |
| 002 | `002_add_auth.sql` | Add `user_id` to projects, user-scoped RLS policies |
| 003 | `003_add_subscription.sql` | GC subscription tracking |
| 004 | `004_upload_limits.sql` | Upload quotas + storage tracking |
| 005 | `005_add_wbs_hierarchy.sql` | WBS hierarchy + normalized fields on activities |
| 006 | `006_ready_checks.sql` | Ready check contacts + mobilization requests |
| 007 | `007_issue_reports.sql` | Field reports + issues |
| 008 | `008_push_subscriptions.sql` | Web push + notification dedup |
| 009 | `009_schedule_reforecast.sql` | Reforecast fields, progress updates, schedule snapshots |
| 010 | `010_week_share_links.sql` | QR-shareable week views |
| 011 | `011_daily_logs.sql` | Daily construction logs + photos |
| 012 | `012_inspections.sql` | Jurisdictions + inspection requests |
| 013 | `013_safety_toolbox_talks.sql` / `013a` / `013b` / `013c` | Safety talks, templates, attendees + seed data |
| 013b/c/d | `013b/c/d_jurisdiction_inspection_codes.sql` | Jurisdiction-specific inspection type codes |
| 014 | `014_coordination.sql` | Coordination meetings, agendas, action items |
| 014 | `014_directory.sql` | Company contacts, project contacts, QR join tokens |
| 015 | `015_submittals.sql` | Submittals + revision log |
| 016 | `016_rfis.sql` | RFIs, responses, photos |
| 017 | `017_tm_tracker.sql` | T&M tickets, labor/material/equipment line items |
| 018 | `018_punch_list.sql` | Punch list items + photos |
| 019 | `019_drawings.sql` | Drawing sets, sheets, markup pins |
| 021 | `021_sub_ops.sql` | Sub companies, foremen, dispatches, check-ins, production, blockers, SOPs |

> ⚠️ There is no `020` migration. Number 021 follows 019.

---

## Core Tables

### `daily_projects` (Migration 001 + 002)
The central table. Every project-scoped record references this.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| user_id | UUID FK → auth.users | Added in 002. Owner of the project. |
| name | TEXT NOT NULL | |
| project_number | TEXT | |
| client_name | TEXT | |
| location | TEXT | |
| start_date | DATE | |
| target_finish_date | DATE | |
| status | TEXT | Default `'active'` |
| health_score | INTEGER | Default `100`. Calculated by risk engine. |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

**RLS:** User-scoped (`user_id = auth.uid()`) + service role bypass (Migration 002). Original V1 open policies dropped.

---

### `schedule_uploads` (Migration 001)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE on delete |
| original_filename | TEXT NOT NULL | |
| file_type | TEXT | |
| parse_status | TEXT | Default `'pending'` |
| activity_count | INTEGER | Default `0` |
| created_at | TIMESTAMPTZ | |

**RLS:** User-scoped via project ownership (Migration 002)

---

### `parsed_activities` (Migration 001 + 005 + 009)
The largest table. Extended by migrations 005 (WBS hierarchy) and 009 (reforecast fields).

| Column | Type | Source | Notes |
|--------|------|--------|-------|
| id | UUID PK | 001 | |
| project_id | UUID FK → daily_projects | 001 | CASCADE |
| upload_id | UUID FK → schedule_uploads | 001 | CASCADE |
| activity_id | TEXT | 001 | External ID from source schedule |
| activity_name | TEXT NOT NULL | 001 | |
| wbs | TEXT | 001 | |
| area | TEXT | 001 | |
| phase | TEXT | 001 | |
| trade | TEXT | 001 | From trade inference engine |
| original_duration | INTEGER | 001 | |
| remaining_duration | INTEGER | 001 | |
| start_date | DATE | 001 | |
| finish_date | DATE | 001 | |
| actual_start | DATE | 001 | |
| actual_finish | DATE | 001 | |
| percent_complete | NUMERIC | 001 | Default `0` |
| predecessor_ids | TEXT[] | 001 | Legacy string array |
| successor_ids | TEXT[] | 001 | Legacy string array |
| milestone | BOOLEAN | 001 | Default `false` |
| activity_type | TEXT | 001 | |
| status | TEXT | 001 | Default `'not_started'` |
| float_days | INTEGER | 001 | |
| constraint_type | TEXT | 005 | |
| constraint_date | DATE | 005 | |
| resource_names | TEXT | 005 | |
| notes | TEXT | 005 | |
| external_task_id | TEXT | 005 | |
| external_unique_id | TEXT | 005 | |
| outline_level | INTEGER | 005 | |
| parent_activity_name | TEXT | 005 | |
| normalized_building | TEXT | 005 | Extracted from WBS |
| normalized_phase | TEXT | 005 | |
| normalized_area | TEXT | 005 | |
| normalized_work_type | TEXT | 005 | |
| normalized_trade | TEXT | 005 | |
| baseline_start | DATE | 009 | Original dates — never change after import |
| baseline_finish | DATE | 009 | |
| baseline_duration | INTEGER | 009 | |
| forecast_start | DATE | 009 | Recalculated by CPM engine |
| forecast_finish | DATE | 009 | |
| early_start | DATE | 009 | CPM forward pass |
| early_finish | DATE | 009 | |
| late_start | DATE | 009 | CPM backward pass |
| late_finish | DATE | 009 | |
| is_critical | BOOLEAN | 009 | Default `false` |
| total_float | INTEGER | 009 | |
| free_float | INTEGER | 009 | |
| dependency_links | JSONB | 009 | `[{"predecessor_id":"uuid","type":"FS","lag_days":0}]` |
| manual_override | BOOLEAN | 009 | Default `false` |
| last_reforecast_at | TIMESTAMPTZ | 009 | |
| created_at | TIMESTAMPTZ | 001 | |

**RLS:** User-scoped via project ownership (Migration 002)  
**⚠️ This is the most heavily-extended table — be careful with ALTER TABLE operations.**

---

### `daily_risks` (Migration 001)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| activity_id | UUID FK → parsed_activities | |
| risk_type | TEXT NOT NULL | |
| severity | TEXT NOT NULL | |
| title | TEXT NOT NULL | |
| description | TEXT | |
| suggested_action | TEXT | |
| status | TEXT | Default `'open'` |
| detected_at | TIMESTAMPTZ | |

**RLS:** User-scoped (Migration 002)

---

### `daily_briefs` (Migration 001)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| brief_date | DATE NOT NULL | |
| summary | JSONB | AI-generated brief content |
| generated_at | TIMESTAMPTZ | |

**RLS:** User-scoped (Migration 002)

---

## Auth & Billing Tables

### `user_subscriptions` (Migration 003)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → auth.users | UNIQUE |
| stripe_customer_id | TEXT | |
| stripe_subscription_id | TEXT | |
| status | TEXT | Default `'trialing'`. Values: `'trialing'`, `'active'`, `'canceled'` |
| trial_ends_at | TIMESTAMPTZ | |
| current_period_end | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

**RLS:** User-scoped + service role. **🔴 Critical table — controls GC access.**

### `user_uploads` (Migration 004)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → auth.users | CASCADE |
| upload_date | DATE | Default `CURRENT_DATE` |
| upload_count | INTEGER | |
| total_size_bytes | BIGINT | |
| created_at | TIMESTAMPTZ | |

**UNIQUE:** `(user_id, upload_date)` — one row per user per day.  
**RLS:** User can only SELECT own.

### `user_storage` (Migration 004)

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK FK → auth.users | CASCADE |
| total_bytes | BIGINT | |
| file_count | INTEGER | |
| last_updated | TIMESTAMPTZ | |

**RLS:** User can only SELECT own.  
**Functions:** `increment_daily_uploads()`, `increment_user_storage()`, `decrement_user_storage()` — all `SECURITY DEFINER`.

---

## Schedule & Progress Tables

### `progress_updates` (Migration 009)
Audit trail for activity progress changes.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| activity_id | UUID FK → parsed_activities | CASCADE |
| previous/new_percent_complete | NUMERIC | |
| previous/new_remaining_duration | INTEGER | |
| previous/new_status | TEXT | |
| actual_start_set / actual_finish_set | DATE | |
| manual_override | BOOLEAN | |
| updated_by | TEXT | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

**RLS:** `allow_all` (V1 open)

### `schedule_snapshots` (Migration 009)
Point-in-time schedule copies with full task data in JSONB.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| snapshot_name | TEXT | |
| snapshot_type | TEXT | `'baseline'`, `'reforecast'`, `'manual'` |
| trigger_description | TEXT | |
| baseline/forecast_finish_date | DATE | |
| completion_delta_days | INTEGER | Positive = late |
| critical_path_changed | BOOLEAN | |
| total/complete/critical/at_risk_activities | INTEGER | |
| task_data | JSONB | Full task array at snapshot time |
| recovery_actions | JSONB | |
| risk_flags | JSONB | |
| schedule_impacts | JSONB | |
| mspdi_export_path | TEXT | Storage path |
| created_at | TIMESTAMPTZ | |

**RLS:** `allow_all` (V1 open). **⚠️ `task_data` JSONB can be very large — careful with queries.**

### `week_share_links` (Migration 010)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| token | TEXT UNIQUE NOT NULL | Share token |
| week_number | INTEGER | 1, 2, or 3 |
| active | BOOLEAN | |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

**RLS:** `allow_all` (V1 open)

---

## Ready Check Tables (Migration 006)

### `ready_check_contacts`
Reusable contacts per project per trade.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| user_id | UUID | |
| trade | TEXT NOT NULL | |
| contact_name | TEXT NOT NULL | |
| phone / email / company | TEXT | |

### `ready_checks`
Mobilization check requests.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| activity_id | UUID FK → parsed_activities | SET NULL on delete |
| user_id | UUID | |
| contact_id | UUID FK → ready_check_contacts | |
| contact_name/company/phone/email | TEXT | Snapshot at send time |
| activity_name | TEXT NOT NULL | |
| trade / start_date / normalized_building | TEXT/DATE/TEXT | |
| check_type | TEXT | `'standard'`, `'critical_path'`, `'friendly_reminder'` |
| message_text | TEXT NOT NULL | |
| send_method | TEXT | `'sms'`, `'email'`, `'copy'` |
| status | TEXT | `'draft'`→`'sent'`→`'confirmed'`/`'no_response'`/`'issue_flagged'` |
| sent_at / responded_at | TIMESTAMPTZ | |
| follow_up_count | INTEGER | |

**RLS:** Both tables `allow_all` (V1 open)

---

## Field Reports (Migration 007)

### `issue_reports`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| activity_id | UUID FK → parsed_activities | SET NULL |
| user_id | UUID | |
| report_number | TEXT | Auto: `IR-001`, `IR-002` |
| activity_name | TEXT NOT NULL | |
| trade / normalized_building | TEXT | |
| prepared_by | TEXT | |
| report_date | DATE | |
| issue_count | INTEGER | |
| overall_assessment | TEXT | |
| status | TEXT | `'draft'`, `'generated'`, `'shared'` |
| pdf_path | TEXT | Storage path |

### `report_issues`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| report_id | UUID FK → issue_reports | CASCADE |
| issue_number | INTEGER NOT NULL | |
| title | TEXT NOT NULL | |
| note / location | TEXT | |
| priority | TEXT | `'high'`, `'medium'`, `'low'` |
| category | TEXT | `'qa_qc'`, `'safety'`, `'schedule'` |
| status | TEXT | `'open'`, `'in_progress'`, `'resolved'` |
| photo_paths | TEXT[] | Array of storage paths |
| photo_captions | TEXT[] | |
| trade | TEXT | |
| potential_impact / action_needed | TEXT | |

**RLS:** Both `allow_all`

---

## Notifications (Migration 008)

### `push_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → auth.users | CASCADE |
| endpoint | TEXT NOT NULL | Web Push endpoint |
| p256dh | TEXT NOT NULL | |
| auth | TEXT NOT NULL | |

**RLS:** User-scoped + service role  
**UNIQUE:** `(user_id, endpoint)`

### `notification_log`
Deduplication log for sent notifications.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id / activity_id | UUID | |
| notification_type | TEXT | |
| sent_date | DATE | |

**RLS:** Service role only. **UNIQUE:** `(user_id, activity_id, notification_type, sent_date)`

---

## Daily Logs (Migration 011)

### `daily_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → daily_projects | CASCADE |
| log_date | DATE NOT NULL | |
| superintendent | TEXT | |
| weather | JSONB | |
| crew | JSONB | Array of crew entries |
| deliveries | TEXT | |
| equipment | TEXT[] | |
| delay_codes | TEXT[] | |
| delay_narrative | TEXT | |
| lost_crew_hours | NUMERIC | |
| toolbox_talk | TEXT | |
| incidents / visitors | TEXT | |
| status | TEXT | `'draft'`, `'submitted'`, `'locked'` |
| submitted_at / locked_at | TIMESTAMPTZ | |

**UNIQUE:** `(project_id, log_date)` — one log per project per day.  
**RLS:** `allow_all` (V1 open)

### `daily_log_progress`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| daily_log_id | UUID FK → daily_logs | CASCADE |
| activity_id | UUID FK → parsed_activities | SET NULL |
| pct_complete_before / pct_complete_after | NUMERIC | |
| note | TEXT | |

### `daily_log_photos`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| daily_log_id | UUID FK → daily_logs | CASCADE |
| activity_id | UUID FK → parsed_activities | SET NULL |
| storage_path | TEXT NOT NULL | |
| taken_at | TIMESTAMPTZ | |
| caption | TEXT | |
| gps_lat / gps_lon | NUMERIC | |

**Storage bucket:** `daily-log-photos` (public)

---

## Inspections (Migration 012)

### `jurisdictions`
107 Arizona jurisdictions pre-seeded.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| type | TEXT | `'city'`, `'town'`, `'county'` |
| county | TEXT NOT NULL | |
| phone | TEXT | |
| portal_url | TEXT | |
| portal_provider | TEXT | `'accela'`, `'energov'`, `'citizenserve'`, `'url'`, `'offline'` |
| portal_verified | BOOLEAN | |
| lat / lon | NUMERIC NOT NULL | |

### `project_jurisdiction`
One jurisdiction per project.

| Column | Type | Notes |
|--------|------|-------|
| project_id | UUID FK → daily_projects | UNIQUE |
| jurisdiction_id | UUID FK → jurisdictions | |

### `inspection_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id / jurisdiction_id | UUID FKs | |
| inspection_type | TEXT NOT NULL | |
| permit_number | TEXT | |
| requested_date | DATE | |
| contact_name / contact_phone | TEXT | |
| time_window | TEXT | `'Anytime'`, `'AM'`, `'PM'` |
| status | TEXT | `'scheduled'`, `'redirected'`, `'called'`, `'completed'`, `'failed'` |

**RLS:** All three tables `allow_all`

---

## Safety (Migration 013)

### `toolbox_talks`

| Key columns | Type | Notes |
|-------------|------|-------|
| project_id | UUID FK | |
| talk_date | DATE NOT NULL | |
| topic | TEXT NOT NULL | |
| category | TEXT | 21 OSHA categories |
| presenter / location / weather_conditions | TEXT | |
| talking_points | TEXT[] | |
| status | TEXT | `'draft'`, `'completed'`, `'locked'` |
| linked_activity_id | UUID FK → parsed_activities | SET NULL |

### `toolbox_talk_attendees`

| Column | Type | Notes |
|--------|------|-------|
| talk_id | UUID FK → toolbox_talks | CASCADE |
| name | TEXT NOT NULL | |
| trade / company | TEXT | |
| signed | BOOLEAN | |
| signed_at | TIMESTAMPTZ | |

### `toolbox_talk_templates`
20 OSHA templates pre-seeded. Custom per-project templates supported.

| Column | Type | Notes |
|--------|------|-------|
| category | TEXT | |
| title | TEXT | |
| talking_points | TEXT[] | |
| hazards / ppe_required | TEXT[] | |
| osha_reference | TEXT | |
| is_system | BOOLEAN | `true` for pre-seeded |
| project_id | UUID FK | For custom templates |

**RLS:** All `allow_all`

---

## Coordination (Migration 014)

### `coordination_meetings`

| Key columns | Notes |
|-------------|-------|
| project_id | FK |
| meeting_date, meeting_type, title, location, facilitator | |
| status | `'scheduled'`, `'in_progress'`, `'completed'`, `'cancelled'` |
| recurrence | `'none'`, `'daily'`, `'weekly'`, `'biweekly'`, `'monthly'` |

### `coordination_agenda_items`

| Key columns | Notes |
|-------------|-------|
| meeting_id | FK CASCADE |
| activity_id | FK → parsed_activities, SET NULL |
| title, trade, area, has_conflict, conflict_description | |
| status | `'pending'`, `'discussed'`, `'deferred'`, `'resolved'` |

### `coordination_action_items`

| Key columns | Notes |
|-------------|-------|
| meeting_id, project_id | FKs |
| title, assigned_to, assigned_company, assigned_trade | |
| category | 11 values incl. `'rfi'`, `'material_delivery'`, `'safety'` |
| priority | `'high'`, `'medium'`, `'low'` |
| status | `'open'`, `'in_progress'`, `'resolved'`, `'cancelled'` |

### `coordination_meeting_types`
5 system types seeded: Weekly Coordination, OAC, Pre-Pour, Pull Planning, Pre-Task.

### `coordination_attendees`

| Key columns | Notes |
|-------------|-------|
| meeting_id | FK CASCADE |
| name, company, trade | |
| present | BOOLEAN |

**RLS:** All `allow_all`

---

## Directory (Migration 014)

### `company_contacts`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| company / email / phone | TEXT | |
| role | TEXT | `'architect'`, `'engineer'`, `'subcontractor'`, `'supplier'`, `'owner'`, `'owners_rep'`, `'inspector'`, `'internal'`, `'other'` |
| trade / discipline | TEXT | |
| created_via | TEXT | `'manual'`, `'qr_join'`, `'import'` |

### `project_contacts`

| Column | Type | Notes |
|--------|------|-------|
| project_id + contact_id | FK pair | UNIQUE constraint |
| role_on_project | TEXT | |
| invite_token | TEXT UNIQUE | |

### `directory_join_tokens`

| Column | Type | Notes |
|--------|------|-------|
| project_id | UUID FK | |
| token | TEXT UNIQUE | Auto-generated hex |
| expires_at | TIMESTAMPTZ | |
| is_active | BOOLEAN | |

**RLS:** All `allow_all`

---

## Documents

### `submittals` + `submittal_revisions` (Migration 015)
- Status workflow: `not_started` → `in_preparation` → `submitted` → `under_review` → `approved` / `approved_as_noted` / `revise_resubmit` / `rejected`
- `ball_in_court`: `'contractor'`, `'architect'`, `'engineer'`, `'owner'`, `'sub'`
- `assigned_to` / `reviewer_id` FK → `company_contacts`
- RLS: `allow_all`

### `rfis` + `rfi_responses` + `rfi_photos` (Migration 016)
- Status: `draft` → `submitted` → `under_review` → `answered` → `closed`
- `ai_drafted` BOOLEAN tracks AI-generated RFIs
- `cost_impact` / `schedule_impact` boolean flags
- Photos stored in `rfi-photos` bucket
- RLS: `allow_all`

### `drawing_sets` + `drawing_sheets` + `drawing_pins` (Migration 019)
- Sheets have `discipline` (10 values)
- Pins link to RFIs, punch items, submittals, notes, photos via `pin_type` + `reference_id`
- Stored in `drawings` bucket
- RLS: `allow_all`

### `tm_tickets` + `tm_labor_items` + `tm_material_items` + `tm_equipment_items` (Migration 017)
- `total_cost` is a **generated column** (stored): `total_labor_cost + total_material_cost + total_equipment_cost`
- Line item `total` columns are also generated (stored)
- Dual signature: `gc_signature_path` / `sub_signature_path`
- Status: `draft` → `submitted` → `approved` / `disputed` → `invoiced`
- Storage: `tm-attachments` bucket
- RLS: `allow_all`

### `punch_items` + `punch_item_photos` (Migration 018)
- Priority: `life_safety`, `code`, `standard`, `cosmetic`
- Status: `open` → `in_progress` → `ready_for_reinspect` → `closed` / `disputed`
- `assigned_to` FK → `company_contacts`
- Photo types: `issue`, `completed`
- Storage: `punch-photos` bucket
- RLS: `allow_all`

---

## Sub Ops (Migration 021)

### `sub_companies`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | ⚠️ Note: code may reference `company_name` — verify |
| trade | TEXT | |
| contact_name / contact_email / contact_phone | TEXT | |
| logo_path | TEXT | |

⚠️ **Missing from migration:** `user_id`, `stripe_customer_id`, `subscription_status`, `subscription_ends_at` — these columns are referenced in API code (`register-sub`, `sub-checkout`, `sub-webhook`). They may have been added via a later migration or directly in Supabase. **Verify actual DB state.**

### `sub_foremen`
Foreman roster per company. Includes `certifications TEXT[]`, `status` (active/inactive).

### `sub_dispatches`
Morning crew dispatches. Status: `pending` → `acknowledged` → `in_progress` → `completed` / `cancelled`.

### `sub_checkins`
Foreman daily check-ins with crew count, hours, site photo.

### `sub_production_logs`
Production quantity tracking per check-in. Includes quantity, unit, estimated quantity, photo.

### `sub_blockers`
Field blocker reports. Categories: `material`, `gc_delay`, `weather`, `manpower`, `equipment`, `drawing`, `inspection`, `access`, `other`.

### `sub_sops`
SOP document library. Categories: `safety`, `quality`, `install_procedure`, `company_policy`, `equipment`, `training`, `general`.

### `sub_sop_acknowledgments`
Foreman read-tracking. UNIQUE on `(sop_id, foreman_id)`.

### `sub_dispatch_sops`
Link SOPs to dispatches. UNIQUE on `(dispatch_id, sop_id)`.

**RLS:** All Sub Ops tables use `allow_all` (V1 open).  
**Storage buckets:** `sub-checkin-photos`, `sub-production-photos`, `sub-sop-files`, `sub-blocker-photos` — all public.

---

## RLS Summary

| RLS Level | Tables |
|-----------|--------|
| **User-scoped** | `daily_projects`, `schedule_uploads`, `parsed_activities`, `daily_risks`, `daily_briefs`, `user_subscriptions`, `push_subscriptions` |
| **User SELECT-only** | `user_uploads`, `user_storage` |
| **Service role only** | `notification_log` |
| **V1 open (`allow_all`)** | All other tables (~30 tables) |

🔴 **Security note:** The majority of tables use open-access policies. Any authenticated user can read/write any row in these tables. This is documented as "V1" — intended for beta phase. Do not harden without a full audit and owner approval.

---

## Database Functions

| Function | Migration | Purpose |
|----------|-----------|---------|
| `update_updated_at()` | 001 | Trigger: auto-set `updated_at` on UPDATE |
| `increment_daily_uploads(user_id, file_size)` | 004 | Atomic daily upload counter (SECURITY DEFINER) |
| `increment_user_storage(user_id, file_size)` | 004 | Atomic storage counter (SECURITY DEFINER) |
| `decrement_user_storage(user_id, file_size)` | 004 | Storage decrement for deletions (SECURITY DEFINER) — ⚠️ not called anywhere in code |

---

## Risky Tables & Migration Warnings

| Table | Risk | Notes |
|-------|------|-------|
| `user_subscriptions` | 🔴 Controls GC paywall | Never delete rows; never modify `status` directly |
| `sub_companies` | 🔴 Controls Sub billing | Columns may not match migration — verify DB |
| `parsed_activities` | 🟡 Heavily extended (3 migrations) | 40+ columns — be careful with ALTER TABLE |
| `schedule_snapshots` | 🟡 Large JSONB `task_data` | Can store full schedule copies — watch storage |
| `jurisdictions` | 🟡 Seeded data | 107 rows pre-inserted — don't DROP |
| `toolbox_talk_templates` | 🟡 Seeded data | 20 OSHA templates — don't DROP |
| `coordination_meeting_types` | 🟡 Seeded data | 5 system types — don't DROP |
