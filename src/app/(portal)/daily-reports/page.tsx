import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/time-clock";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function DailyReportsPage() {
  const user = await requireUser();
  const prisma = getPrisma();
  const [reports, shifts] = await Promise.all([
    prisma.dailyReport.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { reportDate: "desc" },
      take: 30
    }),
    prisma.workShift.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { startedAt: "desc" },
      take: 30
    })
  ]);

  return (
    <PageSection eyebrow="End of day" title="Daily Reports" description="One report per user per work date, with review status and weekly hour visibility.">
      <div className="mb-4 flex justify-end">
        <Button asChild variant="accent">
          <Link href="/daily-reports/new">New report</Link>
        </Button>
      </div>
      <SimpleTable
        columns={["Date", "User", "Hours", "Status"]}
        empty="No reports submitted yet."
        rows={reports.map((report) => [
          <Link key="date" href={`/daily-reports/${report.id}`} className="font-medium text-white hover:text-accent">
            {report.reportDate.toISOString().slice(0, 10)}
          </Link>,
          report.user.preferredName ?? report.user.name,
          Number(report.hoursWorked).toFixed(1),
          report.status
        ])}
      />

      <div className="mt-8">
        <h3 className="mb-3 text-base font-semibold">Dashboard Time Clock</h3>
        <SimpleTable
          columns={["Started", "User", "Status", "Ended", "Worked", "Break"]}
          empty="No dashboard clock sessions recorded yet."
          rows={shifts.map((shift) => [
            formatDateTime(shift.startedAt, shift.user.timezone),
            shift.user.preferredName ?? shift.user.name,
            <Badge key="status">{formatShiftStatus(shift.status)}</Badge>,
            shift.endedAt ? formatDateTime(shift.endedAt, shift.user.timezone) : "Open",
            formatDuration(shift.netMinutes ?? calculateActiveMinutes(shift.startedAt, shift.breakMinutes)),
            formatDuration(shift.breakMinutes)
          ])}
        />
      </div>
    </PageSection>
  );
}

function formatDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: safeTimezone(timezone)
  }).format(date);
}

function formatShiftStatus(status: string) {
  if (status === "ClockedIn") return "Clocked in";
  if (status === "OnBreak") return "On break";
  if (status === "AwaitingCorrection") return "Needs correction";
  if (status === "Completed") return "Clocked out";
  return status;
}

function calculateActiveMinutes(startedAt: Date, breakMinutes: number) {
  return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000) - breakMinutes);
}

function safeTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return "UTC";
  }
}
