"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Camera, X, Plus, ChevronRight, CheckCircle,
  ClipboardList, Share2, ExternalLink, Search, Building2,
  MapPin, Calendar, AlertTriangle, Wrench
} from "lucide-react";
import type { ParsedActivity, IssuePriority, IssueCategory } from "@/types";

interface LocalPhoto {
  file: File;
  preview: string;
  caption: string;
  uploadedPath?: string;
}

interface LocalIssue {
  id: string; // temp local id
  title: string;
  note: string;
  location: string;
  priority: IssuePriority;
  category: IssueCategory;
  trade: string;
  potential_impact: string;
  action_needed: string;
  photos: LocalPhoto[];
}

type Step = "select" | "issues" | "done";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtNorm(val?: string | null): string {
  if (!val) return "";
  return val.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function priorityColor(p: IssuePriority) {
  switch (p) {
    case "high": return "bg-[#EF4444] text-white";
    case "medium": return "bg-[#EAB308] text-black";
    case "low": return "bg-[#22C55E] text-black";
  }
}

function categoryColor(c: IssueCategory) {
  switch (c) {
    case "qa_qc": return "bg-[#3B82F6] text-white";
    case "safety": return "bg-[#EF4444] text-white";
    case "schedule": return "bg-[#F97316] text-black";
  }
}

function categoryLabel(c: IssueCategory) {
  switch (c) {
    case "qa_qc": return "QA/QC";
    case "safety": return "Safety";
    case "schedule": return "Schedule";
  }
}

// Compress image client-side before upload
async function compressImage(file: File, maxWidth = 1920): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

const EMPTY_ISSUE = (): LocalIssue => ({
  id: Math.random().toString(36).slice(2),
  title: "",
  note: "",
  location: "",
  priority: "medium",
  category: "qa_qc",
  trade: "",
  potential_impact: "",
  action_needed: "",
  photos: [],
});

export default function GenerateReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedActivityId = searchParams.get("activity");

  const [step, setStep] = useState<Step>(preselectedActivityId ? "issues" : "select");
  const [activities, setActivities] = useState<ParsedActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<ParsedActivity | null>(null);
  const [issues, setIssues] = useState<LocalIssue[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<LocalIssue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneReportId, setDoneReportId] = useState<string | null>(null);
  const [doneReportNum, setDoneReportNum] = useState<string>("");
  const [preparedBy, setPreparedBy] = useState("");
  const [showPreparedByPrompt, setShowPreparedByPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      setLoadingActivities(true);
      try {
        // Fetch all non-complete activities sorted by start_date
        const res = await fetch(`/api/projects/${id}/activities?sort=start_date&dir=asc`);
        if (res.ok) {
          const data: ParsedActivity[] = await res.json();
          // Filter out completed activities
          setActivities(data.filter((a) => a.status !== "complete"));
        }
      } catch {
        // ignore
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [id]);

  // Auto-select activity from query param
  useEffect(() => {
    if (preselectedActivityId && activities.length > 0) {
      const found = activities.find((a) => a.id === preselectedActivityId);
      if (found) {
        setSelectedActivity(found);
        setStep("issues");
      }
    }
  }, [preselectedActivityId, activities]);

  const filtered = activities.filter((a) =>
    searchQuery
      ? a.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.trade || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.normalized_building || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Group by week
  const now = new Date();
  const grouped: Record<string, ParsedActivity[]> = { "This Week": [], "Week 2": [], "Week 3+": [], "No Date": [] };
  filtered.forEach((a) => {
    if (!a.start_date) { grouped["No Date"].push(a); return; }
    const start = new Date(a.start_date);
    const daysAway = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAway <= 7) grouped["This Week"].push(a);
    else if (daysAway <= 14) grouped["Week 2"].push(a);
    else grouped["Week 3+"].push(a);
  });

  // Issue modal state
  const [modalIssue, setModalIssue] = useState<LocalIssue>(EMPTY_ISSUE());

  const openNewIssue = () => {
    const base = EMPTY_ISSUE();
    base.trade = selectedActivity?.trade || "";
    setModalIssue(base);
    setEditingIssue(null);
    setShowModal(true);
  };

  const openEditIssue = (issue: LocalIssue) => {
    setModalIssue({ ...issue, photos: issue.photos.map((p) => ({ ...p })) });
    setEditingIssue(issue);
    setShowModal(true);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos: LocalPhoto[] = await Promise.all(
      files.map(async (f) => {
        const compressed = await compressImage(f);
        return {
          file: compressed,
          preview: URL.createObjectURL(compressed),
          caption: "",
        };
      })
    );
    setModalIssue((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setModalIssue((prev) => {
      const photos = [...prev.photos];
      URL.revokeObjectURL(photos[idx].preview);
      photos.splice(idx, 1);
      return { ...prev, photos };
    });
  };

  const saveIssue = () => {
    if (!modalIssue.title.trim()) return;
    if (editingIssue) {
      setIssues((prev) => prev.map((iss) => (iss.id === editingIssue.id ? { ...modalIssue } : iss)));
    } else {
      setIssues((prev) => [...prev, { ...modalIssue }]);
    }
    setShowModal(false);
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((iss) => iss.id !== id));
  };

  // Upload a photo to the API
  const uploadPhoto = async (
    photo: LocalPhoto,
    projectId: string,
    reportId: string
  ): Promise<string | null> => {
    const form = new FormData();
    form.append("photo", photo.file, photo.file.name);
    try {
      const res = await fetch(`/api/projects/${projectId}/reports/${reportId}/upload-photo`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        return data.path || null;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleGenerateReport = async () => {
    if (!selectedActivity || issues.length === 0) return;
    if (!preparedBy.trim()) {
      setShowPreparedByPrompt(true);
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create the report (draft)
      const reportRes = await fetch(`/api/projects/${id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: selectedActivity.id,
          activity_name: selectedActivity.activity_name,
          trade: selectedActivity.trade,
          normalized_building: selectedActivity.normalized_building,
          prepared_by: preparedBy,
        }),
      });
      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}));
        throw new Error((errData as Record<string, string>).error || "Failed to create report");
      }
      const report = await reportRes.json();

      // Step 2: Upload photos + create issues
      for (const issue of issues) {
        // Upload photos (non-blocking — report still works without photos)
        const photoPaths: string[] = [];
        const captions: string[] = [];
        for (const photo of issue.photos) {
          try {
            const path = await uploadPhoto(photo, id, report.id);
            if (path) {
              photoPaths.push(path);
              captions.push(photo.caption);
            }
          } catch {
            // Photo upload failed — continue without this photo
            console.warn("Photo upload failed, skipping");
          }
        }

        // Create issue
        const issueRes = await fetch(`/api/projects/${id}/reports/${report.id}/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: issue.title,
            note: issue.note || null,
            location: issue.location || null,
            priority: issue.priority,
            category: issue.category,
            trade: issue.trade || null,
            potential_impact: issue.potential_impact || null,
            action_needed: issue.action_needed || null,
            photo_paths: photoPaths,
            photo_captions: captions,
          }),
        });
        if (!issueRes.ok) {
          console.warn("Issue creation failed:", await issueRes.text().catch(() => ""));
        }
      }

      // Step 3: Mark report as generated
      await fetch(`/api/projects/${id}/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "generated",
          overall_assessment: `${issues.length} issue${issues.length !== 1 ? "s" : ""} identified on ${selectedActivity.activity_name}. Priority items require prompt attention to maintain schedule and quality standards.`,
        }),
      });

      setDoneReportId(report.id);
      setDoneReportNum(report.report_number);
      setStep("done");
    } catch (err) {
      console.error("Generate report error:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!doneReportId) return;
    const url = `${window.location.origin}/projects/${id}/reports/${doneReportId}/print`;
    if (navigator.share) {
      await navigator.share({ title: `Issue Report ${doneReportNum}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25]">
        <div className="px-4 pt-4 pb-3 max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => {
              if (step === "issues") setStep("select");
              else router.back();
            }}
            className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold flex items-center gap-2">
              <ClipboardList size={18} className="text-[#F97316]" />
              Generate Report
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === "select" && "Step 1: Select Schedule Item"}
              {step === "issues" && `Step 2: Add Issues${selectedActivity ? ` — ${selectedActivity.activity_name}` : ""}`}
              {step === "done" && "Report Generated ✅"}
            </p>
          </div>
        </div>

        {/* Step progress */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(["select", "issues", "done"] as Step[]).map((s, idx) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  step === s
                    ? "#F97316"
                    : (["select", "issues", "done"].indexOf(step) > idx)
                    ? "#22C55E"
                    : "#1F1F25",
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ── STEP 1: SELECT ACTIVITY ── */}
        {step === "select" && (
          <div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search activities, trades, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
              />
            </div>

            {loadingActivities ? (
              <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
                Loading activities…
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([label, acts]) =>
                  acts.length === 0 ? null : (
                    <div key={label}>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Calendar size={12} className="text-[#F97316]" />
                        {label} ({acts.length})
                      </div>
                      <div className="space-y-2">
                        {acts.map((activity) => (
                          <button
                            key={activity.id}
                            onClick={() => {
                              setSelectedActivity(activity);
                              setStep("issues");
                            }}
                            className={`w-full text-left rounded-xl border transition-all p-4 ${
                              selectedActivity?.id === activity.id
                                ? "bg-[#F97316]/10 border-[#F97316]/50"
                                : "bg-[#121217] border-[#1F1F25] hover:border-[#F97316]/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-semibold text-sm leading-tight mb-1.5">
                                  {activity.activity_name}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  {activity.trade && (
                                    <span className="text-[11px] text-[#F97316] font-medium flex items-center gap-1">
                                      <Wrench size={10} /> {activity.trade}
                                    </span>
                                  )}
                                  {activity.normalized_building && (
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                      <Building2 size={10} /> {fmtNorm(activity.normalized_building)}
                                    </span>
                                  )}
                                  {activity.start_date && (
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                      <Calendar size={10} /> {fmt(activity.start_date)} – {fmt(activity.finish_date)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-gray-600 shrink-0 mt-0.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-sm">
                    No activities found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: ADD ISSUES ── */}
        {step === "issues" && selectedActivity && (
          <div>
            {/* Selected activity card */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 mb-6">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Schedule Item</div>
              <div className="text-white font-bold text-base leading-tight mb-2">
                {selectedActivity.activity_name}
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedActivity.trade && (
                  <span className="text-xs text-[#F97316] font-medium flex items-center gap-1">
                    <Wrench size={11} /> {selectedActivity.trade}
                  </span>
                )}
                {selectedActivity.normalized_building && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Building2 size={11} /> {fmtNorm(selectedActivity.normalized_building)}
                  </span>
                )}
                {selectedActivity.start_date && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={11} /> {fmt(selectedActivity.start_date)} – {fmt(selectedActivity.finish_date)}
                  </span>
                )}
              </div>
            </div>

            {/* Prepared by */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Prepared By (your name)
              </label>
              <input
                type="text"
                placeholder="e.g. John Smith, Superintendent"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
              />
              {showPreparedByPrompt && !preparedBy.trim() && (
                <p className="text-xs text-[#EF4444] mt-1">Please enter your name before generating the report.</p>
              )}
            </div>

            {/* Issues list */}
            {issues.length > 0 && (
              <div className="space-y-3 mb-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 flex items-start gap-3"
                  >
                    {/* Photo thumbnail */}
                    {issue.photos.length > 0 ? (
                      <div className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={issue.photos[0].preview}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover border border-[#1F1F25]"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#0B0B0D] border border-[#1F1F25] flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-gray-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="font-semibold text-white text-sm flex-1 leading-tight">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor(issue.priority)}`}>
                          {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColor(issue.category)}`}>
                          {categoryLabel(issue.category)}
                        </span>
                      </div>
                      {issue.location && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={10} /> {issue.location}
                        </div>
                      )}
                      {issue.photos.length > 0 && (
                        <div className="text-[10px] text-gray-600 mt-1">
                          {issue.photos.length} photo{issue.photos.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => openEditIssue(issue)}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1F1F25] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeIssue(issue.id)}
                        className="text-xs text-[#EF4444] hover:text-red-400 px-2 py-1 rounded bg-[#1F1F25] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add issue button */}
            <button
              onClick={openNewIssue}
              className="w-full flex items-center justify-center gap-2 bg-[#1F1F25] hover:bg-[#2a2a35] border border-[#1F1F25] hover:border-[#F97316]/30 text-gray-300 hover:text-white rounded-xl py-4 text-sm font-semibold transition-all mb-6"
            >
              <Plus size={18} className="text-[#F97316]" />
              Add Issue
            </button>

            {/* Generate button */}
            <button
              onClick={handleGenerateReport}
              disabled={issues.length === 0 || submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#ea6c10] disabled:bg-[#F97316]/40 disabled:cursor-not-allowed text-white rounded-xl py-4 text-sm font-bold transition-all"
            >
              {submitting ? (
                "Generating…"
              ) : (
                <>
                  <ClipboardList size={18} />
                  Generate Report{issues.length > 0 ? ` (${issues.length} issue${issues.length !== 1 ? "s" : ""})` : ""}
                </>
              )}
            </button>
            {issues.length === 0 && (
              <p className="text-center text-xs text-gray-600 mt-2">Add at least one issue to generate the report.</p>
            )}
          </div>
        )}

        {/* ── STEP 3: DONE ── */}
        {step === "done" && doneReportId && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 flex items-center justify-center mb-4">
              <CheckCircle size={36} className="text-[#22C55E]" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-1">Report Generated!</h2>
            <p className="text-gray-500 text-sm mb-6">{doneReportNum}</p>

            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-5 w-full text-left mb-6">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Schedule Item</div>
              <div className="text-white font-semibold mb-1">{selectedActivity?.activity_name}</div>
              <div className="text-gray-500 text-sm mb-3">
                Issue Report — {issues.length} issue{issues.length !== 1 ? "s" : ""}
              </div>
              <div className="text-xs text-gray-600">
                Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <a
                href={`/projects/${id}/reports/${doneReportId}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-xl py-3.5 text-sm font-bold transition-all"
              >
                <ExternalLink size={16} />
                Preview & Print PDF
              </a>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 hover:text-white rounded-xl py-3.5 text-sm font-semibold transition-all"
              >
                <Share2 size={16} />
                Share Report Link
              </button>
              <button
                onClick={() => router.push(`/projects/${id}`)}
                className="flex items-center justify-center gap-2 bg-[#121217] border border-[#1F1F25] text-gray-400 rounded-xl py-3.5 text-sm font-semibold transition-all hover:text-white"
              >
                Back to Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ISSUE MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-[#121217] rounded-t-2xl border-t border-[#1F1F25] max-h-[92vh] sm:max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F25] shrink-0">
              <h3 className="text-white font-bold text-base">
                {editingIssue ? "Edit Issue" : "Add Issue"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {/* Photos */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Photos
                </label>

                {/* Photo thumbnails */}
                {modalIssue.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {modalIssue.photos.map((photo, idx) => (
                      <div key={idx} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.preview}
                          alt=""
                          className="w-full h-20 object-cover rounded-lg border border-[#1F1F25]"
                        />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center"
                        >
                          <X size={10} className="text-white" />
                        </button>
                        <input
                          type="text"
                          placeholder="Caption (optional)"
                          value={photo.caption}
                          onChange={(e) => {
                            const photos = [...modalIssue.photos];
                            photos[idx] = { ...photos[idx], caption: e.target.value };
                            setModalIssue((prev) => ({ ...prev, photos }));
                          }}
                          className="mt-1 w-full bg-[#0B0B0D] border border-[#1F1F25] rounded text-[10px] text-white px-2 py-1 placeholder-gray-700 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Camera button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 bg-[#1F1F25] hover:bg-[#2a2a35] border-2 border-dashed border-[#2a2a35] hover:border-[#F97316]/40 rounded-xl py-6 transition-all"
                >
                  <Camera size={28} className="text-[#F97316]" />
                  <span className="text-sm font-semibold text-gray-400">
                    {modalIssue.photos.length > 0 ? "Add More Photos" : "Take Photo / Choose from Library"}
                  </span>
                  <span className="text-[11px] text-gray-600">Tap to open camera</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Issue Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Missing backing for grab bars"
                  value={modalIssue.title}
                  onChange={(e) => setModalIssue((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["high", "medium", "low"] as IssuePriority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setModalIssue((prev) => ({ ...prev, priority: p }))}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        modalIssue.priority === p
                          ? p === "high"
                            ? "bg-[#EF4444] text-white"
                            : p === "medium"
                            ? "bg-[#EAB308] text-black"
                            : "bg-[#22C55E] text-black"
                          : "bg-[#1F1F25] text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["qa_qc", "safety", "schedule"] as IssueCategory[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setModalIssue((prev) => ({ ...prev, category: c }))}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        modalIssue.category === c
                          ? c === "qa_qc"
                            ? "bg-[#3B82F6] text-white"
                            : c === "safety"
                            ? "bg-[#EF4444] text-white"
                            : "bg-[#F97316] text-black"
                          : "bg-[#1F1F25] text-gray-400 hover:text-white"
                      }`}
                    >
                      {categoryLabel(c)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Corridor 2, Room 102"
                  value={modalIssue.location}
                  onChange={(e) => setModalIssue((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Note (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue in detail..."
                  value={modalIssue.note}
                  onChange={(e) => setModalIssue((prev) => ({ ...prev, note: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 resize-none"
                />
              </div>

              {/* Trade */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trade</label>
                <input
                  type="text"
                  placeholder="e.g. Framing, Electrical"
                  value={modalIssue.trade}
                  onChange={(e) => setModalIssue((prev) => ({ ...prev, trade: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                />
              </div>

              {/* Potential impact */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Potential Impact (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delays Drywall Install"
                  value={modalIssue.potential_impact}
                  onChange={(e) => setModalIssue((prev) => ({ ...prev, potential_impact: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                />
              </div>

              {/* Action needed */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Action Needed (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Install backing ASAP"
                  value={modalIssue.action_needed}
                  onChange={(e) => setModalIssue((prev) => ({ ...prev, action_needed: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
                />
              </div>
            </div>

            {/* Modal footer — sticky save button */}
            <div className="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[#1F1F25] shrink-0 bg-[#121217]">
              <button
                onClick={saveIssue}
                disabled={!modalIssue.title.trim()}
                className="w-full bg-[#F97316] hover:bg-[#ea6c10] disabled:bg-[#F97316]/40 disabled:cursor-not-allowed text-white rounded-xl py-4 text-base font-bold transition-all"
              >
                ✓ {editingIssue ? "Update Issue" : "Save Issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
