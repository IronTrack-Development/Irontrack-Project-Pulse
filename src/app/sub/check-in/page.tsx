"use client";

import CheckInView from "@/components/sub-ops/CheckInView";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubCheckInViewPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Proof Log"
      title="Fast Field Proof"
      description="Capture manpower, progress, delays, photos, and notes as a clear shareable record without turning the foreman's morning into paperwork."
      actionHref="/sub/blockers"
      actionLabel="Prepare GC notice"
    >
      {(projectId) => <CheckInView projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
