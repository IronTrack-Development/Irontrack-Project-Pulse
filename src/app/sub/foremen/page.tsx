"use client";

import ForemanManager from "@/components/sub-ops/ForemanManager";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubForemanManagerPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Foremen"
      title="Field Leads"
      description="Manage the people who send updates, acknowledge dispatches, and keep GC-facing progress grounded in real field conditions."
    >
      {(projectId) => <ForemanManager projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
