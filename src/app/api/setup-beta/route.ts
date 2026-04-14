import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceClient();
  const results: { email: string; status: string; error?: string }[] = [];

  // First, clean up the manually inserted users
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const betaUsers = existingUsers?.users?.filter(u => u.email?.startsWith('beta') && u.email?.endsWith('@irontrackpulse.com')) || [];
  
  for (const user of betaUsers) {
    await supabase.auth.admin.deleteUser(user.id);
  }

  // Also clean up any orphaned subscriptions
  await supabase.from('user_subscriptions').delete().in(
    'user_id',
    betaUsers.map(u => u.id)
  );

  // Now create users properly through the Admin API
  const accounts = [
    { email: 'beta1@irontrackpulse.com', name: 'Beta Tester 1' },
    { email: 'beta2@irontrackpulse.com', name: 'Beta Tester 2' },
    { email: 'beta3@irontrackpulse.com', name: 'Beta Tester 3' },
    { email: 'beta4@irontrackpulse.com', name: 'Beta Tester 4' },
    { email: 'beta5@irontrackpulse.com', name: 'Beta Tester 5' },
  ];

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
      // Create active subscription (2 month beta)
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
