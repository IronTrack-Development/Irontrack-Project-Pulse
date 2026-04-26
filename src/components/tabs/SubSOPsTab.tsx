"use client";

import SOPLibrary from "@/components/sub-ops/SOPLibrary";

interface Props {
  projectId: string;
}

export default function SubSOPsTab({ projectId }: Props) {
  return <SOPLibrary projectId={projectId} />;
}
