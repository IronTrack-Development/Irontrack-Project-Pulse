"use client";

import HandoffTracker from "@/components/sub-ops/HandoffTracker";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubHandoffTrackerPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Readiness Board"
      title="Ready, Not Ready, Blocked"
      description="Track what is ready, accepted, missing material, missing access, waiting on drawings, or blocked before the next crew walks in blind."
    >
      {(projectId) => <HandoffTracker projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
