"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export const dailyReportSchema = z.object({
  reportDate: z.coerce.date(),
  shiftStart: z.coerce.date().optional(),
  shiftEnd: z.coerce.date().optional(),
  breakMinutes: z.coerce.number().int().min(0).max(480).default(0),
  completed: z.string().min(1),
  inProgress: z.string().min(1),
  clientUpdates: z.string().optional(),
  leadActivity: z.string().optional(),
  meetings: z.string().optional(),
  blockers: z.string().optional(),
  waitingOnStephen: z.string().optional(),
  recommendations: z.string().optional(),
  tomorrowPriorities: z.string().min(1),
  submit: z.boolean().default(false)
});

export async function submitDailyReport(input: unknown) {
  const user = await requireUser();
  if (!hasPermission(user, "reports:submit")) {
    throw new Error("Forbidden: reports:submit");
  }

  const report = dailyReportSchema.parse(input);
  const hoursWorked = calculateHours(report.shiftStart, report.shiftEnd, report.breakMinutes);
  const normalizedReportDate = startOfUtcDay(report.reportDate);

  const existing = await getPrisma().dailyReport.findUnique({
    where: {
      userId_reportDate: {
        userId: user.id,
        reportDate: normalizedReportDate
      }
    }
  });

  if (existing && existing.status !== "Draft") {
    throw new Error("A submitted report already exists for this work date.");
  }

  const saved = await getPrisma().dailyReport.upsert({
    where: {
      userId_reportDate: {
        userId: user.id,
        reportDate: normalizedReportDate
      }
    },
    update: {
      shiftStart: report.shiftStart,
      shiftEnd: report.shiftEnd,
      breakMinutes: report.breakMinutes,
      hoursWorked: new Prisma.Decimal(hoursWorked),
      completed: report.completed,
      inProgress: report.inProgress,
      clientUpdates: report.clientUpdates,
      leadActivity: report.leadActivity,
      meetings: report.meetings,
      blockers: report.blockers,
      waitingOnStephen: report.waitingOnStephen,
      recommendations: report.recommendations,
      tomorrowPriorities: report.tomorrowPriorities,
      status: report.submit ? "Submitted" : "Draft",
      submittedAt: report.submit ? new Date() : null
    },
    create: {
      userId: user.id,
      reportDate: normalizedReportDate,
      shiftStart: report.shiftStart,
      shiftEnd: report.shiftEnd,
      breakMinutes: report.breakMinutes,
      hoursWorked: new Prisma.Decimal(hoursWorked),
      completed: report.completed,
      inProgress: report.inProgress,
      clientUpdates: report.clientUpdates,
      leadActivity: report.leadActivity,
      meetings: report.meetings,
      blockers: report.blockers,
      waitingOnStephen: report.waitingOnStephen,
      recommendations: report.recommendations,
      tomorrowPriorities: report.tomorrowPriorities,
      status: report.submit ? "Submitted" : "Draft",
      submittedAt: report.submit ? new Date() : null
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: report.submit ? "daily_report.submitted" : "daily_report.saved",
    entity: "DailyReport",
    entityId: saved.id,
    after: { status: saved.status, reportDate: saved.reportDate.toISOString() }
  });

  return saved;
}

function calculateHours(start: Date | undefined, end: Date | undefined, breakMinutes: number) {
  if (!start || !end) return 0;
  const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000 - breakMinutes);
  return Math.round((minutes / 60) * 100) / 100;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
