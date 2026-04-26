"use client";

import DispatchBoard from "@/components/sub-ops/DispatchBoard";

interface Props {
  projectId: string;
}

export default function SubDispatchTab({ projectId }: Props) {
  return <DispatchBoard projectId={projectId} />;
}
