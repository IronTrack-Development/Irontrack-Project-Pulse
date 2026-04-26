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

// ── Field Report types ───────────────────────────────────────

export type FieldReportStatus = 'open' | 'in_progress' | 'resolved';
export type FieldReportPriority = 'high' | 'medium' | 'low';

export interface FieldReport {
  id: string;
  project_id: string;
  report_number: number;
  title: string;
  photo_path?: string;
  photo_caption?: string;
  assigned_to?: string;
  assigned_company?: string;
  comments?: string;
  location?: string;
  status: FieldReportStatus;
  priority: FieldReportPriority;
  linked_activity_id?: string;
  trade?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
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

// ── Safety / Toolbox Talk types ──────────────────────────────────

export type ToolboxTalkCategory =
  | 'falls' | 'electrical' | 'excavation' | 'confined_space'
  | 'scaffolding' | 'ppe' | 'heat_illness' | 'cold_stress'
  | 'fire_prevention' | 'hazcom' | 'lockout_tagout' | 'crane_rigging'
  | 'housekeeping' | 'hand_power_tools' | 'ladders' | 'silica'
  | 'struck_by' | 'caught_between' | 'traffic_control' | 'general' | 'custom';

export type ToolboxTalkStatus = 'draft' | 'completed' | 'locked';

export interface ToolboxTalk {
  id: string;
  project_id: string;
  talk_date: string;
  topic: string;
  category: ToolboxTalkCategory;
  presenter?: string;
  duration_minutes: number;
  location?: string;
  weather_conditions?: string;
  notes?: string;
  talking_points: string[];
  corrective_actions?: string;
  follow_up_needed: boolean;
  follow_up_notes?: string;
  status: ToolboxTalkStatus;
  linked_activity_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  locked_at?: string;
  attendee_count?: number;
  signed_count?: number;
}

export interface ToolboxTalkAttendee {
  id: string;
  talk_id: string;
  name: string;
  trade?: string;
  company?: string;
  signed: boolean;
  signed_at?: string;
  created_at: string;
}

export interface ToolboxTalkTemplate {
  id: string;
  category: ToolboxTalkCategory;
  title: string;
  talking_points: string[];
  hazards: string[];
  ppe_required: string[];
  duration_minutes: number;
  osha_reference?: string;
  is_system: boolean;
  project_id?: string;
  created_at: string;
}

// ─── Coordination Types ───────────────────────────────────────────────────────

export type CoordinationMeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type CoordinationRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type AgendaItemStatus = 'pending' | 'discussed' | 'deferred' | 'resolved';
export type ActionItemCategory = 'general' | 'rfi' | 'material_delivery' | 'manpower' | 'equipment' | 'schedule' | 'safety' | 'drawing' | 'submittal' | 'inspection' | 'custom';
export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface CoordinationMeeting {
  id: string;
  project_id: string;
  meeting_date: string;
  meeting_type: string;
  title: string;
  location?: string;
  facilitator?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  summary?: string;
  recurrence: CoordinationRecurrence;
  recurrence_day?: string;
  status: CoordinationMeetingStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  agenda_count?: number;
  action_count?: number;
  open_action_count?: number;
}

export interface CoordinationAgendaItem {
  id: string;
  meeting_id: string;
  activity_id?: string;
  sort_order: number;
  title: string;
  trade?: string;
  area?: string;
  notes?: string;
  has_conflict: boolean;
  conflict_description?: string;
  status: AgendaItemStatus;
  created_at: string;
}

export interface CoordinationActionItem {
  id: string;
  meeting_id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_company?: string;
  assigned_trade?: string;
  category: ActionItemCategory;
  priority: ActionItemPriority;
  due_date?: string;
  status: ActionItemStatus;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoordinationMeetingType {
  id: string;
  project_id?: string;
  name: string;
  default_agenda: string[];
  default_duration_minutes: number;
  is_system: boolean;
  created_at: string;
}

export interface CoordinationAttendee {
  id: string;
  meeting_id: string;
  name: string;
  company?: string;
  trade?: string;
  present: boolean;
  created_at: string;
}

export interface ScheduleConflict {
  activity_a: { id: string; name: string; trade: string; area: string; start: string; finish: string };
  activity_b: { id: string; name: string; trade: string; area: string; start: string; finish: string };
  overlap_start: string;
  overlap_end: string;
  conflict_type: 'same_area' | 'same_trade_area' | 'predecessor_delay';
}

// ── Sub Ops types ────────────────────────────────────────────

export type ForemanStatus = 'active' | 'inactive';
export type DispatchStatus = 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
export type BlockerCategory = 'material' | 'gc_delay' | 'weather' | 'manpower' | 'equipment' | 'drawing' | 'inspection' | 'access' | 'other';
export type BlockerStatus = 'open' | 'resolved';
export type SOPCategory = 'safety' | 'quality' | 'install_procedure' | 'company_policy' | 'equipment' | 'training' | 'general';

export interface SubCompany {
  id: string;
  name: string;
  trade?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_path?: string;
  created_at: string;
  updated_at: string;
}

export interface SubForeman {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  email?: string;
  trade?: string;
  certifications: string[];
  status: ForemanStatus;
  avatar_path?: string;
  hire_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubDispatch {
  id: string;
  company_id: string;
  foreman_id: string;
  project_name: string;
  project_location?: string;
  dispatch_date: string;
  scope_of_work: string;
  priority_notes?: string;
  safety_focus?: string;
  material_notes?: string;
  special_instructions?: string;
  expected_crew_size?: number;
  expected_hours?: number;
  acknowledged: boolean;
  acknowledged_at?: string;
  status: DispatchStatus;
  created_at: string;
  updated_at: string;
  // Joined
  foreman_name?: string;
  sop_count?: number;
}

export interface SubCheckin {
  id: string;
  dispatch_id?: string;
  foreman_id: string;
  company_id: string;
  checkin_date: string;
  checkin_time: string;
  crew_count?: number;
  crew_hours?: number;
  on_site: boolean;
  site_photo_path?: string;
  notes?: string;
  created_at: string;
  // Joined
  foreman_name?: string;
  production_logs?: SubProductionLog[];
}

export interface SubProductionLog {
  id: string;
  checkin_id?: string;
  foreman_id: string;
  company_id: string;
  log_date: string;
  description: string;
  quantity?: number;
  unit?: string;
  estimated_quantity?: number;
  estimated_unit?: string;
  photo_path?: string;
  area?: string;
  notes?: string;
  created_at: string;
}

export interface SubBlocker {
  id: string;
  foreman_id: string;
  company_id: string;
  dispatch_id?: string;
  blocker_date: string;
  category: BlockerCategory;
  description: string;
  impact?: string;
  photo_path?: string;
  status: BlockerStatus;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  foreman_name?: string;
}

export interface SubSOP {
  id: string;
  company_id: string;
  title: string;
  category: SOPCategory;
  description?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  acknowledgment_count?: number;
  total_foremen?: number;
}

export interface SubSOPAcknowledgment {
  id: string;
  sop_id: string;
  foreman_id: string;
  acknowledged_at: string;
  // Joined
  foreman_name?: string;
}

// ── Handoff Tracker types ────────────────────────────────────

export type CrewMemberRole = 'foreman' | 'journeyman' | 'apprentice' | 'helper' | 'superintendent' | 'project_manager' | 'other';
export type HandoffStatus = 'not_started' | 'in_progress' | 'ready_for_handoff' | 'handed_off' | 'accepted' | 'issue_flagged';

export interface SubDepartment {
  id: string;
  company_id: string;
  name: string;
  trade?: string;
  sort_order: number;
  color: string;
  created_at: string;
  updated_at: string;
  crew_count?: number;
}

export interface SubCrewMember {
  id: string;
  company_id: string;
  department_id?: string;
  foreman_id?: string;
  name: string;
  role: CrewMemberRole;
  phone?: string;
  email?: string;
  hourly_rate?: number;
  status: string;
  created_at: string;
  updated_at: string;
  department_name?: string;
}

export interface SubHandoffArea {
  id: string;
  company_id: string;
  project_name: string;
  area_name: string;
  description?: string;
  created_at: string;
  handoff_count?: number;
  completion_pct?: number;
}

export interface SubHandoff {
  id: string;
  company_id: string;
  area_id: string;
  from_department_id: string;
  to_department_id: string;
  status: HandoffStatus;
  handoff_date?: string;
  accepted_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  from_department_name?: string;
  to_department_name?: string;
  area_name?: string;
  checklist_total?: number;
  checklist_complete?: number;
  photo_count?: number;
}

export interface SubHandoffChecklistTemplate {
  id: string;
  company_id: string;
  from_department_id?: string;
  to_department_id?: string;
  title: string;
  items: string[];
  created_at: string;
  updated_at: string;
}

export interface SubHandoffChecklistItem {
  id: string;
  handoff_id: string;
  item_text: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  photo_path?: string;
  notes?: string;
  sort_order: number;
  created_at: string;
}

export interface SubHandoffPhoto {
  id: string;
  handoff_id: string;
  photo_path: string;
  caption?: string;
  taken_by?: string;
  created_at: string;
}
