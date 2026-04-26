"use client";

import CheckInView from "@/components/sub-ops/CheckInView";

interface Props {
  projectId: string;
}

export default function SubCheckinsTab({ projectId }: Props) {
  return <CheckInView projectId={projectId} />;
}
