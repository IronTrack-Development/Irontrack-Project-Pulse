"use client";

import ProductionTracker from "@/components/sub-ops/ProductionTracker";

interface Props {
  projectId: string;
}

export default function SubProductionTab({ projectId }: Props) {
  return <ProductionTracker projectId={projectId} />;
}
