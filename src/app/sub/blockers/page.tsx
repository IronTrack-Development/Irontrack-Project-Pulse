"use client";

import BlockersList from "@/components/sub-ops/BlockersList";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubBlockersListPage() {
  return (
    <SubPortalProjectPage
      eyebrow="GC Response"
      title="Blockers That Need a Clean Notice"
      description="Track access, material, drawing, manpower, predecessor, and GC-decision blockers so the next response is obvious and backed by proof."
      actionHref="/sub/check-in"
      actionLabel="Add proof"
    >
      {(projectId) => <BlockersList projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
