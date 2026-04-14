import type { Metadata } from "next";
import { getServiceClient } from "@/lib/supabase";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: project } = await supabase
    .from("daily_projects")
    .select("name, client_name, health_score")
    .eq("id", id)
    .single();

  const projectName = project?.name || "Project";
  const clientName = project?.client_name || "";
  const healthScore = project?.health_score ?? 0;

  const statusWord =
    healthScore >= 85 ? "On Track" : healthScore >= 70 ? "At Risk" : "Critical";

  const title = `${projectName} — IronTrack Pulse`;
  const description = clientName
    ? `${projectName} by ${clientName} • ${statusWord} • Managed with IronTrack Project Pulse`
    : `${projectName} • ${statusWord} • Managed with IronTrack Project Pulse`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: "/og-share-card.png",
          width: 1536,
          height: 1024,
          alt: `${projectName} — IronTrack Pulse`,
        },
      ],
      type: "website",
      siteName: "IronTrack Project Pulse",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: "/og-share-card.png",
          width: 1536,
          height: 1024,
          alt: `${projectName} — IronTrack Pulse`,
        },
      ],
    },
  };
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
