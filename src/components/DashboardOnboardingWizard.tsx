"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileUp,
  HardHat,
  Plus,
  Users,
  X,
} from "lucide-react";

interface DashboardOnboardingWizardProps {
  projectCount: number;
  userId?: string;
  onCreateProject: () => void;
}

const STORAGE_KEY_PREFIX = "irontrack_dashboard_onboarding_complete";

const steps = [
  {
    title: "Start with one active job",
    description:
      "Create the project your team is living in right now. Do not overthink it. Name, location, and finish target are enough to get moving.",
    icon: HardHat,
    action: "Create Project",
  },
  {
    title: "Load the schedule",
    description:
      "Upload the schedule so IronTrack can turn activities into today, this week, risk, lookahead, and milestone views.",
    icon: FileUp,
    action: "Open Project",
  },
  {
    title: "Run the daily rhythm",
    description:
      "Use daily logs, today view, priority work, and blockers to keep the job from drifting while the field is moving.",
    icon: CalendarDays,
    action: "Review Dashboard",
  },
  {
    title: "Bring subs into the loop",
    description:
      "Invite foremen, share the work plan, and use acknowledgments so crews know what changed before they show up.",
    icon: Users,
    action: "Invite Subs",
  },
  {
    title: "Close the loop",
    description:
      "Use photos, reports, and progress updates so what happened in the field becomes project memory, not a lost text thread.",
    icon: BookOpenCheck,
    action: "Track Progress",
  },
];

export default function DashboardOnboardingWizard({
  projectCount,
  userId,
  onCreateProject,
}: DashboardOnboardingWizardProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const currentStep = steps[stepIndex];
  const Icon = currentStep.icon;
  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;

  useEffect(() => {
    const dismissed = window.localStorage.getItem(storageKey) === "true";
    setOpen(!dismissed && projectCount === 0);
    setReady(true);
  }, [projectCount, storageKey]);

  const close = () => {
    window.localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  const startProject = () => {
    close();
    onCreateProject();
  };

  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStepIndex(0);
          setOpen(true);
        }}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[color:var(--text-primary)] shadow-lg shadow-black/20 transition-colors hover:border-[#F97316]/60"
      >
        <ClipboardList size={16} className="text-[#F97316]" />
        <span className="hidden sm:inline">Setup Guide</span>
        <span className="sm:hidden">Guide</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-3xl rounded-t-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-primary)] px-5 py-4 sm:px-6">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F97316]">
                  <CheckCircle2 size={14} />
                  First Run Setup
                </div>
                <h2 className="text-xl font-bold text-[color:var(--text-primary)] sm:text-2xl">
                  Get your first job running in IronTrack
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
                  A quick guide for the first day: create the job, load the schedule, then use the field workflow to keep crews aligned.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-[color:var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[color:var(--text-primary)]"
                aria-label="Close setup guide"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <div className="border-b border-[var(--border-primary)] p-4 md:border-b-0 md:border-r">
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[#F97316] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const active = index === stepIndex;
                    const complete = index < stepIndex;
                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => setStepIndex(index)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                          active
                            ? "border-[#F97316]/40 bg-[#F97316]/10"
                            : "border-transparent hover:border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active || complete ? "bg-[#F97316] text-white" : "bg-[var(--bg-tertiary)] text-[color:var(--text-muted)]"
                          }`}
                        >
                          {complete ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-[color:var(--text-primary)]">
                            {step.title}
                          </span>
                          <span className="block truncate text-[11px] text-[color:var(--text-muted)]">
                            {step.action}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F97316]/25 bg-[#F97316]/10 text-[#F97316]">
                  <Icon size={26} />
                </div>
                <div className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                  Step {stepIndex + 1} of {steps.length}
                </div>
                <h3 className="mt-2 text-2xl font-bold text-[color:var(--text-primary)]">
                  {currentStep.title}
                </h3>
                <p className="mt-3 max-w-xl text-base leading-7 text-[color:var(--text-secondary)]">
                  {currentStep.description}
                </p>

                <div className="mt-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
                  <div className="text-sm font-semibold text-[color:var(--text-primary)]">
                    What success looks like
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                    A superintendent can open IronTrack in the morning and know the plan, the risk, the crew impact, and what needs a follow-up before the job gets away from them.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-[var(--border-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
                  >
                    Skip for now
                  </button>
                  <div className="flex gap-3">
                    {stepIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setStepIndex((current) => current - 1)}
                        className="rounded-lg border border-[var(--border-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
                      >
                        Back
                      </button>
                    )}
                    {stepIndex < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setStepIndex((current) => current + 1)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#ea6c0a]"
                      >
                        Next
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startProject}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#ea6c0a]"
                      >
                        <Plus size={16} />
                        Create First Project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
