import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/time-clock";
import { safeTimezone } from "@/lib/timezones";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function CalendarPage() {
  const user = await requireUser();
  const prisma = getPrisma();
  const [reports, shifts] = await Promise.all([
    prisma.dailyReport.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { reportDate: "desc" },
      take: 10
    }),
    prisma.workShift.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { startedAt: "desc" },
      take: 10
    })
  ]);

  return (
    <PageSection eyebrow="Schedule" title="Calendar" description="Review work sessions, report dates, and submitted hours with the correct timezone. Time tracking now happens from the dashboard.">
      <div className="grid gap-5">
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
        <SimpleTable
          columns={["Clocked in", "User", "Status", "Clocked out", "Worked", "Break"]}
          empty="No dashboard clock sessions recorded yet."
          rows={shifts.map((shift) => [
            formatTime(shift.startedAt, shift.user.timezone),
            shift.user.preferredName ?? shift.user.name,
            <Badge key="status">{formatShiftStatus(shift.status)}</Badge>,
            shift.endedAt ? formatTime(shift.endedAt, shift.user.timezone) : "Open",
            formatDuration(shift.netMinutes ?? calculateActiveMinutes(shift.startedAt, shift.breakMinutes)),
            formatDuration(shift.breakMinutes)
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
