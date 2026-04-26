"use client";

import SubOpsDashboard from "@/components/sub-ops/SubOpsDashboard";

interface Props {
  projectId: string;
}

export default function SubDashboardTab({ projectId }: Props) {
  return <SubOpsDashboard projectId={projectId} />;
}
