"use client";

import DispatchBoard from "@/components/sub-ops/DispatchBoard";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubDispatchBoardPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Work Cards"
      title="Upcoming Scope Cards"
      description="Turn GC asks and upcoming scope into simple cards with crew, material, access, location, and next action before crews hit the gate."
      actionHref="/sub/check-in"
      actionLabel="Add proof"
    >
      {(projectId) => <DispatchBoard projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
