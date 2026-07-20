import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreakDurationSelect, DatePicker, DateTimePicker, FieldShell, TimezoneDisplay } from "@/components/portal/date-time-controls";
import { submitDailyReportAction } from "@/server/actions/reports";
import { requireUser } from "@/server/permissions/authorize";

export default async function NewDailyReportPage() {
  const user = await requireUser();

  return (
    <PageSection eyebrow="Report" title="Submit end-of-day report" description="Hours are calculated on the server and one report is allowed per user per work date.">
      <Card>
        <form action={submitDailyReportAction} className="grid gap-4 lg:grid-cols-2">
          <DatePicker
            name="reportDate"
            label="Work date"
            helper="The local calendar date this work belongs to."
            timezone={user.timezone}
            required
          />
          <BreakDurationSelect
            label="Break duration"
            helper="Unpaid break time in minutes. Select 0 when no break was taken."
          />
          <div className="lg:col-span-2">
            <TimezoneDisplay timezone={user.timezone} />
          </div>
          <DateTimePicker
            name="shiftStart"
            label="Shift started"
            helper="The time your work shift began."
            timezone={user.timezone}
            required
          />
          <DateTimePicker
            name="shiftEnd"
            label="Shift ended"
            helper="The time your work shift ended."
            timezone={user.timezone}
            required
          />
          <ReportTextArea name="completed" label="Work completed" helper="List completed tasks and measurable outcomes." required />
          <ReportTextArea name="inProgress" label="Work still in progress" helper="Describe unfinished work and its next action." required />
          <ReportTextArea name="clientUpdates" label="Client updates" helper="Summarize client activity, questions, changes, or follow-ups." />
          <ReportTextArea name="leadActivity" label="Lead activity" helper="Record lead follow-ups drafted, completed, or scheduled." />
          <ReportTextArea name="meetings" label="Meetings" helper="List meetings attended, scheduled, or prepared." />
          <ReportTextArea name="blockers" label="Blockers" helper="Explain anything that prevented or delayed progress." />
          <ReportTextArea name="waitingOnStephen" label="Waiting on Stephen" helper="List decisions, information, or approvals needed from Stephen." />
          <ReportTextArea name="recommendations" label="Recommendations" helper="Suggest improvements to processes, systems, client operations, or Ghost Portal." />
          <ReportTextArea name="tomorrowPriorities" label="Tomorrow's priorities" helper="List the first priorities for your next shift." required className="lg:col-span-2" />
          <div className="flex gap-3 lg:col-span-2">
            <Button name="submit" value="false" variant="outline">Save draft</Button>
            <Button name="submit" value="true" variant="accent">Submit report</Button>
          </div>
        </form>
      </Card>
    </PageSection>
  );
}

function ReportTextArea({
  name,
  label,
  helper,
  required,
  className
}: {
  name: string;
  label: string;
  helper: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <FieldShell label={label} helper={helper} required={required} className={className}>
      <textarea name={name} required={required} className="min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm outline-none transition focus:border-accent" />
    </FieldShell>
  );
}
