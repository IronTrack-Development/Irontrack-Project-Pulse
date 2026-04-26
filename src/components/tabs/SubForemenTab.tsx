"use client";

import ForemanManager from "@/components/sub-ops/ForemanManager";

interface Props {
  projectId: string;
}

export default function SubForemenTab({ projectId }: Props) {
  return <ForemanManager projectId={projectId} />;
}
