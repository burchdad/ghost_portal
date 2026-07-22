import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreakDurationSelect, DatePicker, DateTimePicker, FieldShell, TimezoneDisplay } from "@/components/portal/date-time-controls";
import { todayInTimezone } from "@/lib/timezone";
import { getPrisma } from "@/server/db/prisma";
import { submitDailyReportAction } from "@/server/actions/reports";
import { requireUser } from "@/server/permissions/authorize";

export default async function NewDailyReportPage() {
  const user = await requireUser();
  const workDate = todayInTimezone(user.timezone);
  const existing = await getPrisma().dailyReport.findUnique({
    where: {
      userId_reportDate: {
        userId: user.id,
        reportDate: utcDateFromDateString(workDate)
      }
    }
  });

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
            defaultValue={existing?.reportDate ?? workDate}
          />
          <BreakDurationSelect
            label="Break duration"
            helper="Unpaid break time in minutes. Select 0 when no break was taken."
            defaultValue={existing?.breakMinutes ?? 0}
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
            defaultValue={existing?.shiftStart}
          />
          <DateTimePicker
            name="shiftEnd"
            label="Shift ended"
            helper="The time your work shift ended."
            timezone={user.timezone}
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

function utcDateFromDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
