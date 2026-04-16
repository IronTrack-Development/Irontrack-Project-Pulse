import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { webpush } from '@/lib/web-push';

interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Activity {
  id: string;
  project_id: string;
  activity_name: string;
  trade: string | null;
  start_date: string | null;
  finish_date: string | null;
  status: string;
  percent_complete: number;
  predecessor_ids: string[] | null;
}

interface Project {
  id: string;
  name: string;
  user_id: string;
}

/**
 * GET /api/notifications/check?clientDate=YYYY-MM-DD
 *
 * Checks for:
 *   1. Inspections tomorrow with incomplete predecessors
 *   2. Activities behind schedule (overdue and incomplete)
 *
 * Sends web push notifications to subscribed users.
 * Deduplicates: one notification per activity per user per day.
 *
 * Works as both a user-triggered check (from dashboard) and a Vercel cron job.
 */
export async function GET(req: NextRequest) {
  const service = getServiceClient();

  // Resolve "today" from client-supplied date for timezone correctness,
  // falling back to server UTC.
  const url = new URL(req.url);
  const clientDateParam = url.searchParams.get('clientDate');
  const today = clientDateParam && /^\d{4}-\d{2}-\d{2}$/.test(clientDateParam)
    ? clientDateParam
    : new Date().toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const summary = {
    date: today,
    inspectionAlerts: 0,
    behindScheduleAlerts: 0,
    notificationsSent: 0,
    errors: 0,
  };

  // ── 1. Fetch all users with active push subscriptions ─────────────────────
  const { data: subscriptions, error: subError } = await service
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');

  if (subError) {
    console.error('[check] Error fetching subscriptions:', subError);
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ...summary, message: 'No subscribers' });
  }

  // Group subscriptions by user_id
  const subsByUser: Record<string, PushSubscriptionRow[]> = {};
  for (const sub of subscriptions as PushSubscriptionRow[]) {
    if (!subsByUser[sub.user_id]) subsByUser[sub.user_id] = [];
    subsByUser[sub.user_id].push(sub);
  }

  const userIds = Object.keys(subsByUser);

  // ── 2. Fetch projects for subscribed users ────────────────────────────────
  const { data: projects, error: projError } = await service
    .from('daily_projects')
    .select('id, name, user_id')
    .in('user_id', userIds);

  if (projError) {
    console.error('[check] Error fetching projects:', projError);
    return NextResponse.json({ error: projError.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
    return NextResponse.json({ ...summary, message: 'No projects for subscribers' });
  }

  const projectIds = (projects as Project[]).map((p) => p.id);
  const projectMap: Record<string, Project> = {};
  for (const p of projects as Project[]) projectMap[p.id] = p;

  // ── 3. Trigger 1: Inspections tomorrow with incomplete predecessors ────────
  const { data: inspections } = await service
    .from('parsed_activities')
    .select('id, project_id, activity_name, trade, start_date, finish_date, status, percent_complete, predecessor_ids')
    .in('project_id', projectIds)
    .eq('trade', 'Inspection')
    .eq('start_date', tomorrowStr)
    .neq('status', 'complete');

  // ── 4. Trigger 2: Activities behind schedule ──────────────────────────────
  const { data: overdueActivities } = await service
    .from('parsed_activities')
    .select('id, project_id, activity_name, trade, start_date, finish_date, status, percent_complete, predecessor_ids')
    .in('project_id', projectIds)
    .lt('finish_date', today)
    .neq('status', 'complete')
    .lt('percent_complete', 100);

  // ── 5. Collect all predecessor IDs we need to look up ────────────────────
  const allPredecessorIds: string[] = [];
  for (const inspection of (inspections as Activity[]) || []) {
    if (inspection.predecessor_ids?.length) {
      allPredecessorIds.push(...inspection.predecessor_ids);
    }
  }

  // Fetch predecessor activities if needed
  const predecessorMap: Record<string, Activity> = {};
  if (allPredecessorIds.length > 0) {
    const { data: predecessors } = await service
      .from('parsed_activities')
      .select('id, project_id, activity_name, trade, start_date, finish_date, status, percent_complete, predecessor_ids')
      .in('id', allPredecessorIds);

    for (const pred of (predecessors as Activity[]) || []) {
      predecessorMap[pred.id] = pred;
    }
  }

  // ── 6. Build notification queue ───────────────────────────────────────────
  type NotificationJob = {
    userId: string;
    activityId: string;
    type: 'inspection' | 'behind_schedule';
    payload: {
      title: string;
      body: string;
      tag: string;
      url: string;
    };
  };

  const jobs: NotificationJob[] = [];

  // Inspection alerts
  for (const inspection of (inspections as Activity[]) || []) {
    const project = projectMap[inspection.project_id];
    if (!project) continue;

    const userId = project.user_id;
    if (!subsByUser[userId]) continue; // user not subscribed

    const incompletePreds = (inspection.predecessor_ids || []).filter((predId) => {
      const pred = predecessorMap[predId];
      return pred && pred.status !== 'complete' && pred.percent_complete < 100;
    });

    if (incompletePreds.length === 0) continue; // all predecessors done — no alert

    const firstIncompletePred = predecessorMap[incompletePreds[0]];
    const predName = firstIncompletePred?.activity_name ?? 'a predecessor activity';
    const moreCount = incompletePreds.length - 1;

    jobs.push({
      userId,
      activityId: inspection.id,
      type: 'inspection',
      payload: {
        title: `⚠️ Inspection Tomorrow — ${project.name}`,
        body: `"${inspection.activity_name}" is tomorrow but "${predName}"${moreCount > 0 ? ` (+${moreCount} more)` : ''} is not complete.`,
        tag: `inspection-${inspection.id}`,
        url: `/projects/${inspection.project_id}`,
      },
    });

    summary.inspectionAlerts++;
  }

  // Behind-schedule alerts
  const todayDate = new Date(today);
  for (const activity of (overdueActivities as Activity[]) || []) {
    const project = projectMap[activity.project_id];
    if (!project) continue;

    const userId = project.user_id;
    if (!subsByUser[userId]) continue;

    const finishDate = new Date(activity.finish_date!);
    const daysOverdue = Math.ceil(
      (todayDate.getTime() - finishDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    jobs.push({
      userId,
      activityId: activity.id,
      type: 'behind_schedule',
      payload: {
        title: `🔴 Behind Schedule — ${project.name}`,
        body: `"${activity.activity_name}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue (${activity.percent_complete}% complete).`,
        tag: `behind-${activity.id}`,
        url: `/projects/${activity.project_id}`,
      },
    });

    summary.behindScheduleAlerts++;
  }

  if (jobs.length === 0) {
    return NextResponse.json({ ...summary, message: 'No notifications to send' });
  }

  // ── 7. Dedup: check notification_log ─────────────────────────────────────
  // Build unique keys: (user_id, activity_id, notification_type, sent_date=today)
  const dedupChecks = jobs.map((j) => ({
    user_id: j.userId,
    activity_id: j.activityId,
    notification_type: j.type,
  }));

  // Fetch already-sent today
  const { data: alreadySent } = await service
    .from('notification_log')
    .select('user_id, activity_id, notification_type')
    .eq('sent_date', today)
    .in(
      'activity_id',
      dedupChecks.map((d) => d.activity_id)
    );

  const sentSet = new Set<string>();
  for (const row of (alreadySent as { user_id: string; activity_id: string; notification_type: string }[]) || []) {
    sentSet.add(`${row.user_id}::${row.activity_id}::${row.notification_type}`);
  }

  // Filter out already-sent
  const toSend = jobs.filter(
    (j) => !sentSet.has(`${j.userId}::${j.activityId}::${j.type}`)
  );

  // ── 8. Send notifications ─────────────────────────────────────────────────
  const logEntries: {
    user_id: string;
    activity_id: string;
    notification_type: string;
    sent_date: string;
  }[] = [];

  await Promise.allSettled(
    toSend.map(async (job) => {
      const userSubs = subsByUser[job.userId];
      if (!userSubs?.length) return;

      await Promise.allSettled(
        userSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify(job.payload)
            );
            summary.notificationsSent++;
          } catch (err: unknown) {
            summary.errors++;
            const statusCode = (err as { statusCode?: number }).statusCode;
            console.error(
              `[check] Failed to send to ${sub.endpoint.slice(0, 60)}:`,
              statusCode ?? err
            );

            // Remove invalid/expired subscriptions (410 Gone, 404 Not Found)
            if (statusCode === 410 || statusCode === 404) {
              await service
                .from('push_subscriptions')
                .delete()
                .eq('user_id', sub.user_id)
                .eq('endpoint', sub.endpoint);
            }
          }
        })
      );

      // Record in log (even if some subs failed — prevents re-spam)
      logEntries.push({
        user_id: job.userId,
        activity_id: job.activityId,
        notification_type: job.type,
        sent_date: today,
      });
    })
  );

  // ── 9. Write dedup log ────────────────────────────────────────────────────
  if (logEntries.length > 0) {
    await service
      .from('notification_log')
      .upsert(logEntries, { onConflict: 'user_id,activity_id,notification_type,sent_date', ignoreDuplicates: true });
  }

  return NextResponse.json(summary);
}
