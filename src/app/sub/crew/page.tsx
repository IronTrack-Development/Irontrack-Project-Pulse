"use client";

import CrewManager from "@/components/sub-ops/CrewManager";
import SubPortalProjectPage from "@/components/sub-ops/SubPortalProjectPage";

export default function SubCrewManagerPage() {
  return (
    <SubPortalProjectPage
      eyebrow="Crew"
      title="Crew Roster and Readiness"
      description="Keep the working roster clean so check-ins, dispatches, and production reporting reflect the people actually on site."
    >
      {(projectId) => <CrewManager projectId={projectId} />}
    </SubPortalProjectPage>
  );
}
