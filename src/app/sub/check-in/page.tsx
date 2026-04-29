"use client";

import CheckInView from "@/components/sub-ops/CheckInView";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubCheckInViewPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Daily Check-In"
      title="Fast Field Update"
      description="Capture manpower, progress, delays, and notes in a GC-ready format without turning the foreman's morning into paperwork."
      actionHref="/sub/blockers"
      actionLabel="Log blocker"
    >
      {(projectId) => <CheckInView projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
