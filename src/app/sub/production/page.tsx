"use client";

import ProductionTracker from "@/components/sub-ops/ProductionTracker";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubProductionTrackerPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Production Proof"
      title="Quantities, Hours, and Field Evidence"
      description="Review recent production signals and keep progress conversations anchored to proof your PM or owner can defend."
      actionHref="/sub/check-in"
      actionLabel="Add proof"
    >
      {(projectId) => <ProductionTracker projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
