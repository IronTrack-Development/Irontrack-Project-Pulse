/**
 * IronTrack Schedule Simulator — API Route
 * POST /api/schedule-generator
 *
 * Accepts ScheduleInput JSON, returns GeneratedSchedule JSON.
 * Auth required (handled by middleware).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateSchedule, ScheduleInput } from '@/lib/schedule-engine';

export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse & validate input ──────────────────────────────────────────────────
  let input: ScheduleInput;
  try {
    input = (await request.json()) as ScheduleInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationError = validateInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // ── Generate schedule ───────────────────────────────────────────────────────
  try {
    const schedule = generateSchedule(input);
    return NextResponse.json(schedule, { status: 200 });
  } catch (err) {
    console.error('[schedule-generator] Engine error:', err);
    return NextResponse.json(
      { error: 'Schedule generation failed', details: String(err) },
      { status: 500 }
    );
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateInput(input: ScheduleInput): string | null {
  if (!input.projectName || typeof input.projectName !== 'string') {
    return 'projectName is required';
  }
  if (!input.buildingType || typeof input.buildingType !== 'string') {
    return 'buildingType is required';
  }
  if (typeof input.totalSF !== 'number' || input.totalSF <= 0) {
    return 'totalSF must be a positive number';
  }
  if (typeof input.stories !== 'number' || input.stories < 1) {
    return 'stories must be >= 1';
  }
  if (typeof input.isGroundUp !== 'boolean') {
    return 'isGroundUp must be a boolean';
  }
  if (!Array.isArray(input.selectedTrades) || input.selectedTrades.length === 0) {
    return 'selectedTrades must be a non-empty array';
  }
  if (!input.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return 'startDate must be in YYYY-MM-DD format';
  }
  return null;
}
