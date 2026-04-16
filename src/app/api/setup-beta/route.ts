import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceClient();
  const results: { email: string; status: string; error?: string }[] = [];

  const accounts = [];
  for (let i = 6; i <= 15; i++) {
    accounts.push({ email: `beta${i}@irontrackpulse.com`, name: `Beta Tester ${i}` });
  }

  for (const account of accounts) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: 'IronTrack2026!',
      email_confirm: true,
      user_metadata: { name: account.name },
    });

    if (error) {
      results.push({ email: account.email, status: 'failed', error: error.message });
      continue;
    }

    if (data.user) {
      const { error: subError } = await supabase.from('user_subscriptions').upsert({
        user_id: data.user.id,
        status: 'active',
        trial_ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id' });

      results.push({
        email: account.email,
        status: subError ? 'user created, subscription failed' : 'success',
        error: subError?.message,
      });
    }
  }

  return NextResponse.json({ results });
}
