import { todayInTimezone } from "@/lib/timezone";
import { getPrisma } from "@/server/db/prisma";
import { getTrialSubjectForViewer } from "@/server/data/trial-subject";
import type { SessionUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export type TimeClockSnapshot = {
  subjectName: string;
  workDate: string;
  timezone: string;
  status: "NotStarted" | "ClockedIn" | "ClockedOut" | "Submitted";
  canUseControls: boolean;
  reportId: string | null;
  reportHref: string;
  shiftStartLabel: string;
  shiftEndLabel: string;
  hoursLabel: string;
  breakLabel: string;
};

export async function getTimeClockSnapshot(viewer: SessionUser): Promise<TimeClockSnapshot> {
  const subject = await getTrialSubjectForViewer(viewer);
  const workDate = todayInTimezone(subject.timezone);
  const reportDate = utcDateFromDateString(workDate);
  const report = await getPrisma().dailyReport.findUnique({
    where: {
      userId_reportDate: {
        userId: subject.id,
        reportDate
      }
    }
  });

  const status = report?.status !== "Draft" && report?.status ? "Submitted" : report?.shiftStart && !report.shiftEnd ? "ClockedIn" : report?.shiftStart && report.shiftEnd ? "ClockedOut" : "NotStarted";
  const hours = report?.shiftStart ? calculateDisplayedHours(report.shiftStart, report.shiftEnd, report.breakMinutes) : 0;

  return {
    subjectName: subject.preferredName ?? subject.name,
    workDate,
    timezone: subject.timezone,
    status,
    canUseControls: viewer.id === subject.id && hasPermission(viewer, "reports:submit") && (!report || report.status === "Draft"),
    reportId: report?.id ?? null,
    reportHref: report?.id ? `/daily-reports/${report.id}` : "/daily-reports/new",
    shiftStartLabel: formatTime(report?.shiftStart, subject.timezone),
    shiftEndLabel: formatTime(report?.shiftEnd, subject.timezone),
    hoursLabel: `${hours.toFixed(1)} hours`,
    breakLabel: `${report?.breakMinutes ?? 0} min break`
  };
}

function calculateDisplayedHours(start: Date, end: Date | null, breakMinutes: number) {
  const stop = end ?? new Date();
  if (stop <= start) return 0;
  return Math.max(0, (stop.getTime() - start.getTime()) / 60000 - breakMinutes) / 60;
}

function formatTime(date: Date | null | undefined, timezone: string) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}

function utcDateFromDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
