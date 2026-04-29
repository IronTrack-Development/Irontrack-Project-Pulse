"use client";

import SOPLibrary from "@/components/sub-ops/SOPLibrary";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubSOPLibraryPage() {
  return (
    <SubPortalProjectPage
      eyebrow="SOPs"
      title="Crew Standards Library"
      description="Put the latest install standards, project rules, and repeatable methods where the field can actually use them."
    >
      {(projectId) => <SOPLibrary projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
