export interface DailyProject {
  id: string;
  name: string;
  project_number?: string;
  client_name?: string;
  location?: string;
  start_date?: string;
  target_finish_date?: string;
  status: string;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduleUpload {
  id: string;
  project_id: string;
  original_filename: string;
  file_type?: string;
  parse_status: string;
  activity_count: number;
  created_at: string;
}

export interface ParsedActivity {
  id: string;
  project_id: string;
  upload_id?: string;
  activity_id?: string;
  activity_name: string;
  wbs?: string;
  area?: string;
  phase?: string;
  trade?: string;
  original_duration?: number;
  remaining_duration?: number;
  start_date?: string;
  finish_date?: string;
  actual_start?: string;
  actual_finish?: string;
  percent_complete: number;
  predecessor_ids?: string[];
  successor_ids?: string[];
  milestone: boolean;
  activity_type?: string;
  status: string;
  float_days?: number;
  created_at: string;

  // WBS hierarchy (005_add_wbs_hierarchy)
  constraint_type?: string | null;
  constraint_date?: string | null;
  resource_names?: string | null;
  notes?: string | null;
  external_task_id?: string | null;
  external_unique_id?: string | null;
  outline_level?: number | null;
  parent_activity_name?: string | null;
  normalized_building?: string | null;
  normalized_phase?: string | null;
  normalized_area?: string | null;
  normalized_work_type?: string | null;
  normalized_trade?: string | null;
}

export interface DailyRisk {
  id: string;
  project_id: string;
  activity_id?: string;
  risk_type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description?: string;
  suggested_action?: string;
  status: string;
  detected_at: string;
  parsed_activities?: ParsedActivity;
}

export interface DailyBrief {
  id: string;
  project_id: string;
  brief_date: string;
  summary: BriefSummary;
  generated_at: string;
}

export interface BriefSummary {
  date: string;
  status: "green" | "yellow" | "red";
  today: string[];
  watchlist: string[];
  risks: { severity: string; title: string; detail: string }[];
  actions: string[];
  next_milestone?: { name: string; due_date: string };
}

export interface ProjectStats {
  totalActivities: number;
  completeActivities: number;
  inProgressActivities: number;
  lateActivities: number;
  milestoneCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  completionPercent: number;
  daysToCompletion: number | null;
  nextMilestone?: ParsedActivity;
}

export interface ColumnMapping {
  activity_id?: string;
  activity_name?: string;
  start_date?: string;
  finish_date?: string;
  original_duration?: string;
  percent_complete?: string;
  predecessor_ids?: string;
  wbs?: string;
  area?: string;
  trade?: string;
  actual_start?: string;
  actual_finish?: string;
  milestone?: string;
}

export interface ReadyCheckContact {
  id: string;
  project_id: string;
  user_id?: string;
  trade: string;
  contact_name: string;
  phone?: string;
  email?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface ReadyCheck {
  id: string;
  project_id: string;
  activity_id?: string;
  user_id?: string;
  contact_id?: string;
  contact_name: string;
  contact_company?: string;
  contact_phone?: string;
  contact_email?: string;
  activity_name: string;
  trade?: string;
  start_date?: string;
  normalized_building?: string;
  check_type: 'standard' | 'critical_path' | 'friendly_reminder';
  message_text: string;
  send_method?: 'sms' | 'email' | 'copy';
  status: 'draft' | 'sent' | 'awaiting_response' | 'confirmed' | 'no_response' | 'issue_flagged';
  sent_at?: string;
  responded_at?: string;
  response_notes?: string;
  follow_up_count: number;
  last_follow_up_at?: string;
  created_at: string;
  updated_at: string;
}

export type ReadyCheckType = 'standard' | 'critical_path' | 'friendly_reminder';
export type ReadyCheckStatus = 'draft' | 'sent' | 'awaiting_response' | 'confirmed' | 'no_response' | 'issue_flagged';

export interface LookaheadGroup {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  trades: {
    trade: string;
    activities: ParsedActivity[];
  }[];
}
