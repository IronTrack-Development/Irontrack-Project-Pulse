"use client";

import FieldReportsDashboard from "@/components/field-reports/FieldReportsDashboard";

interface FieldReportsTabProps {
  projectId: string;
  defaultView?: "list" | "detail";
}

export default function FieldReportsTab({ projectId, defaultView }: FieldReportsTabProps) {
  return <FieldReportsDashboard projectId={projectId} defaultView={defaultView} />;
}
