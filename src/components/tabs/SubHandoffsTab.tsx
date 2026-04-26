"use client";

import HandoffTracker from "@/components/sub-ops/HandoffTracker";

interface Props {
  projectId: string;
}

export default function SubHandoffsTab({ projectId }: Props) {
  return <HandoffTracker projectId={projectId} />;
}
