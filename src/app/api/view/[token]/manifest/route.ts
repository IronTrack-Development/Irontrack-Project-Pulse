import { NextRequest, NextResponse } from "next/server";

// Dynamic PWA manifest for sub view pages
// When a foreman adds their schedule link to home screen, this manifest
// ensures the PWA opens to their specific token URL, not the root landing page.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;

  const manifest = {
    name: "IronTrack Pulse",
    short_name: "Pulse",
    description: "Your project schedule — IronTrack Project Pulse",
    start_url: `${baseUrl}/view/${token}`,
    scope: `${baseUrl}/view/${token}`,
    display: "standalone",
    background_color: "#0B0B0D",
    theme_color: "#0B0B0D",
    icons: [
      { src: `${baseUrl}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${baseUrl}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
