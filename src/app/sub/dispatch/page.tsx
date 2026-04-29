"use client";

import DispatchBoard from "@/components/sub-ops/DispatchBoard";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubDispatchBoardPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Dispatch"
      title="Tomorrow's Crew Plan"
      description="Send clear direction, surface acknowledgements, and keep field leads aligned before crews hit the gate."
      actionHref="/sub/check-in"
      actionLabel="Check in"
    >
      {(projectId) => <DispatchBoard projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
