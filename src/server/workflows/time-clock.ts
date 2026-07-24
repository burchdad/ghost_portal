"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateShiftMinutes, minutesBetween } from "@/lib/time-clock";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission, requireUser } from "@/server/permissions/authorize";

export async function clockInAction() {
  const user = await requireUser();
  const prisma = getPrisma();
  const openShift = await prisma.workShift.findFirst({ where: { userId: user.id, status: { in: ["ClockedIn", "OnBreak", "AwaitingCorrection"] } } });
  if (openShift) throw new Error("You already have an open shift.");

  const shift = await prisma.workShift.create({ data: { userId: user.id, startedAt: new Date(), status: "ClockedIn" } });
  await writeAuditLog({ userId: user.id, action: "time.clock_in", entity: "WorkShift", entityId: shift.id, after: { startedAt: shift.startedAt } });
  revalidatePath("/dashboard");
}

export async function startBreakAction() {
  const user = await requireUser();
  const prisma = getPrisma();
  const shift = await prisma.workShift.findFirst({ where: { userId: user.id, status: "ClockedIn" }, include: { breaks: { where: { endedAt: null } } } });
  if (!shift) throw new Error("Clock in before starting a break.");
  if (shift.breaks.length > 0) throw new Error("A break is already open.");

  const workBreak = await prisma.workBreak.create({ data: { shiftId: shift.id, startedAt: new Date() } });
  await prisma.workShift.update({ where: { id: shift.id }, data: { status: "OnBreak" } });
  await writeAuditLog({ userId: user.id, action: "time.break_started", entity: "WorkBreak", entityId: workBreak.id, after: { shiftId: shift.id } });
  revalidatePath("/dashboard");
}

export async function endBreakAction() {
  const user = await requireUser();
  const prisma = getPrisma();
  const shift = await prisma.workShift.findFirst({ where: { userId: user.id, status: "OnBreak" }, include: { breaks: { where: { endedAt: null }, orderBy: { startedAt: "desc" }, take: 1 } } });
  const openBreak = shift?.breaks[0];
  if (!shift || !openBreak) throw new Error("No open break found.");

  const endedAt = new Date();
  const durationMinutes = minutesBetween(openBreak.startedAt, endedAt);
  await prisma.$transaction([
    prisma.workBreak.update({ where: { id: openBreak.id }, data: { endedAt, durationMinutes } }),
    prisma.workShift.update({ where: { id: shift.id }, data: { status: "ClockedIn", breakMinutes: { increment: durationMinutes } } })
  ]);
  await writeAuditLog({ userId: user.id, action: "time.break_ended", entity: "WorkBreak", entityId: openBreak.id, after: { durationMinutes } });
  revalidatePath("/dashboard");
}

export async function clockOutAction(formData: FormData) {
  const user = await requireUser();
  const allowOpenBreak = formData.get("allowOpenBreak") === "on";
  const prisma = getPrisma();
  const shift = await prisma.workShift.findFirst({ where: { userId: user.id, status: { in: ["ClockedIn", "OnBreak"] } }, include: { breaks: true } });
  if (!shift) throw new Error("No open shift found.");
  const openBreak = shift.breaks.find((item) => !item.endedAt);
  if (openBreak && !allowOpenBreak) throw new Error("End your break before clocking out, or confirm clock-out with an open break.");

  const endedAt = new Date();
  let breakMinutes = shift.breakMinutes;
  if (openBreak) {
    const durationMinutes = minutesBetween(openBreak.startedAt, endedAt);
    breakMinutes += durationMinutes;
    await prisma.workBreak.update({ where: { id: openBreak.id }, data: { endedAt, durationMinutes } });
  }
  const totals = calculateShiftMinutes({ startedAt: shift.startedAt, endedAt, breakMinutes });
  await prisma.workShift.update({ where: { id: shift.id }, data: { endedAt, ...totals, status: "Completed" } });
  await writeAuditLog({ userId: user.id, action: "time.clock_out", entity: "WorkShift", entityId: shift.id, after: totals });
  revalidatePath("/dashboard");
}

export async function requestTimeCorrectionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    shiftId: z.string().optional(),
    requestedStartTime: z.coerce.date().optional(),
    requestedEndTime: z.coerce.date().optional(),
    requestedBreakDuration: z.coerce.number().int().min(0).optional(),
    reason: z.string().min(3),
    supportingNote: z.string().optional()
  }).parse({
    shiftId: formData.get("shiftId") || undefined,
    requestedStartTime: formData.get("requestedStartTime") || undefined,
    requestedEndTime: formData.get("requestedEndTime") || undefined,
    requestedBreakDuration: formData.get("requestedBreakDuration") || undefined,
    reason: formData.get("reason"),
    supportingNote: formData.get("supportingNote")
  });

  const request = await getPrisma().timeCorrectionRequest.create({ data: { ...parsed, requesterId: user.id } });
  await writeAuditLog({ userId: user.id, action: "time.correction_requested", entity: "TimeCorrectionRequest", entityId: request.id, after: parsed });
  revalidatePath("/dashboard");
}

export async function reviewTimeCorrectionAction(formData: FormData) {
  const user = await requirePermission("reports:review");
  const parsed = z.object({
    correctionId: z.string().min(1),
    status: z.enum(["Approved", "Rejected", "UnderReview"]),
    founderComment: z.string().optional()
  }).parse({
    correctionId: formData.get("correctionId"),
    status: formData.get("status"),
    founderComment: formData.get("founderComment")
  });
  const before = await getPrisma().timeCorrectionRequest.findUnique({ where: { id: parsed.correctionId } });
  const request = await getPrisma().timeCorrectionRequest.update({ where: { id: parsed.correctionId }, data: { status: parsed.status, founderComment: parsed.founderComment, reviewedById: user.id, reviewedAt: new Date() } });
  await writeAuditLog({ userId: user.id, action: "time.correction_reviewed", entity: "TimeCorrectionRequest", entityId: request.id, before: before ?? undefined, after: { status: request.status } });
  revalidatePath("/dashboard");
}
