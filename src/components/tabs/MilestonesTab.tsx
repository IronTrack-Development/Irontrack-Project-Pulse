"use client";

import { useEffect, useState } from "react";
import { Flag, Loader2, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface Milestone {
  id: string;
  activity_name: string;
  milestone_date: string;
  percent_complete: number | null;
  status: "complete" | "upcoming" | "overdue";
}

interface MilestonesTabProps {
  projectId: string;
}

export default function MilestonesTab({ projectId }: MilestonesTabProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/milestones`);
        if (res.ok) {
          const json = await res.json();
          setMilestones(json.milestones || []);
        }
      } catch (error) {
        console.error("Failed to fetch milestones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-12 text-center">
        <Flag size={40} className="mx-auto text-gray-700 mb-4" />
        <div className="text-gray-400 text-sm">No milestones found</div>
      </div>
    );
  }

  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle size={16} className="text-[#22C55E]" />;
      case "upcoming":
        return <Clock size={16} className="text-[#F97316]" />;
      case "overdue":
        return <AlertTriangle size={16} className="text-[#EF4444]" />;
    }
  };

  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "complete":
        return "text-[#22C55E]";
      case "upcoming":
        return "text-[#F97316]";
      case "overdue":
        return "text-[#EF4444]";
    }
  };

  const getStatusBg = (status: Milestone["status"]) => {
    switch (status) {
      case "complete":
        return "bg-[#22C55E]/10 border-[#22C55E]/20";
      case "upcoming":
        return "bg-[#F97316]/10 border-[#F97316]/20";
      case "overdue":
        return "bg-[#EF4444]/10 border-[#EF4444]/20";
    }
  };

  return (
    <div className="space-y-3">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className={`bg-[#121217] border rounded-xl overflow-hidden transition-all hover:shadow-lg ${getStatusBg(milestone.status)}`}
        >
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5">{getStatusIcon(milestone.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white mb-1">{milestone.activity_name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {new Date(milestone.milestone_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className={`font-semibold ${getStatusColor(milestone.status)}`}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              {milestone.percent_complete !== null && (
                <div className={`text-sm font-semibold shrink-0 ${
                  milestone.percent_complete >= 100 
                    ? "text-[#22C55E]" 
                    : "text-gray-400"
                }`}>
                  {milestone.percent_complete}%
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
