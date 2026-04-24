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

  // Reforecast engine (009_schedule_reforecast)
  baseline_start?: string | null;
  baseline_finish?: string | null;
  baseline_duration?: number | null;
  forecast_start?: string | null;
  forecast_finish?: string | null;
  early_start?: string | null;
  early_finish?: string | null;
  late_start?: string | null;
  late_finish?: string | null;
  is_critical?: boolean;
  total_float?: number | null;
  free_float?: number | null;
  dependency_links?: any[];
  manual_override?: boolean;
  last_reforecast_at?: string | null;
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

export type IssuePriority = 'high' | 'medium' | 'low';
export type IssueCategory = 'qa_qc' | 'safety' | 'schedule';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type ReportStatus = 'draft' | 'generated' | 'shared';

export interface IssueReport {
  id: string;
  project_id: string;
  activity_id?: string;
  user_id?: string;
  report_number?: string;
  activity_name: string;
  project_name?: string;
  trade?: string;
  normalized_building?: string;
  prepared_by?: string;
  report_date: string;
  issue_count: number;
  overall_assessment?: string;
  status: ReportStatus;
  pdf_path?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportIssue {
  id: string;
  report_id: string;
  issue_number: number;
  title: string;
  note?: string;
  location?: string;
  priority: IssuePriority;
  category: IssueCategory;
  status: IssueStatus;
  photo_paths: string[];
  photo_captions: string[];
  trade?: string;
  potential_impact?: string;
  action_needed?: string;
  created_at: string;
  updated_at: string;
}

// Schedule Reforecast Engine types
export interface ScheduleSnapshot {
  id: string;
  project_id: string;
  snapshot_name?: string;
  snapshot_type: 'baseline' | 'reforecast' | 'manual';
  trigger_description?: string;
  baseline_finish_date?: string;
  forecast_finish_date?: string;
  completion_delta_days: number;
  critical_path_changed: boolean;
  total_activities: number;
  complete_activities: number;
  critical_activities: number;
  at_risk_activities: number;
  recovery_actions: any[];
  risk_flags: any[];
  schedule_impacts: any[];
  created_at: string;
}

export interface ProgressUpdate {
  id: string;
  project_id: string;
  activity_id: string;
  previous_percent_complete?: number;
  new_percent_complete?: number;
  previous_remaining_duration?: number;
  new_remaining_duration?: number;
  previous_status?: string;
  new_status?: string;
  actual_start_set?: string;
  actual_finish_set?: string;
  manual_override: boolean;
  updated_by?: string;
  notes?: string;
  created_at: string;
}

export interface LookaheadGroup {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  trades: {
    trade: string;
    activities: ParsedActivity[];
  }[];
}

// ── Daily Log types ──────────────────────────────────────────

export type DailyLogStatus = 'draft' | 'submitted' | 'locked';
export type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Overcast' | 'Rain' | 'Storm' | 'High Wind' | 'Freeze' | 'Heat Advisory';
export type WeatherImpact = 'none' | 'minor_slowdown' | 'partial_stop' | 'full_stop';
export type DelayCode = 'Weather' | 'Manpower' | 'RFI' | 'Inspection' | 'Change Order' | 'Equipment' | 'Material' | 'Other';

export interface DailyLogWeather {
  high?: number;
  low?: number;
  precip?: string;
  wind?: string;
  conditions: WeatherCondition[];
  impact: WeatherImpact;
  source?: string;
  current_temp?: number;
  wind_speed?: number;
  weather_code?: number;
  confirmed?: boolean;
}

export interface DailyLogCrewEntry {
  trade: string;
  company: string;
  headcount: number;
  hours: number;
}

export interface DailyLog {
  id: string;
  project_id: string;
  log_date: string;
  superintendent?: string;
  weather: DailyLogWeather;
  crew: DailyLogCrewEntry[];
  deliveries?: string;
  equipment: string[];
  delay_codes: DelayCode[];
  delay_narrative?: string;
  lost_crew_hours: number;
  toolbox_talk?: string;
  incidents?: string;
  visitors?: string;
  status: DailyLogStatus;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  locked_at?: string;
}

export interface DailyLogProgress {
  id: string;
  daily_log_id: string;
  activity_id?: string;
  pct_complete_before: number;
  pct_complete_after: number;
  note?: string;
  // joined from parsed_activities
  activity_name?: string;
  trade?: string;
}

export interface DailyLogPhoto {
  id: string;
  daily_log_id: string;
  activity_id?: string;
  storage_path: string;
  taken_at?: string;
  uploaded_at: string;
  caption?: string;
  gps_lat?: number;
  gps_lon?: number;
}
