/** Tiny className joiner — avoids pulling clsx for simple cases */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
