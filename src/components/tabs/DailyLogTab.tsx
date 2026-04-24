"use client";

import DailyLogList from "@/components/daily-log/DailyLogList";

interface DailyLogTabProps {
  projectId: string;
}

export default function DailyLogTab({ projectId }: DailyLogTabProps) {
  return <DailyLogList projectId={projectId} />;
}
