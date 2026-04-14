"use client";

import { useEffect } from "react";
import Link from "next/link";
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
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, fontSize: "14px" }}>
          {report.report_number} — {report.activity_name}
        </span>
        <Link
          href={`/projects/${projectId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "6px", fontSize: "13px",
            fontWeight: 600, color: "white", textDecoration: "none",
            background: "rgba(255,255,255,0.15)",
          }}
        >
          ← Back to Project
        </Link>
        <button
          onClick={() => window.print()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "6px", fontSize: "13px",
            fontWeight: 600, color: "white", cursor: "pointer",
            background: "#F97316", border: "none",
          }}
        >
          🖨 Print / Save as PDF
        </button>
      </div>

      {/* Document */}
      <div style={{ maxWidth: "8.5in", margin: "0 auto", padding: "0.5in" }}>
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
          <h1 style={{ fontSize: "22pt", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
            Issue Report
          </h1>
          <span style={{ fontSize: "11pt", color: "#93c5fd", fontWeight: 600 }}>
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
            padding: "16px 20px",
            marginBottom: "28px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 24px",
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
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "10.5pt" }}>
              <span style={{ color: "#4b5563", fontWeight: 600, minWidth: "110px", whiteSpace: "nowrap" }}>
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
                  {["#", "Issue Title", "Location", "Category", "Priority", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        background: "#1e3a5f",
                        color: "white",
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "9.5pt",
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
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 700, color: "#1e3a5f" }}>
                      {String(issue.issue_number).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
                      {issue.title}
                    </td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
                      {issue.location || "—"}
                    </td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
                      {categoryLabel(issue.category)}
                    </td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "3px",
                          fontSize: "9pt",
                          fontWeight: 700,
                          color: "white",
                          background: priorityColor(issue.priority),
                        }}
                      >
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid #e5e7eb", color: "#4b5563", textTransform: "capitalize" }}>
                      {issue.status.replace("_", " ")}
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
                <div style={{ padding: "16px", display: "grid", gridTemplateColumns: issue.photoUrls?.length > 0 ? "1fr 240px" : "1fr", gap: "20px", alignItems: "start" }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {issue.photoUrls.filter(Boolean).map((url: string, idx: number) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Issue photo ${idx + 1}`}
                            style={{
                              width: "220px",
                              maxWidth: "220px",
                              height: "auto",
                              border: "1.5px solid #d1d5db",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                          />
                          {issue.photo_captions?.[idx] && (
                            <span style={{ fontSize: "8.5pt", color: "#6b7280", fontStyle: "italic", textAlign: "center" }}>
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
  );
}
