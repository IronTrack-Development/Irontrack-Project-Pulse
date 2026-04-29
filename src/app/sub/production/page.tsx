"use client";

import ProductionTracker from "@/components/sub-ops/ProductionTracker";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubProductionTrackerPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Production"
      title="Quantities and Crew Output"
      description="Review recent production signals and keep percent-complete conversations anchored to field evidence."
      actionHref="/sub/check-in"
      actionLabel="Add update"
    >
      {(projectId) => <ProductionTracker projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
