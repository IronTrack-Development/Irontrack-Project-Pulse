/**
 * IronTrack Schedule Simulator — MS Project XML Export
 * Generates a standards-compliant Microsoft Project XML file.
 * Format: MS Project 2003+ XML schema (http://schemas.microsoft.com/project)
 *
 * Opens directly in MS Project 2010, 2013, 2016, 2019, 2021, 365.
 */

import { GeneratedSchedule, ScheduleActivity } from './schedule-engine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format date as MS Project datetime string */
function mspDate(dateStr: string | undefined, endOfDay = false): string {
  if (!dateStr) return '';
  const time = endOfDay ? 'T17:00:00' : 'T08:00:00';
  return `${dateStr}${time}`;
}

/** Duration in MS Project PT format: PT{hours}H0M0S */
function mspDuration(workingDays: number): string {
  const hours = workingDays * 8;
  return `PT${hours}H0M0S`;
}

/** XML-escape a string */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Task XML Builder ─────────────────────────────────────────────────────────

function buildTaskXml(a: ScheduleActivity, isPhaseHeader = false): string {
  const preds = a.predecessors
    .map(
      (pid) => `
        <PredecessorLink>
          <PredecessorUID>${pid}</PredecessorUID>
          <Type>1</Type>
          <CrossProject>0</CrossProject>
        </PredecessorLink>`
    )
    .join('');

  // Outline level: 1 = phase summary, 2 = activity
  const outlineLevel = isPhaseHeader ? 1 : 2;
  const isSummary = isPhaseHeader ? '<Summary>1</Summary>' : '<Summary>0</Summary>';
  const milestone = a.duration === 0 ? '<Milestone>1</Milestone>' : '';

  return `
    <Task>
      <UID>${a.id}</UID>
      <ID>${a.id}</ID>
      <Name>${xmlEscape(a.name)}</Name>
      <OutlineLevel>${outlineLevel}</OutlineLevel>
      ${isSummary}
      ${milestone}
      <Duration>${mspDuration(a.duration)}</Duration>
      <DurationFormat>7</DurationFormat>
      <Work>${mspDuration(a.duration)}</Work>
      <Start>${mspDate(a.earlyStart)}</Start>
      <Finish>${mspDate(a.earlyFinish, true)}</Finish>
      <EarlyStart>${mspDate(a.earlyStart)}</EarlyStart>
      <EarlyFinish>${mspDate(a.earlyFinish, true)}</EarlyFinish>
      <LateStart>${mspDate(a.lateStart)}</LateStart>
      <LateFinish>${mspDate(a.lateFinish, true)}</LateFinish>
      <TotalSlack>${(a.totalFloat ?? 0) * 4800}</TotalSlack>
      <FreeSlack>0</FreeSlack>
      <Critical>${a.isCritical ? '1' : '0'}</Critical>
      <CalendarUID>1</CalendarUID>
      ${preds}
    </Task>`;
}

// ─── Resource XML (trade names) ───────────────────────────────────────────────

function buildResourcesXml(schedule: GeneratedSchedule): string {
  const trades = [...new Set(schedule.activities.map((a) => a.trade))];

  const resources = trades
    .map((trade, i) => {
      const rid = i + 1;
      return `
    <Resource>
      <UID>${rid}</UID>
      <ID>${rid}</ID>
      <Name>${xmlEscape(trade)}</Name>
      <Type>0</Type>
      <MaxUnits>1</MaxUnits>
      <CalendarUID>1</CalendarUID>
    </Resource>`;
    })
    .join('');

  return `  <Resources>${resources}
  </Resources>`;
}

// ─── Assignments XML (activity → trade resource) ──────────────────────────────

function buildAssignmentsXml(schedule: GeneratedSchedule): string {
  const tradeList = [...new Set(schedule.activities.map((a) => a.trade))];
  const tradeToRid = new Map(tradeList.map((t, i) => [t, i + 1]));

  let assignId = 1;
  const assignments = schedule.activities
    .map((a) => {
      const rid = tradeToRid.get(a.trade) ?? 0;
      const xml = `
    <Assignment>
      <UID>${assignId}</UID>
      <TaskUID>${a.id}</TaskUID>
      <ResourceUID>${rid}</ResourceUID>
      <Units>1</Units>
      <Work>${mspDuration(a.duration)}</Work>
      <Start>${mspDate(a.earlyStart)}</Start>
      <Finish>${mspDate(a.earlyFinish, true)}</Finish>
    </Assignment>`;
      assignId++;
      return xml;
    })
    .join('');

  return `  <Assignments>${assignments}
  </Assignments>`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function generateMSProjectXML(schedule: GeneratedSchedule): string {
  // Build task list — insert phase summary rows (virtual tasks)
  const phaseOrder = [
    'Phase 1: Pre-Construction & Mobilization',
    'Phase 2: Site Work & Earthwork',
    'Phase 3: Foundations',
    'Phase 4: Structure',
    'Phase 5: Building Envelope',
    'Phase 6: Rough-Ins (MEP)',
    'Phase 7: Interior Finishes',
    'Phase 8: Final MEP & Specialties',
    'Phase 9: Closeout & Punchlist',
  ];

  // Group activities by phase
  const grouped = new Map<string, ScheduleActivity[]>();
  schedule.activities.forEach((a) => {
    const list = grouped.get(a.phase) ?? [];
    list.push(a);
    grouped.set(a.phase, list);
  });

  // Generate task XML — activities only (no phantom phase summaries to keep imports clean)
  const taskXmls = schedule.activities.map((a) => buildTaskXml(a, false)).join('');

  const resourcesXml = buildResourcesXml(schedule);
  const assignmentsXml = buildAssignmentsXml(schedule);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <SaveVersion>14</SaveVersion>
  <Name>${xmlEscape(schedule.projectName)}</Name>
  <Title>${xmlEscape(schedule.projectName)}</Title>
  <Subject>IronTrack Schedule Simulator — Baseline CPM Schedule</Subject>
  <Author>IronTrack</Author>
  <CreationDate>${new Date().toISOString().slice(0, 10)}T00:00:00</CreationDate>
  <StartDate>${mspDate(schedule.startDate)}</StartDate>
  <FinishDate>${mspDate(schedule.endDate, true)}</FinishDate>
  <ScheduleFromStart>1</ScheduleFromStart>
  <CalendarUID>1</CalendarUID>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultFinishTime>17:00:00</DefaultFinishTime>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <DefaultTaskType>0</DefaultTaskType>
  <DefaultFixedCostAccrual>3</DefaultFixedCostAccrual>
  <DefaultStandardRate>0</DefaultStandardRate>
  <DefaultOvertimeRate>0</DefaultOvertimeRate>
  <DurationFormat>7</DurationFormat>
  <WorkFormat>2</WorkFormat>
  <EditableActualCosts>0</EditableActualCosts>
  <HonorConstraints>0</HonorConstraints>
  <EarnedValueMethod>0</EarnedValueMethod>
  <InsertedProjectsLikeSummary>0</InsertedProjectsLikeSummary>
  <MultipleCriticalPaths>0</MultipleCriticalPaths>
  <NewTasksEffortDriven>1</NewTasksEffortDriven>
  <NewTasksEstimated>1</NewTasksEstimated>
  <SplitsInProgressTasks>1</SplitsInProgressTasks>
  <SpreadActualCost>0</SpreadActualCost>
  <SpreadPercentComplete>0</SpreadPercentComplete>
  <TaskUpdatesResource>0</TaskUpdatesResource>
  <FiscalYearStart>0</FiscalYearStart>
  <WeekStartDay>1</WeekStartDay>
  <MoveCompletedEndsBack>0</MoveCompletedEndsBack>
  <MoveRemainingStartsBack>0</MoveRemainingStartsBack>
  <MoveRemainingStartsForward>0</MoveRemainingStartsForward>
  <MoveCompletedEndsForward>0</MoveCompletedEndsForward>
  <BaselineForEarnedValue>0</BaselineForEarnedValue>
  <AutoAddNewResourcesAndTasks>1</AutoAddNewResourcesAndTasks>
  <StatusDate>NA</StatusDate>
  <CurrentDate>${new Date().toISOString().slice(0, 10)}T08:00:00</CurrentDate>

  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard</Name>
      <IsBaseCalendar>1</IsBaseCalendar>
      <IsBaselineCalendar>0</IsBaselineCalendar>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>2</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>3</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>4</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>5</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>6</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>

  <Tasks>
    <Task>
      <UID>0</UID>
      <ID>0</ID>
      <Name>${xmlEscape(schedule.projectName)}</Name>
      <Summary>1</Summary>
      <OutlineLevel>0</OutlineLevel>
      <Duration>${mspDuration(schedule.summary.totalDuration)}</Duration>
      <Start>${mspDate(schedule.startDate)}</Start>
      <Finish>${mspDate(schedule.endDate, true)}</Finish>
      <CalendarUID>1</CalendarUID>
    </Task>
    ${taskXmls}
  </Tasks>

  ${resourcesXml}

  ${assignmentsXml}

</Project>`;
}
