import { randomBytes } from "crypto";

/**
 * Generates a URL-safe random token using crypto.randomBytes.
 * Default: 32 bytes → 43-char base64url string (no padding).
 * Safe to use in URLs without encoding.
 */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
