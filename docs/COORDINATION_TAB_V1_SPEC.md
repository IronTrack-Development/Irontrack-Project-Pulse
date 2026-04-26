# Coordination Tab V1 — Build Spec

## Overview
New top-level "Coordination" tab in IronTrack Pulse for managing trade coordination meetings, conflict detection, action items, and meeting documentation. Supports customizable meeting types, agenda templates, and action item categories.

## Architecture
Follow exact patterns established by Daily Logs (migration 011) and Safety (migration 013).

### Database — Migration 014_coordination.sql

#### Table: `coordination_meetings`
```sql
CREATE TABLE IF NOT EXISTS coordination_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'weekly_coordination',
  title TEXT NOT NULL,
  location TEXT,
  facilitator TEXT,
  start_time TEXT,
  end_time TEXT,
  notes TEXT,
  summary TEXT,
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_day TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

#### Table: `coordination_agenda_items`
```sql
CREATE TABLE IF NOT EXISTS coordination_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES coordination_meetings(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  trade TEXT,
  area TEXT,
  notes TEXT,
  has_conflict BOOLEAN DEFAULT false,
  conflict_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'deferred', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table: `coordination_action_items`
```sql
CREATE TABLE IF NOT EXISTS coordination_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES coordination_meetings(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  assigned_company TEXT,
  assigned_trade TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'rfi', 'material_delivery', 'manpower', 'equipment',
    'schedule', 'safety', 'drawing', 'submittal', 'inspection', 'custom'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table: `coordination_meeting_types`
User-customizable meeting types per project.
```sql
CREATE TABLE IF NOT EXISTS coordination_meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_agenda TEXT[] DEFAULT '{}',
  default_duration_minutes INTEGER DEFAULT 60,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table: `coordination_attendees`
```sql
CREATE TABLE IF NOT EXISTS coordination_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES coordination_meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  trade TEXT,
  present BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes
```sql
CREATE INDEX idx_coord_meetings_project_date ON coordination_meetings(project_id, meeting_date DESC);
CREATE INDEX idx_coord_agenda_meeting ON coordination_agenda_items(meeting_id, sort_order);
CREATE INDEX idx_coord_actions_project ON coordination_action_items(project_id, status);
CREATE INDEX idx_coord_actions_meeting ON coordination_action_items(meeting_id);
CREATE INDEX idx_coord_attendees_meeting ON coordination_attendees(meeting_id);
CREATE INDEX idx_coord_meeting_types_project ON coordination_meeting_types(project_id);
```

#### RLS (V1 — open access)
```sql
ALTER TABLE coordination_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON coordination_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_agenda_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_action_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_meeting_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_attendees FOR ALL USING (true) WITH CHECK (true);
```

#### Trigger + Seed Data
```sql
CREATE TRIGGER coord_meetings_updated_at
  BEFORE UPDATE ON coordination_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER coord_actions_updated_at
  BEFORE UPDATE ON coordination_action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- System meeting types
INSERT INTO coordination_meeting_types (name, default_agenda, default_duration_minutes, is_system) VALUES
('Weekly Coordination', ARRAY['Review 3-week lookahead','Trade conflicts and overlaps','Open action items','Material deliveries this week','Manpower needs','Safety concerns','Schedule changes','New business'], 60, true),
('OAC Meeting', ARRAY['Project status update','Schedule review','Budget update','Change orders','RFI status','Submittal status','Safety report','Owner items'], 90, true),
('Pre-Pour Meeting', ARRAY['Pour location and scope','Concrete mix design and supplier','Rebar inspection status','Embed and sleeve verification','Weather forecast','Pour sequence and crew','Pump or direct placement','Finish requirements and curing'], 30, true),
('Pull Planning Session', ARRAY['Define target milestone','Identify required tasks and handoffs','Map trade dependencies','Set weekly work plans','Identify constraints','Assign commitments','Review PPC from last cycle'], 120, true),
('Pre-Task Planning', ARRAY['Scope of work today','Hazards and controls','Required permits','Equipment and materials needed','Emergency procedures','Questions and concerns'], 15, true);
```

### API Routes

#### `src/app/api/projects/[id]/coordination/route.ts`
- **GET** — List meetings for project (paginated, newest first). Include action item counts.
- **POST** — Create new meeting. Accepts `meeting_type` to auto-populate from meeting type template. Optionally auto-pulls Week 1 activities as agenda items.

#### `src/app/api/projects/[id]/coordination/[meetingId]/route.ts`
- **GET** — Get single meeting with agenda items, action items, and attendees.
- **PATCH** — Update meeting (title, notes, status, etc.)
- **DELETE** — Delete scheduled/cancelled meetings only.

#### `src/app/api/projects/[id]/coordination/[meetingId]/agenda/route.ts`
- **GET** — List agenda items for meeting.
- **POST** — Add agenda item(s). Accepts `auto_populate: true` to pull from schedule lookahead.
- **PATCH** — Update agenda item (status, notes, reorder).
- **DELETE** — Remove agenda item.

#### `src/app/api/projects/[id]/coordination/[meetingId]/actions/route.ts`
- **GET** — List action items for meeting.
- **POST** — Create action item.
- **PATCH** — Update action item (status, assignee, due date, resolution).
- **DELETE** — Remove action item.

#### `src/app/api/projects/[id]/coordination/[meetingId]/attendees/route.ts`
- **GET** — List attendees.
- **POST** — Add attendee(s) — single or batch, pull from Ready Check contacts or subs.
- **PATCH** — Mark present/absent.
- **DELETE** — Remove attendee.

#### `src/app/api/projects/[id]/coordination/[meetingId]/complete/route.ts`
- **POST** — Mark meeting as completed. Sets completed_at.

#### `src/app/api/projects/[id]/coordination/[meetingId]/pdf/route.ts`
- **GET** — Generate PDF: meeting details, agenda with status, action items table, attendees, notes.

#### `src/app/api/projects/[id]/coordination/actions/route.ts`
- **GET** — List ALL open action items across all meetings for a project. This is the "action item tracker" view.

#### `src/app/api/projects/[id]/coordination/meeting-types/route.ts`
- **GET** — List meeting types (system + project-custom).
- **POST** — Create custom meeting type for this project.

#### `src/app/api/projects/[id]/coordination/conflicts/route.ts`
- **GET** — Auto-detect schedule conflicts for current week: overlapping trades in same area/building during same timeframe. Returns conflict pairs with activity details.

### UI Components

#### `src/components/tabs/CoordinationTab.tsx`
Thin wrapper.

#### `src/components/coordination/CoordinationDashboard.tsx`
Main view with three sections:
1. **Action Items Banner** — Count of open action items across all meetings. "X open items, Y overdue." Click opens action tracker.
2. **Upcoming/Recent Meetings** — Card list (same pattern as DailyLogList). Status badges: scheduled (blue), in_progress (orange), completed (green), cancelled (gray).
3. **"New Meeting" button** (orange, top-right) → opens NewMeetingModal.

#### `src/components/coordination/NewMeetingModal.tsx`
- Select meeting type (from meeting_types table — system + custom)
- Date picker (defaults to today)
- Title (auto-fills from meeting type, editable)
- Facilitator (text, optional)
- Location (text, optional)
- "Auto-populate agenda from schedule" toggle (pulls Week 1 activities grouped by trade)
- Create button

#### `src/components/coordination/MeetingDetail.tsx`
Full meeting view with sections:
1. **Header** — Title, type badge, date, facilitator, status, complete/cancel buttons
2. **Agenda Section** — Ordered list of agenda items. Each shows: title, trade, area, conflict badge (red if flagged), status (pending/discussed/deferred/resolved), notes. Add item button. Auto-populate from schedule button.
3. **Conflicts Panel** — Auto-detected trade conflicts for the meeting week. Dismissible. Shows both activities, trade names, overlapping dates, area.
4. **Action Items Section** — Table/list: title, assignee, company, category badge, priority, due date, status. Inline add. Click to edit.
5. **Attendees Section** — List with present/absent toggle. Quick-add from contacts.
6. **Meeting Notes** — Rich textarea.
7. **Actions** — Complete Meeting, Export PDF, Delete (draft only).

#### `src/components/coordination/ActionTracker.tsx`
Cross-meeting action item view for the project:
- Filter by: status, category, assignee, meeting, priority
- Sort by: due date, priority, created date
- Bulk status update
- Shows which meeting the item came from

#### `src/components/coordination/ConflictDetector.tsx`
Reusable conflict display component:
- Shows pairs of activities that overlap in same area
- Trade names, date ranges, areas
- "Dismiss" or "Create Action Item" buttons per conflict

### Types — Add to `src/types/index.ts`

```typescript
export type CoordinationMeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type CoordinationRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type AgendaItemStatus = 'pending' | 'discussed' | 'deferred' | 'resolved';
export type ActionItemCategory = 'general' | 'rfi' | 'material_delivery' | 'manpower' | 'equipment' | 'schedule' | 'safety' | 'drawing' | 'submittal' | 'inspection' | 'custom';
export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface CoordinationMeeting {
  id: string;
  project_id: string;
  meeting_date: string;
  meeting_type: string;
  title: string;
  location?: string;
  facilitator?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  summary?: string;
  recurrence: CoordinationRecurrence;
  recurrence_day?: string;
  status: CoordinationMeetingStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  agenda_count?: number;
  action_count?: number;
  open_action_count?: number;
}

export interface CoordinationAgendaItem {
  id: string;
  meeting_id: string;
  activity_id?: string;
  sort_order: number;
  title: string;
  trade?: string;
  area?: string;
  notes?: string;
  has_conflict: boolean;
  conflict_description?: string;
  status: AgendaItemStatus;
  created_at: string;
}

export interface CoordinationActionItem {
  id: string;
  meeting_id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_company?: string;
  assigned_trade?: string;
  category: ActionItemCategory;
  priority: ActionItemPriority;
  due_date?: string;
  status: ActionItemStatus;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoordinationMeetingType {
  id: string;
  project_id?: string;
  name: string;
  default_agenda: string[];
  default_duration_minutes: number;
  is_system: boolean;
  created_at: string;
}

export interface CoordinationAttendee {
  id: string;
  meeting_id: string;
  name: string;
  company?: string;
  trade?: string;
  present: boolean;
  created_at: string;
}

export interface ScheduleConflict {
  activity_a: { id: string; name: string; trade: string; area: string; start: string; finish: string };
  activity_b: { id: string; name: string; trade: string; area: string; start: string; finish: string };
  overlap_start: string;
  overlap_end: string;
  conflict_type: 'same_area' | 'same_trade_area' | 'predecessor_delay';
}
```

### Integration into Project Page

In `src/app/projects/[id]/page.tsx`:
1. Add import: `import CoordinationTab from "@/components/tabs/CoordinationTab";`
2. Add `{ Handshake }` to lucide-react imports
3. Add tab renderer: `{activeTab === "coordination" && <CoordinationTab projectId={id} />}`

In `src/components/navigation/ProjectNav.tsx`:
1. Add `Handshake` to lucide-react imports
2. Add Coordination group between Field Ops and Documents:
```
{
  id: "coordination",
  label: "Coordination",
  icon: Handshake,
  tabs: [
    { id: "coordination", label: "Meetings", icon: Handshake },
    { id: "action-tracker", label: "Action Items", icon: CheckSquare },
  ],
}
```
3. Add to lastTabPerGroup: `coordination: "coordination"`

### Styling Rules
Same as Safety tab — dark theme, orange accent, 44px touch targets, lucide-react icons only.

### PDF Generation
Same client-side approach as Safety and Issue Reports. Branded header with meeting details, agenda table, action items table, attendee list, notes section.

### What Is NOT in V1
- Real-time collaborative editing
- Email/SMS notifications for action items
- Calendar integration (Google Calendar, Outlook)
- Video conferencing links
- Historical conflict trend analysis
- AI-generated meeting summaries
- Automatic action item creation from notes
