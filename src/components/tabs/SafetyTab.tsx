"use client";

import SafetyDashboard from "@/components/safety/SafetyDashboard";

interface SafetyTabProps {
  projectId: string;
}

export default function SafetyTab({ projectId }: SafetyTabProps) {
  return <SafetyDashboard projectId={projectId} />;
}
