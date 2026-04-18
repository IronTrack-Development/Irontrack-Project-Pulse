/**
 * Extracts and formats a human-readable timestamp from a Supabase Storage photo URL.
 *
 * Storage path format: .../project_id/sub_id/date/1713400000000-abc123.jpg
 * The filename starts with a 13-digit Unix millisecond timestamp.
 */
export function extractPhotoTimestamp(url: string): string | null {
  // URL format: .../project_id/sub_id/date/1713400000000-abc123.jpg
  const match = url.match(/\/(\d{13})-/);
  if (!match) return null;
  const ts = parseInt(match[1]);
  if (isNaN(ts)) return null;
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
