import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceClient();
  const results: { email: string; status: string; error?: string }[] = [];

  // Get all beta users 6-15
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const betaUsers = allUsers?.users?.filter(u => {
    if (!u.email) return false;
    const match = u.email.match(/^beta(\d+)@irontrackpulse\.com$/);
    if (!match) return false;
    const num = parseInt(match[1]);
    return num >= 6 && num <= 15;
  }) || [];

  for (const user of betaUsers) {
    // Reset password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'IronTrack2026!',
      email_confirm: true,
    });

    if (updateError) {
      results.push({ email: user.email!, status: 'password reset failed', error: updateError.message });
      continue;
    }

    // Ensure subscription exists
    const { error: subError } = await supabase.from('user_subscriptions').upsert({
      user_id: user.id,
      status: 'active',
      trial_ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'user_id' });

    results.push({
      email: user.email!,
      status: subError ? 'password reset, subscription failed' : 'success - password reset + subscription active',
      error: subError?.message,
    });
  }

  if (betaUsers.length === 0) {
    return NextResponse.json({ message: 'No beta6-15 users found', results: [] });
  }

  return NextResponse.json({ results });
}
