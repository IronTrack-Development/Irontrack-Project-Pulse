"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

interface ProgressData {
  totalActivities: number;
  completeActivities: number;
  percentComplete: number;
  targetFinishDate: string | null;
  daysRemaining: number | null;
}

interface ProgressTabProps {
  projectId: string;
}

export default function ProgressTab({ projectId }: ProgressTabProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/progress`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-12 text-center">
        <div className="text-gray-400 text-sm">Unable to load progress data</div>
      </div>
    );
  }

  const progressColor = data.percentComplete >= 75 
    ? "#22C55E" 
    : data.percentComplete >= 50 
    ? "#F97316" 
    : "#EF4444";

  return (
    <div className="space-y-6">
      {/* Large percent complete display */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 text-center">
        <div className="mb-4">
          <TrendingUp size={40} className="mx-auto text-[#F97316]" />
        </div>
        <div className="text-6xl font-bold mb-2" style={{ color: progressColor }}>
          {data.percentComplete}%
        </div>
        <div className="text-sm text-gray-500">Project Complete</div>
      </div>

      {/* Progress bar visualization */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-mono text-gray-400">{data.percentComplete}%</span>
          </div>
          <div className="w-full bg-[#0B0B0D] rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.percentComplete}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-4">
            <CheckCircle2 size={16} className="text-[#22C55E] mb-2" />
            <div className="text-2xl font-bold text-white">{data.completeActivities}</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-4">
            <CheckCircle2 size={16} className="text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-white">{data.totalActivities - data.completeActivities}</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6">
        <div className="text-sm font-semibold text-white mb-4">Activity Breakdown</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Activities</span>
            <span className="font-semibold text-white">{data.totalActivities}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Complete</span>
            <span className="font-semibold text-[#22C55E]">{data.completeActivities}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">In Progress</span>
            <span className="font-semibold text-[#F97316]">{data.totalActivities - data.completeActivities}</span>
          </div>
        </div>
      </div>

      {/* Target finish date and countdown */}
      {data.targetFinishDate && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-[#F97316]" />
            <div className="text-sm font-semibold text-white">Target Completion</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {new Date(data.targetFinishDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          {data.daysRemaining !== null && (
            <div className={`text-sm font-semibold ${
              data.daysRemaining < 0 
                ? "text-[#EF4444]" 
                : data.daysRemaining < 30 
                ? "text-[#F97316]" 
                : "text-[#22C55E]"
            }`}>
              {data.daysRemaining < 0 
                ? `${Math.abs(data.daysRemaining)} days overdue` 
                : `${data.daysRemaining} days remaining`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
