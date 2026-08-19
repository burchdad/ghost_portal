"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BreakDurationSelect, DatePicker, DateTimePicker, FieldShell, TimezoneDisplay } from "@/components/portal/date-time-controls";
import { submitDailyReportFormAction, type DailyReportFormState } from "@/server/actions/daily-report-form";

const initialState: DailyReportFormState = { status: "idle" };

type ExistingReportDefaults = {
  reportDate?: string;
  shiftStart?: string;
  shiftEnd?: string;
  breakMinutes?: number;
  completed?: string | null;
  inProgress?: string | null;
  clientUpdates?: string | null;
  leadActivity?: string | null;
  meetings?: string | null;
  blockers?: string | null;
  waitingOnStephen?: string | null;
  recommendations?: string | null;
  tomorrowPriorities?: string | null;
};

export function DailyReportForm({
  timezone,
  workDate,
  existing
}: {
  timezone: string;
  workDate: string;
  existing?: ExistingReportDefaults | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDailyReportFormAction, initialState);

  useEffect(() => {
    if (state.status === "success" && state.reportHref) {
      router.push(state.reportHref);
    }
  }, [router, state.reportHref, state.status]);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-2">
      <DatePicker
        name="reportDate"
        label="Work date"
        helper="The local calendar date this work belongs to."
        timezone={timezone}
        required
        defaultValue={existing?.reportDate ?? workDate}
      />
      <BreakDurationSelect
        label="Break duration"
        helper="Unpaid break time in minutes. Select 0 when no break was taken."
        defaultValue={existing?.breakMinutes ?? 0}
      />
      <div className="lg:col-span-2">
        <TimezoneDisplay timezone={timezone} />
      </div>
      <DateTimePicker
        name="shiftStart"
        label="Shift started"
        helper="The time your work shift began."
        timezone={timezone}
        required
        defaultValue={existing?.shiftStart}
      />
      <DateTimePicker
        name="shiftEnd"
        label="Shift ended"
        helper="The time your work shift ended."
        timezone={timezone}
        required
        defaultValue={existing?.shiftEnd}
      />
      <ReportTextArea name="completed" label="Work completed" helper="List completed tasks and measurable outcomes." required defaultValue={existing?.completed} />
      <ReportTextArea name="inProgress" label="Work still in progress" helper="Describe unfinished work and its next action." required defaultValue={existing?.inProgress} />
      <ReportTextArea name="clientUpdates" label="Client updates" helper="Summarize client activity, questions, changes, or follow-ups." defaultValue={existing?.clientUpdates} />
      <ReportTextArea name="leadActivity" label="Lead activity" helper="Record lead follow-ups drafted, completed, or scheduled." defaultValue={existing?.leadActivity} />
      <ReportTextArea name="meetings" label="Meetings" helper="List meetings attended, scheduled, or prepared." defaultValue={existing?.meetings} />
      <ReportTextArea name="blockers" label="Blockers" helper="Explain anything that prevented or delayed progress." defaultValue={existing?.blockers} />
      <ReportTextArea name="waitingOnStephen" label="Waiting on Stephen" helper="List decisions, information, or approvals needed from Stephen." defaultValue={existing?.waitingOnStephen} />
      <ReportTextArea name="recommendations" label="Recommendations" helper="Suggest improvements to processes, systems, client operations, or Ghost Portal." defaultValue={existing?.recommendations} />
      <ReportTextArea name="tomorrowPriorities" label="Tomorrow's priorities" helper="List the first priorities for your next shift." required className="lg:col-span-2" defaultValue={existing?.tomorrowPriorities} />
      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button name="submit" value="false" variant="outline" disabled={pending}>{pending ? "Saving..." : "Save draft"}</Button>
        <Button name="submit" value="true" variant="accent" disabled={pending}>{pending ? "Submitting..." : "Submit report"}</Button>
        {state.message ? (
          <p className={`rounded-lg border px-3 py-2 text-sm ${state.status === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-accent/30 bg-accent/10 text-accent"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function ReportTextArea({
  name,
  label,
  helper,
  required,
  className,
  defaultValue
}: {
  name: string;
  label: string;
  helper: string;
  required?: boolean;
  className?: string;
  defaultValue?: string | null;
}) {
  return (
    <FieldShell label={label} helper={helper} required={required} className={className}>
      <textarea name={name} required={required} defaultValue={defaultValue ?? ""} className="min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm outline-none transition focus:border-accent" />
    </FieldShell>
  );
}
