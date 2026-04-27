import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// ─── Simple in-memory rate limiter ────────────────────────────────────────────
// Max 3 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 3) return false;

  entry.count++;
  return true;
}

// Clean up old entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

// ─── Cost helpers ──────────────────────────────────────────────────────────────
// claude-haiku-4-5: $1/M input, $5/M output
function inputCostCents(tokens: number): number {
  return Math.ceil((tokens / 1_000_000) * 100); // $1 per 1M = 100 cents per 1M
}

function outputCostCents(tokens: number): number {
  return Math.ceil((tokens / 1_000_000) * 500); // $5 per 1M = 500 cents per 1M
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ─── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 3 requests per minute." },
      { status: 429 }
    );
  }

  // Parse body
  let activities: string[];
  try {
    const body = await req.json();
    activities = body.activities;
    if (!Array.isArray(activities)) throw new Error("activities must be an array");
    if (activities.length === 0) {
      return NextResponse.json({ translations: {}, cached: 0, translated: 0 });
    }
    if (activities.length > 500) {
      return NextResponse.json(
        { error: "Max 500 activities per request." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const db = getServiceClient();
  const uniqueNames = [...new Set(activities.filter((n) => typeof n === "string" && n.trim()))];

  // ── 1. Check cache ─────────────────────────────────────────────────────────
  const { data: cached } = await db
    .from("activity_translations")
    .select("original_text, translated_text")
    .in("original_text", uniqueNames)
    .eq("language", "es");

  const translationMap: Record<string, string> = {};
  const cachedSet = new Set<string>();

  for (const row of cached ?? []) {
    translationMap[row.original_text] = row.translated_text;
    cachedSet.add(row.original_text);
  }

  const uncached = uniqueNames.filter((n) => !cachedSet.has(n));

  // If everything is cached, return immediately
  if (uncached.length === 0) {
    return NextResponse.json({
      translations: translationMap,
      cached: cachedSet.size,
      translated: 0,
    });
  }

  // ── 2. Check spending cap BEFORE calling API ───────────────────────────────
  const month = currentMonth();
  const { data: usageRow } = await db
    .from("api_usage_tracking")
    .select("estimated_cost_cents")
    .eq("service", "anthropic")
    .eq("month", month)
    .maybeSingle();

  const currentCostCents = usageRow?.estimated_cost_cents ?? 0;

  if (currentCostCents >= 500) {
    // Return cached translations + English fallback for uncached
    // (never show blank — fall back to English per rules)
    for (const name of uncached) {
      translationMap[name] = name; // English fallback
    }
    return NextResponse.json(
      {
        translations: translationMap,
        cached: cachedSet.size,
        translated: 0,
        budgetError:
          "Monthly translation budget reached. Translations will reset next month.",
      },
      { status: 402 }
    );
  }

  // ── 3. Call Claude Haiku ──────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Graceful fallback — return English if no API key configured
    for (const name of uncached) translationMap[name] = name;
    return NextResponse.json({ translations: translationMap, cached: cachedSet.size, translated: 0 });
  }

  let inputTokens = 0;
  let outputTokens = 0;
  let newTranslations: Record<string, string> = {};

  try {
    const systemPrompt =
      "You are a construction industry translator. Translate the following construction schedule activity names from English to Spanish. Use terminology that bilingual construction crews in the US actually use on jobsites. Keep trade-specific English terms that are commonly used in Spanish-speaking crews (e.g., 'Roughin' stays as 'Roughin', 'Drywall' can stay as 'Drywall'). Return ONLY a JSON object mapping each English name to its Spanish translation.";

    const userMessage = JSON.stringify(uncached);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      // Graceful fallback
      for (const name of uncached) translationMap[name] = name;
      return NextResponse.json({ translations: translationMap, cached: cachedSet.size, translated: 0 });
    }

    const anthropicData = await response.json();

    inputTokens = anthropicData.usage?.input_tokens ?? 0;
    outputTokens = anthropicData.usage?.output_tokens ?? 0;

    // Parse the translation JSON from the response
    const rawContent: string = anthropicData.content?.[0]?.text ?? "{}";

    // Strip markdown code fences if present
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

    try {
      newTranslations = JSON.parse(cleaned);
    } catch {
      // If parsing fails, fall back to English for all uncached
      console.error("Failed to parse Claude response as JSON:", cleaned);
      for (const name of uncached) translationMap[name] = name;
    }

    // Merge new translations (with English fallback for any missing)
    for (const name of uncached) {
      translationMap[name] = newTranslations[name] ?? name;
    }
  } catch (err) {
    console.error("Translation API call failed:", err);
    // Graceful fallback
    for (const name of uncached) translationMap[name] = name;
    return NextResponse.json({ translations: translationMap, cached: cachedSet.size, translated: 0 });
  }

  // ── 4. Persist new translations to cache ──────────────────────────────────
  const validTranslations = Object.entries(newTranslations)
    .filter(([orig]) => uncached.includes(orig))
    .map(([original_text, translated_text]) => ({
      original_text,
      language: "es",
      translated_text: String(translated_text),
    }));

  if (validTranslations.length > 0) {
    const { error: insertError } = await db
      .from("activity_translations")
      .upsert(validTranslations, { onConflict: "original_text,language" });

    if (insertError) {
      console.error("Failed to cache translations:", insertError);
    }
  }

  // ── 5. Update spending tracker ─────────────────────────────────────────────
  const addedCostCents = inputCostCents(inputTokens) + outputCostCents(outputTokens);

  if (addedCostCents > 0) {
    try {
      // Try the RPC first; if it doesn't exist, fall back to a manual upsert
      const { error: rpcError } = await db.rpc("increment_api_usage", {
        p_service: "anthropic",
        p_month: month,
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        p_cost_cents: addedCostCents,
      });

      if (rpcError) {
        // Fallback: upsert manually
        const { data: existing } = await db
          .from("api_usage_tracking")
          .select("id, total_input_tokens, total_output_tokens, estimated_cost_cents")
          .eq("service", "anthropic")
          .eq("month", month)
          .maybeSingle();

        if (existing) {
          await db
            .from("api_usage_tracking")
            .update({
              total_input_tokens: existing.total_input_tokens + inputTokens,
              total_output_tokens: existing.total_output_tokens + outputTokens,
              estimated_cost_cents: existing.estimated_cost_cents + addedCostCents,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await db.from("api_usage_tracking").insert({
            service: "anthropic",
            month,
            total_input_tokens: inputTokens,
            total_output_tokens: outputTokens,
            estimated_cost_cents: addedCostCents,
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Failed to update API usage tracking:", err);
    }
  }

  return NextResponse.json({
    translations: translationMap,
    cached: cachedSet.size,
    translated: validTranslations.length,
  });
}
