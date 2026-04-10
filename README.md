# IronTrack Daily — Field Intelligence Platform

A production-ready construction schedule intelligence app. Built to answer three questions every field day:
- **What is happening today?**
- **What is at risk?**
- **What do I need to do now?**

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL, RLS policies)
- **Tailwind CSS** (custom dark brand system)
- **xlsx** (Excel parsing)
- **papaparse** (CSV parsing)
- **lucide-react** (icons)

---

## Setup

### 1. Database Migration

Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/raxdqjivrathfornpxug) and run the migration:

```
src/migrations/001_irontrack_daily.sql
```

This creates all tables, indexes, and RLS policies.

### 2. Seed Demo Data (optional)

Load two realistic demo projects with 100+ activities:

```bash
npx tsx src/seed/seed-demo.ts
```

### 3. Start the App

Double-click `START.bat` or run:

```bash
npx next dev --port 3030
```

Open: **http://localhost:3030**

---

## Features

### Dashboard
- Multi-project command center
- Health score per project (green/yellow/red)
- Today's active work, overdue activities, risk counts
- Days to completion

### Project Detail
- **Overview**: Health circle, completion %, milestone tracker
- **Today**: What's happening, what's at risk, action items
- **Lookahead**: 7/14/21-day view, grouped by week + trade
- **Activities**: Searchable/sortable table with drawer detail
- **Risks**: Auto-detected risks with resolve/snooze actions
- **Milestones**: Timeline view with status badges

### Upload
- Drag-and-drop schedule import (.xlsx, .xls, .csv)
- Column mapping wizard with auto-detection
- Automatic trade inference from activity names
- Risk detection runs immediately after import

### Intelligence Engine
- **Trade Inference**: 28 keyword rule sets
- **Risk Detection**: 6 rule types (delayed start, compression, milestone at risk, inspection, missing logic, long duration)
- **Health Score**: 0-100 score with green/yellow/red bands
- **Daily Brief**: Plain English daily summary generator

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://raxdqjivrathfornpxug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── projects/          # CRUD + stats
│   │   ├── upload/            # File parse + import
│   │   └── projects/[id]/     # today, lookahead, risks, activities, brief
│   ├── projects/[id]/         # Project detail page
│   ├── upload/                # Upload wizard
│   └── settings/              # Settings page
├── components/
│   ├── tabs/                  # OverviewTab, TodayTab, LookaheadTab, etc.
│   ├── ActivityDrawer.tsx     # Slide-in activity detail
│   ├── AddProjectModal.tsx    # New project form
│   ├── Sidebar.tsx            # Desktop navigation
│   └── MobileNav.tsx          # Mobile bottom nav
├── lib/
│   ├── supabase.ts            # Client + service client
│   ├── risk-engine.ts         # 6-rule risk detection
│   ├── brief-engine.ts        # Plain English daily brief
│   ├── health-score.ts        # Score calculation
│   └── trade-inference.ts     # 28-category trade inference
├── migrations/
│   └── 001_irontrack_daily.sql
├── seed/
│   └── seed-demo.ts           # 100+ realistic demo activities
└── types/
    └── index.ts               # All TypeScript types
```

---

## Brand System

| Token | Value |
|-------|-------|
| Background | `#0B0B0D` |
| Panel | `#121217` |
| Border | `#1F1F25` |
| Orange (primary) | `#F97316` |
| Blue (data/AI) | `#3B82F6` |
| Green (on track) | `#22C55E` |
| Yellow (watch) | `#EAB308` |
| Red (at risk) | `#EF4444` |

---

Built for field superintendents who need answers, not schedules.
