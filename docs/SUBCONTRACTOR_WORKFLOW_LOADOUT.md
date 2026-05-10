# Subcontractor Workflow Loadout

IronTrack should feel like one connected field system, not a menu of unrelated features.

## Core Principle

The **Work Card** is the center of the experience.

Everything else is either:

- input to a Work Card,
- status on a Work Card,
- proof attached to a Work Card,
- communication generated from a Work Card, or
- a rollup of Work Cards.

## Admin Sub Portal Flow

```txt
Owner Snapshot
  -> Job Inbox
  -> Convert to Work Card
  -> Assign Foreman
  -> Monitor Readiness
  -> Review Proof
  -> Prepare GC Response
  -> Export Report / update Owner Snapshot
```

### Admin Loadout

1. **Owner Snapshot** — What needs owner attention today?
2. **Job Inbox** — What did the GC ask for across portals, email, PDFs, screenshots, texts, calls, and spreadsheets?
3. **Work Cards** — What field-executable scope has been assigned?
4. **Readiness Board** — Are materials, access, drawings, crew, and predecessors ready?
5. **Proof Log** — What proof exists and what is missing?
6. **GC Response** — What do we need to send back?
7. **Reports** — What packet or summary needs to leave the system?

## Foreman Portal Flow

```txt
Pick Job
  -> Job Control
  -> Open Work Card
  -> Add Proof / Flag Blocker / Confirm Readiness
  -> Handoff
```

### Foreman Loadout

1. **Pick Job** — Where am I working today?
2. **Job Control** — One-tap launch grid for the selected project.
3. **Start Here** — Open the next Work Card before browsing tools.
4. **Work Card** — Scope, location, crew, readiness, blockers, proof, and handoff.
5. **Proof Capture** — Photos, notes, manpower, delay impact, timestamp.
6. **Blocker Notice** — What is stopping us and who needs to know?
7. **Handoff** — What does the next crew need before we leave?

## Pipeline

```txt
GC chaos comes in
  -> Job Inbox
  -> Work Card
  -> Readiness
  -> Proof Log
  -> GC Response
  -> Owner Snapshot
```

## UX Rule

If a user has to decide which module owns the story, the product is too fragmented.

The answer should be:

> Open the Work Card. Everything is there.

## Near-Term Product Gaps

1. **Manual Job Inbox intake** — needs a real form and data model for email/PDF/screenshot/text/call/manual-note capture.
2. **Unified Work Card object** — current dispatches/schedule tasks/proof/blockers are related but not yet one canonical object.
3. **Contextual proof capture** — every proof item should ask what it protects: Work Card, Blocker, Material, Access, Drawing Issue, or General Progress.
4. **GC Response from Blocker** — every blocker should be one click from a clean notice, PDF, or proof packet.
5. **Foreman Start Here** — foremen need one obvious next action before the full tool grid.
