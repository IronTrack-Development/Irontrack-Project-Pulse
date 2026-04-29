"use client";

import BlockersList from "@/components/sub-ops/BlockersList";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubBlockersListPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Blockers"
      title="Issues That Need a Decision"
      description="Track access, material, drawing, manpower, and GC decision blockers so the next responsible person is obvious."
      actionHref="/sub/check-in"
      actionLabel="Field update"
    >
      {(projectId) => <BlockersList projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
