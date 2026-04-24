"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import DailyLogWizard from "@/components/daily-log/DailyLogWizard";

function DailyLogInner({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const existingLogId = searchParams.get("logId") || undefined;
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setProjectName(data.name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <DailyLogWizard
      projectId={projectId}
      projectName={projectName}
      logDate={date}
      existingLogId={existingLogId}
    />
  );
}

export default function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="text-[#F97316] animate-spin" />
        </div>
      }
    >
      <DailyLogInner projectId={id} />
    </Suspense>
  );
}
