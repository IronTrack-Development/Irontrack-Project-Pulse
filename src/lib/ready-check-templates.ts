export function generateReadyCheckMessage(opts: {
  type: 'standard' | 'critical_path' | 'friendly_reminder';
  contactName: string;
  activityName: string;
  startDate: string;
  building?: string;
  trade?: string;
  projectName?: string;
}): string {
  const { type, contactName, activityName, startDate, building, projectName } = opts;
  const firstName = contactName.split(' ')[0] || contactName;
  const locationStr = building ? ` at ${building}` : '';
  const projectStr = projectName ? ` on ${projectName}` : '';

  switch (type) {
    case 'standard':
      return `Hey ${firstName}, just reaching out to confirm you're tracking for mobilization on ${startDate} for ${activityName}${locationStr}${projectStr}. Please confirm manpower, material readiness, and any constraints ahead of start.`;

    case 'critical_path':
      return `${firstName} — this is a critical path item. ${activityName} is scheduled to start ${startDate}${locationStr}${projectStr}. I need confirmation on:\n\n1. Crew size & availability\n2. Material/equipment on site or delivery confirmed\n3. Any open submittals or RFIs that could delay\n4. Access/staging requirements\n\nPlease confirm ASAP — any slip here impacts the entire project schedule.`;

    case 'friendly_reminder':
      return `Hey ${firstName}, friendly heads up — ${activityName} is coming up on ${startDate}${locationStr}${projectStr}. Just want to make sure we're good to go. Let me know if you need anything from our end.`;

    default:
      return `Hey ${firstName}, confirming mobilization on ${startDate} for ${activityName}${locationStr}${projectStr}. Please confirm readiness.`;
  }
}

export function generateFollowUpMessage(opts: {
  contactName: string;
  activityName: string;
  startDate: string;
}): string {
  const { contactName, activityName, startDate } = opts;
  const firstName = contactName.split(' ')[0] || contactName;
  return `Hey ${firstName}, following up on my earlier message about ${activityName}. Start date is ${startDate}. Can you confirm readiness?`;
}

export function formatActivityDate(dateStr?: string | null): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
