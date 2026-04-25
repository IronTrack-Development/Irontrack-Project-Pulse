# Safety Tab V1 — Build Spec

## Overview
New top-level "Safety" tab in IronTrack Pulse for toolbox talk documentation, attendance tracking, and compliance record-keeping. Built as a first-class tab alongside Schedule, Field Ops, Inspections, and Money.

## Architecture
Follow exact patterns established by Daily Logs (migration 011) and Issue Reports (migration 007).

### Database — Migration 013_safety_toolbox_talks.sql

#### Table: `toolbox_talks`
```sql
CREATE TABLE IF NOT EXISTS toolbox_talks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  talk_date DATE NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'falls', 'electrical', 'excavation', 'confined_space',
    'scaffolding', 'ppe', 'heat_illness', 'cold_stress',
    'fire_prevention', 'hazcom', 'lockout_tagout', 'crane_rigging',
    'housekeeping', 'hand_power_tools', 'ladders', 'silica',
    'struck_by', 'caught_between', 'traffic_control', 'general', 'custom'
  )),
  presenter TEXT,
  duration_minutes INTEGER DEFAULT 15,
  location TEXT,
  weather_conditions TEXT,
  notes TEXT,
  talking_points TEXT[] DEFAULT '{}',
  corrective_actions TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'locked')),
  linked_activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ
);
```

#### Table: `toolbox_talk_attendees`
```sql
CREATE TABLE IF NOT EXISTS toolbox_talk_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id UUID NOT NULL REFERENCES toolbox_talks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT,
  company TEXT,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table: `toolbox_talk_templates`
```sql
CREATE TABLE IF NOT EXISTS toolbox_talk_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  talking_points TEXT[] NOT NULL,
  hazards TEXT[] DEFAULT '{}',
  ppe_required TEXT[] DEFAULT '{}',
  duration_minutes INTEGER DEFAULT 15,
  osha_reference TEXT,
  is_system BOOLEAN DEFAULT true,
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes
```sql
CREATE INDEX idx_toolbox_talks_project_date ON toolbox_talks(project_id, talk_date DESC);
CREATE INDEX idx_toolbox_talk_attendees_talk ON toolbox_talk_attendees(talk_id);
CREATE INDEX idx_toolbox_talk_templates_category ON toolbox_talk_templates(category);
```

#### RLS (V1 — open access, matches existing pattern)
```sql
ALTER TABLE toolbox_talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolbox_talk_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolbox_talk_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_toolbox_talks" ON toolbox_talks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_toolbox_talk_attendees" ON toolbox_talk_attendees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_toolbox_talk_templates" ON toolbox_talk_templates FOR ALL USING (true) WITH CHECK (true);
```

#### Updated_at trigger
```sql
CREATE TRIGGER toolbox_talks_updated_at
  BEFORE UPDATE ON toolbox_talks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### Seed Data — Pre-built Talk Templates
Insert 20 system templates covering OSHA Focus Four + common hazards:
1. Falls — Working at Heights
2. Falls — Ladder Safety  
3. Falls — Scaffolding
4. Electrical — Arc Flash & Shock Prevention
5. Electrical — GFCI & Temporary Power
6. Struck-By — Overhead Hazards
7. Struck-By — Heavy Equipment Blind Spots
8. Caught In/Between — Trenching & Excavation
9. Caught In/Between — Machine Guarding
10. Confined Space Entry
11. PPE — Selection & Inspection
12. Heat Illness Prevention
13. Cold Stress Awareness
14. Fire Prevention & Hot Work
15. Hazard Communication (HazCom/GHS)
16. Lockout/Tagout (LOTO)
17. Crane & Rigging Safety
18. Silica Dust Exposure
19. Hand & Power Tool Safety
20. Housekeeping & Slip/Trip/Fall Prevention

Each template includes: title, category, 5-8 talking points, relevant hazards, required PPE, OSHA standard reference, and suggested duration.

### API Routes

#### `src/app/api/projects/[id]/safety/route.ts`
- **GET** — List toolbox talks for project (paginated, newest first)
- **POST** — Create new toolbox talk (accepts template_id to pre-fill from template)

#### `src/app/api/projects/[id]/safety/[talkId]/route.ts`
- **GET** — Get single talk with attendees
- **PATCH** — Update talk (title, notes, status, etc.)
- **DELETE** — Delete draft talk

#### `src/app/api/projects/[id]/safety/[talkId]/attendees/route.ts`
- **GET** — List attendees for a talk
- **POST** — Add attendee(s) — accepts single or batch
- **DELETE** — Remove attendee (by attendee id in query param)

#### `src/app/api/projects/[id]/safety/[talkId]/sign/route.ts`
- **POST** — Mark attendee as signed (sets signed=true, signed_at=now)

#### `src/app/api/projects/[id]/safety/[talkId]/complete/route.ts`
- **POST** — Mark talk as completed (sets status='completed', completed_at=now)
  - Validates: at least 1 attendee signed

#### `src/app/api/projects/[id]/safety/[talkId]/pdf/route.ts`
- **GET** — Generate PDF of completed toolbox talk
  - IronTrack branded header (Iron Orange #E85D1C / dark theme matching Issue Report PDF style)
  - Talk details: date, topic, category, presenter, duration, location
  - Talking points listed
  - Attendance table: name, trade, company, signed status, time
  - Notes & corrective actions
  - Footer: "Generated by IronTrack Pulse"

#### `src/app/api/projects/[id]/safety/templates/route.ts`
- **GET** — List available templates (system + project-custom)
- **POST** — Create custom template for this project

### UI Components

#### `src/components/tabs/SafetyTab.tsx`
Thin wrapper, same pattern as DailyLogTab.tsx:
```tsx
export default function SafetyTab({ projectId }: { projectId: string }) {
  return <SafetyDashboard projectId={projectId} />;
}
```

#### `src/components/safety/SafetyDashboard.tsx`
Main view with two sections:
1. **Quick Stats Bar** — Total talks this month, Avg attendance, Next follow-up due
2. **Talk List** — Cards showing recent talks (same card pattern as DailyLogList)
   - Each card shows: date, topic, category badge, attendee count, status badge
   - Click opens talk detail/edit view
3. **"New Talk" button** (orange, top-right) → opens `NewTalkModal`
4. **Refresh button** (same pattern as other tabs)

#### `src/components/safety/NewTalkModal.tsx`
Two paths:
- **From Template** — Select category → pick template → pre-fills topic, talking points, hazards, PPE, duration
- **Custom** — Blank form with category picker

Fields:
- Topic (text, required)
- Category (dropdown, required)
- Date (date picker, defaults to today)
- Presenter (text, defaults to superintendent from Daily Log if available)
- Duration (number, minutes, default 15)
- Location (text, optional)
- Talking Points (editable list — pre-filled from template or blank)
- Notes (textarea, optional)

#### `src/components/safety/TalkDetail.tsx`
Full view of a single talk, opened from list card or after creation:
- Talk header: topic, category badge, date, presenter, duration
- Talking points (numbered list, clean display)
- **Attendance Section:**
  - "Add Attendee" button — opens inline form (name, trade, company)
  - Quick-add from existing project contacts (pull from ready_check_contacts or subs table)
  - Attendee list with "Sign" button per person (checkbox-style)
- **Notes & Corrective Actions** — editable textarea
- **Follow-up Toggle** — checkbox + notes field
- **Actions:**
  - "Complete Talk" — validates ≥1 signed attendee, marks complete
  - "Export PDF" — generates branded PDF
  - "Delete" — only for drafts

#### `src/components/safety/AttendanceSheet.tsx`
Reusable attendance component:
- Add individual or batch attendees
- Sign/unsign toggle
- Shows trade + company
- Count display: "4 of 6 signed"

### Types — Add to `src/types/index.ts`

```typescript
export type ToolboxTalkCategory = 
  | 'falls' | 'electrical' | 'excavation' | 'confined_space'
  | 'scaffolding' | 'ppe' | 'heat_illness' | 'cold_stress'
  | 'fire_prevention' | 'hazcom' | 'lockout_tagout' | 'crane_rigging'
  | 'housekeeping' | 'hand_power_tools' | 'ladders' | 'silica'
  | 'struck_by' | 'caught_between' | 'traffic_control' | 'general' | 'custom';

export type ToolboxTalkStatus = 'draft' | 'completed' | 'locked';

export interface ToolboxTalk {
  id: string;
  project_id: string;
  talk_date: string;
  topic: string;
  category: ToolboxTalkCategory;
  presenter?: string;
  duration_minutes: number;
  location?: string;
  weather_conditions?: string;
  notes?: string;
  talking_points: string[];
  corrective_actions?: string;
  follow_up_needed: boolean;
  follow_up_notes?: string;
  status: ToolboxTalkStatus;
  linked_activity_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  locked_at?: string;
  attendee_count?: number;
  signed_count?: number;
}

export interface ToolboxTalkAttendee {
  id: string;
  talk_id: string;
  name: string;
  trade?: string;
  company?: string;
  signed: boolean;
  signed_at?: string;
  created_at: string;
}

export interface ToolboxTalkTemplate {
  id: string;
  category: ToolboxTalkCategory;
  title: string;
  talking_points: string[];
  hazards: string[];
  ppe_required: string[];
  duration_minutes: number;
  osha_reference?: string;
  is_system: boolean;
  project_id?: string;
  created_at: string;
}
```

### Integration into Project Page

In `src/app/projects/[id]/page.tsx`:
1. Add import: `import SafetyTab from "@/components/tabs/SafetyTab";`
2. Add `{ Shield }` to lucide-react imports
3. Add to TABS array: `{ id: "safety", label: "Safety", icon: Shield }`
4. Position AFTER "subs" (last tab) — so tab order is:
   Priority | Daily Log | Today | Tomorrow | Week 1 | Week 2 | Week 3 | 6-Week | Milestones | Progress | Reforecast | Reports | Subs | **Safety**
5. Add tab renderer: `{activeTab === "safety" && <SafetyTab projectId={id} />}`

### Styling Rules
- Dark theme: bg-[#0B0B0D], cards bg-[#121217], borders border-[#1F1F25]
- Orange accent: #F97316 (buttons, active states, icons)
- Status badges match DailyLogList pattern:
  - Draft → orange/10 bg, orange text
  - Completed → green/10 bg, green text
  - Locked → gray bg, gray text
- Category badges: use subtle colored pills (similar to issue category badges)
- All touch targets min 44px height (mobile-first)
- Use lucide-react icons only (Shield for tab, ShieldCheck for completed, etc.)

### PDF Generation
Follow the exact same client-side PDF pattern used in Issue Reports:
- Browser print-to-PDF approach
- Navy/dark header with IronTrack branding
- Clean table for attendance
- Numbered talking points
- Generated timestamp in footer

### What Is NOT in V1
- Photo attachments on talks (later)
- Digital signature capture (canvas drawing) — checkbox is sufficient for V1
- OSHA compliance scoring/reporting
- Safety incident tracking (separate feature later)
- JHA/JSA templates (separate feature later)
- AI-generated talk content
- Integration with external safety management systems
- Notifications/reminders for upcoming talks
