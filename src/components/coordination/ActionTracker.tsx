"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare,
  RefreshCw,
  Filter,
  AlertTriangle,
} from "lucide-react";
import type { CoordinationActionItem, ActionItemCategory, ActionItemPriority, ActionItemStatus } from "@/types";

interface ActionTrackerProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#3B82F6",
  in_progress: "#F97316",
  resolved: "#22C55E",
  cancelled: "#6B7280",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#EAB308",
  low: "#6B7280",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "#6B7280",
  rfi: "#8B5CF6",
  material_delivery: "#3B82F6",
  manpower: "#F97316",
  equipment: "#EAB308",
  schedule: "#22C55E",
  safety: "#EF4444",
  drawing: "#EC4899",
  submittal: "#06B6D4",
  inspection: "#14B8A6",
  custom: "#9CA3AF",
};

type ActionItemWithMeeting = CoordinationActionItem & { meeting_title?: string; meeting_date?: string };

export default function ActionTracker({ projectId }: ActionTrackerProps) {
  const [items, setItems] = useState<ActionItemWithMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [openCount, setOpenCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    if (filterPriority) params.set("priority", filterPriority);

    try {
      const res = await fetch(`/api/projects/${projectId}/coordination/actions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.action_items || []);
        setOpenCount(data.open_count || 0);
        setOverdueCount(data.overdue_count || 0);
      }
    } catch (e) { /* silent */ }
    setLoading(false);
  }, [projectId, filterStatus, filterCategory, filterPriority]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateStatus = async (item: ActionItemWithMeeting, newStatus: string) => {
    const res = await fetch(`/api/projects/${projectId}/coordination/${item.meeting_id}/actions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_item_id: item.id, status: newStatus }),
    });
    if (res.ok) {
      fetchItems();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} className="text-[#F97316]" />
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Action Items</h2>
          {openCount > 0 && (
            <span className="text-sm text-[color:var(--text-secondary)] ml-2">
              {openCount} open{overdueCount > 0 && <span className="text-red-400"> · {overdueCount} overdue</span>}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-sm transition-colors min-h-[44px]"
        >
          <Filter size={14} />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-xs focus:outline-none min-h-[36px]"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-xs focus:outline-none min-h-[36px]"
          >
            <option value="">All Categories</option>
            {Object.keys(CATEGORY_COLORS).map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-xs focus:outline-none min-h-[36px]"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {(filterStatus || filterCategory || filterPriority) && (
            <button
              onClick={() => { setFilterStatus(""); setFilterCategory(""); setFilterPriority(""); }}
              className="px-3 py-2 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-h-[36px]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <CheckSquare size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-[color:var(--text-secondary)] text-lg">
            {filterStatus || filterCategory || filterPriority ? "No matching action items" : "No action items yet"}
          </p>
        </div>
      )}

      {/* Items */}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const isOverdue = (item.status === "open" || item.status === "in_progress") &&
              item.due_date && new Date(item.due_date) < new Date();

            return (
              <div key={item.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[color:var(--text-primary)] text-sm font-medium">{item.title}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}20`, color: CATEGORY_COLORS[item.category] }}
                      >
                        {item.category.replace(/_/g, " ")}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${PRIORITY_COLORS[item.priority]}20`, color: PRIORITY_COLORS[item.priority] }}
                      >
                        {item.priority}
                      </span>
                      {isOverdue && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400">
                          <AlertTriangle size={9} /> overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[color:var(--text-muted)] flex-wrap">
                      {item.assigned_to && <span>{item.assigned_to}</span>}
                      {item.assigned_company && <span>· {item.assigned_company}</span>}
                      {item.due_date && (
                        <span className={isOverdue ? "text-red-400" : ""}>
                          · Due {new Date(item.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {item.meeting_title && (
                        <span>· from {item.meeting_title}</span>
                      )}
                    </div>
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item, e.target.value)}
                    className="text-xs rounded px-2 py-1 bg-[var(--bg-tertiary)] border-none min-h-[36px] shrink-0"
                    style={{ color: STATUS_COLORS[item.status] }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
