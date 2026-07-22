import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { TimeClockCard } from "@/components/portal/time-clock-card";
import { getPrisma } from "@/server/db/prisma";
import { getTimeClockSnapshot } from "@/server/data/time-clock";
import { requireUser } from "@/server/permissions/authorize";

export default async function CalendarPage() {
  const user = await requireUser();
  const [clock, reports] = await Promise.all([
    getTimeClockSnapshot(user),
    getPrisma().dailyReport.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { reportDate: "desc" },
      take: 10
    })
  ]);

  return (
    <PageSection eyebrow="Schedule" title="Calendar" description="Track daily clock-in, clock-out, report dates, and submitted hours with the correct timezone.">
      <div className="grid gap-5">
        <TimeClockCard clock={clock} />
        <SimpleTable
          columns={["Work date", "User", "Start", "End", "Hours", "Status"]}
          empty="No work dates recorded yet."
          rows={reports.map((report) => [
            <Link key="date" href={`/daily-reports/${report.id}`} className="font-medium text-white hover:text-accent">
              {report.reportDate.toISOString().slice(0, 10)}
            </Link>,
            report.user.preferredName ?? report.user.name,
            formatTime(report.shiftStart, report.user.timezone),
            formatTime(report.shiftEnd, report.user.timezone),
            Number(report.hoursWorked).toFixed(1),
            report.status
          ])}
        />
      </div>
    </PageSection>
  );
}

function formatTime(date: Date | null, timezone: string) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}
