import { NextRequest, NextResponse } from "next/server";

interface AIDraftRequest {
  rough_description: string;
  photo_urls?: string[];
}

interface AIDraftResponse {
  subject: string;
  question: string;
  spec_section: string;
  cost_impact: boolean;
  schedule_impact: boolean;
}

// POST /api/projects/[id]/rfis/ai-draft
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // ensure params resolved

  const body = (await req.json()) as AIDraftRequest;
  const { rough_description } = body;

  if (!rough_description || rough_description.trim().length < 5) {
    return NextResponse.json({ error: "rough_description is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI drafting not configured (missing ANTHROPIC_API_KEY)" }, { status: 503 });
  }

  const systemPrompt = `You are an experienced construction superintendent with 20+ years on commercial projects. Your job is to write clear, professional RFIs (Requests for Information) to architects and engineers.

When given a rough field description, you:
1. Write a concise, specific subject line (10 words max)
2. Write a formal question that is direct and actionable — architects hate long RFIs
3. Suggest the most likely spec section (e.g., "03 30 00 - Cast-in-Place Concrete") if identifiable from the description
4. Assess whether the issue is likely to impact cost or schedule

Rules:
- Do NOT add information that wasn't in the description
- Maintain the superintendent's intent exactly
- Use professional construction terminology
- The question should end with a clear request for a decision or clarification
- Keep the question under 5 sentences
- If spec section is unclear, return an empty string

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "subject": "string",
  "question": "string", 
  "spec_section": "string",
  "cost_impact": boolean,
  "schedule_impact": boolean
}`;

  const userMessage = `Write a professional RFI based on this field note from the superintendent:

"${rough_description}"

Return only the JSON object.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[ai-draft] Claude error:", err);
    return NextResponse.json({ error: "AI service error" }, { status: 502 });
  }

  const claudeData = await response.json();
  const rawText = claudeData?.content?.[0]?.text || "";

  let draft: AIDraftResponse;
  try {
    // Strip any markdown code fences if present
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    draft = JSON.parse(cleaned) as AIDraftResponse;
  } catch {
    console.error("[ai-draft] Failed to parse Claude response:", rawText);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(draft);
}
