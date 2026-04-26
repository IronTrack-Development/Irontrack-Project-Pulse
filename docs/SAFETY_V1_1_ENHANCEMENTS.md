# Safety Tab V1.1 — Customizability Enhancements

## Overview
Enhance the Safety tab with user customization: custom templates, editable talking points, default presenter, and branded PDF export.

## Changes Required

### 1. NewTalkModal.tsx — Editable Talking Points
When a user selects a template to start a talk:
- Talking points pre-fill from the template BUT are fully editable
- User can: add new points, remove points, reorder points (drag or up/down arrows)
- User can edit the text of any pre-filled point
- "Add Talking Point" button at bottom of list
- This is already partially supported (talking_points is TEXT[] on toolbox_talks) — just needs the UI to allow editing before saving

### 2. NewTalkModal.tsx — Custom Template Creation
After creating and completing a custom talk, offer "Save as Template" button:
- Saves current talk's topic, category, talking points, and duration as a new project-scoped template
- Shows in template picker with a "Custom" badge next to system templates
- The API route already exists: `POST /api/projects/[id]/safety/templates`

### 3. SafetyDashboard.tsx — "Manage Templates" Link
- Small link/button that opens a template management view
- List all templates (system + custom). System templates are read-only. Custom templates can be edited or deleted.
- Create new template from scratch (not from a completed talk)

### 4. TalkDetail.tsx — Default Presenter
- If no presenter is set on the talk, check for a project-level default
- Add "Set as default presenter" checkbox when entering presenter name
- Store in a simple project_settings approach: use the project's existing metadata or a localStorage key `pulse_default_presenter_{projectId}`
- For V1.1 use localStorage — no migration needed. Can move to DB later.

### 5. PDF Export — Company Branding
- Add optional company name and project name to PDF header
- Pull project name from the project data (already available)
- Company name: use localStorage `pulse_company_name` for V1.1
- Small "Settings" gear icon on SafetyDashboard that lets user set company name (stored in localStorage)
- PDF header becomes: "[Company Name] | [Project Name] | Toolbox Talk Record" instead of just "IronTrack Pulse"

### 6. TalkDetail.tsx — Editable Talking Points After Creation
- Currently talking points are set at creation. Allow editing on draft talks.
- Same editable list UI as NewTalkModal
- Lock editing when status is 'completed' or 'locked'

## Files to Modify
- `src/components/safety/NewTalkModal.tsx` — editable talking points list, save-as-template button
- `src/components/safety/SafetyDashboard.tsx` — manage templates link, settings gear for company name
- `src/components/safety/TalkDetail.tsx` — editable talking points on drafts, default presenter, save-as-template
- `src/components/safety/AttendanceSheet.tsx` — no changes needed

## New Files
- `src/components/safety/TemplateManager.tsx` — list/create/edit/delete custom templates
- `src/components/safety/EditableTalkingPoints.tsx` — reusable editable list component (add, remove, reorder, edit text)
- `src/components/safety/SafetySettings.tsx` — small modal for company name + default presenter

## No Migration Needed
All customization stores in existing tables (toolbox_talk_templates with is_system=false, project_id set) or localStorage for V1.1.
