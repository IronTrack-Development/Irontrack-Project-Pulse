"use client";

import BlockersList from "@/components/sub-ops/BlockersList";

interface Props {
  projectId: string;
}

export default function SubBlockersTab({ projectId }: Props) {
  return <BlockersList projectId={projectId} />;
}
