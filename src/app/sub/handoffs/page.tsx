"use client";

import HandoffTracker from "@/components/sub-ops/HandoffTracker";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubHandoffTrackerPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Handoffs"
      title="Area Turnover Control"
      description="Track what is ready, what is accepted, and what still needs a checklist item, photo, or follow-up."
    >
      {(projectId) => <HandoffTracker projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
