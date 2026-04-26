"use client";

import CrewManager from "@/components/sub-ops/CrewManager";

interface Props {
  projectId: string;
}

export default function SubCrewTab({ projectId }: Props) {
  return <CrewManager projectId={projectId} />;
}
