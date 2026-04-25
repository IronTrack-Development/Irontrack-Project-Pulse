"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MarkupCanvas from "@/components/markup/MarkupCanvas";
import type { MarkupAction } from "@/components/markup/MarkupCanvas";
import type { IssueReport, ReportIssue, IssuePriority, IssueCategory } from "@/types";

interface IssueWithPhotos extends ReportIssue {
  photoUrls: string[];
}

interface Props {
  report: IssueReport;
  issues: IssueWithPhotos[];
  projectId: string;
}

function priorityColor(priority: IssuePriority): string {
  switch (priority) {
    case "high": return "#DC2626";
    case "medium": return "#D97706";
    case "low": return "#16A34A";
    default: return "#6B7280";
  }
}

function categoryLabel(cat: IssueCategory): string {
  switch (cat) {
    case "qa_qc": return "QA/QC";
    case "safety": return "Safety";
    case "schedule": return "Schedule";
    default: return cat;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtNorm(val?: string | null): string {
  if (!val) return "";
  return val.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function PrintClient({ report, issues, projectId }: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [markupCapturing, setMarkupCapturing] = useState(false);
  const [markupActive, setMarkupActive] = useState(false);
  const [markupScreenshot, setMarkupScreenshot] = useState<string | null>(null);
  const [markedUpUrl, setMarkedUpUrl] = useState<string | null>(null);

  const startMarkup = async () => {
    const el = docRef.current;
    if (!el) return;
    setMarkupCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: true,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        logging: false,
        backgroundColor: "#ffffff",
      } as any);
      setMarkupScreenshot(canvas.toDataURL("image/jpeg", 0.92));
      setMarkupActive(true);
    } catch (err) {
      console.warn("Markup capture failed:", err);
      setMarkupScreenshot("");
      setMarkupActive(true);
    } finally {
      setMarkupCapturing(false);
    }
  };

  const handleMarkupDone = (compositeUrl: string, _actions: MarkupAction[]) => {
    setMarkedUpUrl(compositeUrl);
    setMarkupActive(false);
    setMarkupScreenshot(null);
  };

  const handleMarkupCancel = () => {
    setMarkupActive(false);
    setMarkupScreenshot(null);
  };

  useEffect(() => {
    // Inject print styles into document head
    const style = document.createElement("style");
    style.id = "print-page-styles";
    style.textContent = `
      @media print {
        @page { size: letter; margin: 0.5in; }
        body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print, nav, header, aside { display: none !important; }
        .print-overlay { position: static !important; z-index: auto !important; }
        .print-controls { display: none !important; }
        .print-page-break { page-break-before: always; }
        .print-avoid-break { page-break-inside: avoid; }
        .print-doc { padding: 0 !important; }
      }
      @media screen and (max-width: 640px) {
        .print-doc { padding: 12px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById("print-page-styles");
      if (existing) existing.remove();
    };
  }, []);

  const reportDate = formatDate(report.report_date);
  const generatedAt = formatDate(new Date().toISOString());

  return (
    <>
    <div
      className="print-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "white",
        zIndex: 9999,
        overflowY: "auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        color: "#1a1a1a",
      }}
    >
      {/* Controls — hidden on print */}
      <div
        className="print-controls no-print"
        style={{
          background: "#1e3a5f",
          color: "white",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          flexWrap: "wrap",
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, fontSize: "13px", minWidth: "100px" }}>
          {report.report_number}
        </span>
        <Link
          href={`/projects/${projectId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
            fontWeight: 600, color: "white", textDecoration: "none",
            background: "rgba(255,255,255,0.15)",
          }}
        >
          ← Back
        </Link>
        <button
          onClick={() => window.print()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
            fontWeight: 600, color: "white", cursor: "pointer",
            background: "#F97316", border: "none",
          }}
        >
          🖨 Print PDF
        </button>
        <button
          onClick={startMarkup}
          disabled={markupCapturing}
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
            fontWeight: 600, color: "white",
            cursor: markupCapturing ? "wait" : "pointer",
            background: markedUpUrl ? "#7C3AED" : "#7C3AED",
            border: "none",
            opacity: markupCapturing ? 0.6 : 1,
          }}
        >
          {markupCapturing ? "⏳ Capturing…" : markedUpUrl ? "✏️ Re-markup" : "✏️ Markup"}
        </button>
        {markedUpUrl && (
          <a
            href={markedUpUrl}
            download={`${report.report_number}-markup.jpg`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
              fontWeight: 600, color: "white", textDecoration: "none",
              background: "#16A34A", border: "none",
            }}
          >
            ⬇ Save Markup
          </a>
        )}
        <button
          onClick={async () => {
            const url = window.location.href;
            const title = `Issue Report ${report.report_number} — ${report.activity_name}`;
            if (navigator.share) {
              try {
                await navigator.share({ title, url });
              } catch {
                // User cancelled — ignore
              }
            } else {
              try {
                await navigator.clipboard.writeText(url);
                const btn = document.getElementById('share-btn');
                if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '🔗 Share'; }, 2000); }
              } catch {
                prompt('Copy this link:', url);
              }
            }
          }}
          id="share-btn"
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
            fontWeight: 600, color: "white", cursor: "pointer",
            background: "#3B82F6", border: "none",
          }}
        >
          🔗 Share
        </button>
      </div>

      {/* Marked-up image preview */}
      {markedUpUrl && (
        <div style={{
          background: "#f5f3ff", borderBottom: "3px solid #7C3AED",
          padding: "12px 16px",
        }}>
          <div style={{ fontSize: "12px", color: "#7C3AED", fontWeight: 700, marginBottom: "8px" }}>
            ✏️ Markup applied — download or print below
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={markedUpUrl}
            alt="Marked-up report"
            style={{ maxWidth: "100%", borderRadius: "4px", border: "1px solid #c4b5fd" }}
          />
        </div>
      )}

      {/* Document */}
      <div ref={docRef} style={{ maxWidth: "8.5in", margin: "0 auto", padding: "16px" }}>
        {/* Header bar */}
        <div
          style={{
            background: "#1e3a5f",
            color: "white",
            padding: "18px 24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "2px",
          }}
        >
          <h1 style={{ fontSize: "16pt", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
            Issue Report
          </h1>
          <span style={{ fontSize: "10pt", color: "#93c5fd", fontWeight: 600 }}>
            {report.report_number}
          </span>
        </div>

        {/* Project title */}
        <div style={{ fontSize: "16pt", fontWeight: 700, color: "#1a1a1a", marginBottom: "16px" }}>
          {report.project_name ? `${report.project_name} Project` : "Project Issue Report"}
        </div>

        {/* Info box */}
        <div
          style={{
            border: "1.5px solid #1e3a5f",
            borderRadius: "4px",
            padding: "12px 16px",
            marginBottom: "24px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "6px",
          }}
        >
          {[
            ["Schedule Item", report.activity_name],
            ["Report Number", report.report_number],
            ["Date", reportDate],
            report.trade ? ["Trade", report.trade] : null,
            report.prepared_by ? ["Prepared By", report.prepared_by] : null,
            report.normalized_building ? ["Location", fmtNorm(report.normalized_building)] : null,
            ["Summary", `${report.issue_count} Issue${report.issue_count !== 1 ? "s" : ""} Identified`],
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "10pt" }}>
              <span style={{ color: "#4b5563", fontWeight: 600, minWidth: "90px", whiteSpace: "nowrap" }}>
                {row![0]}:
              </span>
              <span
                style={{
                  color: row![0] === "Summary" ? "#DC2626" : "#1a1a1a",
                  fontWeight: row![0] === "Summary" ? 700 : 500,
                }}
              >
                {row![1]}
              </span>
            </div>
          ))}
        </div>

        {/* Issue Summary Table */}
        {issues.length > 0 && (
          <>
            <div style={{ fontSize: "12pt", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", borderBottom: "2px solid #1e3a5f", paddingBottom: "4px" }}>
              Issue Summary
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "28px",
                fontSize: "10pt",
              }}
            >
              <thead>
                <tr>
                  {["#", "Issue", "Location", "Priority"].map((h) => (
                    <th
                      key={h}
                      style={{
                        background: "#1e3a5f",
                        color: "white",
                        padding: "6px 8px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "8.5pt",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, rowIdx) => (
                  <tr key={issue.id} style={{ background: rowIdx % 2 === 1 ? "#f9fafb" : "white" }}>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid #e5e7eb", fontWeight: 700, color: "#1e3a5f", fontSize: "9pt" }}>
                      {String(issue.issue_number).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "9pt" }}>
                      {issue.title}
                    </td>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid #e5e7eb", color: "#4b5563", fontSize: "9pt" }}>
                      {issue.location || "—"}
                    </td>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid #e5e7eb" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontSize: "8pt",
                          fontWeight: 700,
                          color: "white",
                          background: priorityColor(issue.priority),
                        }}
                      >
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Issue Detail Cards */}
        {issues.length > 0 && (
          <>
            <div style={{ fontSize: "12pt", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", borderBottom: "2px solid #1e3a5f", paddingBottom: "4px" }}>
              Issue Details
            </div>

            {issues.map((issue) => (
              <div
                key={issue.id}
                className="print-avoid-break"
                style={{
                  border: "1.5px solid #d1d5db",
                  borderRadius: "4px",
                  marginBottom: "24px",
                  overflow: "hidden",
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    background: "#1e3a5f",
                    color: "white",
                    padding: "10px 16px",
                    fontSize: "11pt",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Issue {String(issue.issue_number).padStart(2, "0")}: {issue.title}
                </div>

                {/* Card body */}
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Details */}
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: "12px" }}>
                      {issue.location && (
                        <div>
                          <div style={{ fontSize: "8.5pt", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Location</div>
                          <div style={{ fontSize: "10.5pt", color: "#1a1a1a", fontWeight: 500 }}>{issue.location}</div>
                        </div>
                      )}
                      {issue.trade && (
                        <div>
                          <div style={{ fontSize: "8.5pt", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Trade</div>
                          <div style={{ fontSize: "10.5pt", color: "#1a1a1a", fontWeight: 500 }}>{issue.trade}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "8.5pt", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Priority</div>
                        <div style={{ fontSize: "10.5pt", color: priorityColor(issue.priority), fontWeight: 700 }}>
                          {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "8.5pt", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Category</div>
                        <div style={{ fontSize: "10.5pt", color: "#1a1a1a", fontWeight: 500 }}>{categoryLabel(issue.category)}</div>
                      </div>
                      {issue.potential_impact && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "8.5pt", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Potential Impact</div>
                          <div style={{ fontSize: "10.5pt", color: "#1a1a1a", fontWeight: 500 }}>{issue.potential_impact}</div>
                        </div>
                      )}
                      {issue.action_needed && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "8.5pt", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Action Needed</div>
                          <div style={{ fontSize: "10.5pt", color: "#DC2626", fontWeight: 600 }}>{issue.action_needed}</div>
                        </div>
                      )}
                    </div>
                    {issue.note && (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "#f8fafc",
                          borderLeft: "3px solid #1e3a5f",
                          fontSize: "10.5pt",
                          color: "#374151",
                          borderRadius: "0 4px 4px 0",
                        }}
                      >
                        {issue.note}
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {issue.photoUrls && issue.photoUrls.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {issue.photoUrls.filter(Boolean).map((url: string, idx: number) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Issue photo ${idx + 1}`}
                            style={{
                              width: "100%",
                              maxWidth: "280px",
                              height: "auto",
                              border: "1.5px solid #d1d5db",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                          />
                          {issue.photo_captions?.[idx] && (
                            <span style={{ fontSize: "8.5pt", color: "#6b7280", fontStyle: "italic" }}>
                              {issue.photo_captions[idx]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Overall Assessment */}
        {report.overall_assessment && (
          <div
            className="print-avoid-break"
            style={{
              border: "1.5px solid #d1d5db",
              borderRadius: "4px",
              padding: "16px 20px",
              marginBottom: "24px",
              background: "#fffbeb",
            }}
          >
            <div style={{ fontSize: "10pt", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Overall Assessment
            </div>
            <div style={{ fontSize: "10.5pt", color: "#374151", lineHeight: 1.6 }}>
              {report.overall_assessment}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            height: "3px",
            background: "linear-gradient(to right, #F97316, #1e3a5f)",
            marginBottom: "12px",
            borderRadius: "2px",
          }}
        />
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "8.5pt" }}>
          <p>
            Generated by: {report.prepared_by || "Field Superintendent"} &nbsp;·&nbsp; Date: {generatedAt}
          </p>
          <p style={{ marginTop: "4px" }}>Powered by IronTrack Project Pulse</p>
        </div>
      </div>
    </div>

    {/* Fullscreen markup canvas */}
    {markupActive && markupScreenshot !== null && (
      <MarkupCanvas
        backgroundImageUrl={markupScreenshot || undefined}
        onDone={handleMarkupDone}
        onCancel={handleMarkupCancel}
      />
    )}
    </>
  );
}
