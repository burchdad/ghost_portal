import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { todayInTimezone } from "@/lib/timezone";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { DailyReportForm } from "@/app/(portal)/daily-reports/new/daily-report-form";

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
        <DailyReportForm
          timezone={user.timezone}
          workDate={workDate}
          existing={existing ? {
            reportDate: existing.reportDate.toISOString(),
            shiftStart: existing.shiftStart?.toISOString(),
            shiftEnd: existing.shiftEnd?.toISOString(),
            breakMinutes: existing.breakMinutes,
            completed: existing.completed,
            inProgress: existing.inProgress,
            clientUpdates: existing.clientUpdates,
            leadActivity: existing.leadActivity,
            meetings: existing.meetings,
            blockers: existing.blockers,
            waitingOnStephen: existing.waitingOnStephen,
            recommendations: existing.recommendations,
            tomorrowPriorities: existing.tomorrowPriorities
          } : null}
        />
      </Card>
    </PageSection>
  );
}

function utcDateFromDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
