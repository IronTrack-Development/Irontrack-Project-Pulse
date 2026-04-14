import { getServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PrintClient from "./PrintClient";

interface PrintParams {
  params: Promise<{ id: string; reportId: string }>;
}

async function getPhotoUrl(path: string): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase.storage
    .from("report-photos")
    .createSignedUrl(path, 60 * 60 * 2); // 2-hour URL for print
  return data?.signedUrl || "";
}

export default async function PrintReportPage({ params }: PrintParams) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();

  const { data: report, error } = await supabase
    .from("issue_reports")
    .select("*")
    .eq("id", reportId)
    .eq("project_id", id)
    .single();

  if (error || !report) return notFound();

  const { data: issues } = await supabase
    .from("report_issues")
    .select("*")
    .eq("report_id", reportId)
    .order("issue_number", { ascending: true });

  const allIssues = issues || [];

  // Resolve photo URLs server-side
  const issuesWithPhotos = await Promise.all(
    allIssues.map(async (issue) => {
      const photoUrls = await Promise.all(
        (issue.photo_paths || []).map((p: string) => getPhotoUrl(p))
      );
      return { ...issue, photoUrls };
    })
  );

  return (
    <PrintClient
      report={report}
      issues={issuesWithPhotos}
      projectId={id}
    />
  );
}
