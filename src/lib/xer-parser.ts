interface XERTask {
  task_id: string;
  task_name: string;
  start_date: string | null;
  end_date: string | null;
  percent_complete: number;
  duration: number | null;
  milestone: boolean;
  wbs_id: string | null;
  rsrc_names: string | null;
  pred_task_ids: string | null;
}

export function parseXER(xerText: string): XERTask[] {
  const lines = xerText.split('\n');
  const tasks: XERTask[] = [];
  
  let currentTable: string | null = null;
  let fieldNames: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Table definition
    if (trimmed.startsWith('%T')) {
      const parts = trimmed.split('\t');
      currentTable = parts[1]?.trim() || null;
      fieldNames = [];
      continue;
    }
    
    // Field definition
    if (trimmed.startsWith('%F')) {
      fieldNames = trimmed.split('\t').slice(1).map(f => f.trim());
      continue;
    }
    
    // Data row for TASK table
    if (trimmed.startsWith('%R') && currentTable === 'TASK') {
      const values = trimmed.split('\t').slice(1);
      const row: Record<string, string> = {};
      
      fieldNames.forEach((field, idx) => {
        row[field] = values[idx] || '';
      });
      
      // Map XER fields to our format
      // Common XER field names: task_id, task_code, task_name, start_date, end_date, 
      // target_start_date, target_end_date, act_start_date, act_end_date,
      // phys_complete_pct, duration_hr_cnt, task_type (TT_Mile, TT_Task, TT_FinMile)
      
      const taskId = row.task_id || row.task_code || '';
      const taskName = row.task_name || '';
      
      // XER dates are usually YYYY-MM-DD HH:MM format, take just the date part
      const parseXERDate = (dateStr: string): string | null => {
        if (!dateStr) return null;
        const datePart = dateStr.split(' ')[0];
        if (!datePart || datePart.length < 10) return null;
        return datePart; // YYYY-MM-DD
      };
      
      const startDate = parseXERDate(row.target_start_date || row.start_date || row.act_start_date || '');
      const endDate = parseXERDate(row.target_end_date || row.end_date || row.act_end_date || '');
      
      const percentComplete = parseFloat(row.phys_complete_pct || row.complete_pct || '0') || 0;
      
      // Duration is usually in hours in XER — convert to days
      const durationHours = parseFloat(row.duration_hr_cnt || row.target_drtn_hr_cnt || '0') || 0;
      const durationDays = durationHours > 0 ? Math.round(durationHours / 8) : null;
      
      // Milestone detection: task_type === 'TT_Mile' or 'TT_FinMile', or duration === 0
      const taskType = row.task_type || '';
      const isMilestone = taskType.includes('Mile') || durationDays === 0;
      
      tasks.push({
        task_id: taskId,
        task_name: taskName,
        start_date: startDate,
        end_date: endDate,
        percent_complete: percentComplete,
        duration: durationDays,
        milestone: isMilestone,
        wbs_id: row.wbs_id || null,
        rsrc_names: row.rsrc_names || null, // resource assignments if available
        pred_task_ids: row.pred_task_id || null, // predecessor IDs
      });
    }
  }
  
  return tasks.filter(t => t.task_name); // Only return tasks with names
}
