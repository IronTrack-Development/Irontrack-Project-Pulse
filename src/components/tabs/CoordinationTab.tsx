"use client";

import CoordinationDashboard from "@/components/coordination/CoordinationDashboard";

interface CoordinationTabProps {
  projectId: string;
  defaultView?: "meetings" | "actions";
}

export default function CoordinationTab({ projectId, defaultView = "meetings" }: CoordinationTabProps) {
  return <CoordinationDashboard projectId={projectId} defaultView={defaultView} />;
}
