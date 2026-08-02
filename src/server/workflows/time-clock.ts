"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateShiftMinutes, minutesBetween } from "@/lib/time-clock";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission, requireUser } from "@/server/permissions/authorize";
import { recordActivity } from "@/server/workflows/activity";

export type TimeClockActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function clockInAction() {
  const user = await requireUser();
  const prisma = getPrisma();
  const openShift = await prisma.workShift.findFirst({ where: { userId: user.id, status: { in: ["ClockedIn", "OnBreak", "AwaitingCorrection"] } } });
  if (openShift) throw new Error("You already have an open shift.");

  const shift = await prisma.workShift.create({ data: { userId: user.id, startedAt: new Date(), status: "ClockedIn" } });
  await Promise.all([
    writeAuditLog({ userId: user.id, action: "time.clock_in", entity: "WorkShift", entityId: shift.id, after: { startedAt: shift.startedAt } }),
    recordActivity({ actorId: user.id, action: "clocked in", target: `Work shift started ${shift.startedAt.toISOString()}` })
  ]);
  revalidateTimeClockPaths();
}

export async function startBreakAction() {
  const user = await requireUser();
  const prisma = getPrisma();
  const shift = await prisma.workShift.findFirst({ where: { userId: user.id, status: "ClockedIn" }, include: { breaks: { where: { endedAt: null } } } });
  if (!shift) throw new Error("Clock in before starting a break.");
  if (shift.breaks.length > 0) throw new Error("A break is already open.");

  const workBreak = await prisma.workBreak.create({ data: { shiftId: shift.id, startedAt: new Date() } });
  await prisma.workShift.update({ where: { id: shift.id }, data: { status: "OnBreak" } });
  await Promise.all([
    writeAuditLog({ userId: user.id, action: "time.break_started", entity: "WorkBreak", entityId: workBreak.id, after: { shiftId: shift.id } }),
    recordActivity({ actorId: user.id, action: "started break", target: `Work shift ${shift.id}` })
  ]);
  revalidateTimeClockPaths();
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
  await Promise.all([
    writeAuditLog({ userId: user.id, action: "time.break_ended", entity: "WorkBreak", entityId: openBreak.id, after: { durationMinutes } }),
    recordActivity({ actorId: user.id, action: "ended break", target: `${durationMinutes} minutes` })
  ]);
  revalidateTimeClockPaths();
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
  await Promise.all([
    writeAuditLog({ userId: user.id, action: "time.clock_out", entity: "WorkShift", entityId: shift.id, after: totals }),
    recordActivity({ actorId: user.id, action: "clocked out", target: `${Math.round(totals.netMinutes / 60 * 100) / 100} hours worked` })
  ]);
  revalidateTimeClockPaths();
}

export async function clockInDashboardAction(_state: TimeClockActionState, _formData: FormData): Promise<TimeClockActionState> {
  void _state;
  void _formData;
  try {
    await clockInAction();
    return { status: "success", message: "Signed in. Time tracking has started." };
  } catch (error) {
    return { status: "error", message: readableTimeClockError(error, "Could not sign in. Please try again or tell Stephen.") };
  }
}

export async function startBreakDashboardAction(_state: TimeClockActionState, _formData: FormData): Promise<TimeClockActionState> {
  void _state;
  void _formData;
  try {
    await startBreakAction();
    return { status: "success", message: "Break started." };
  } catch (error) {
    return { status: "error", message: readableTimeClockError(error, "Could not start break. Please try again or tell Stephen.") };
  }
}

export async function endBreakDashboardAction(_state: TimeClockActionState, _formData: FormData): Promise<TimeClockActionState> {
  void _state;
  void _formData;
  try {
    await endBreakAction();
    return { status: "success", message: "Break ended. You are back on the clock." };
  } catch (error) {
    return { status: "error", message: readableTimeClockError(error, "Could not end break. Please try again or tell Stephen.") };
  }
}

export async function clockOutDashboardAction(_state: TimeClockActionState, formData: FormData): Promise<TimeClockActionState> {
  try {
    await clockOutAction(formData);
    return { status: "success", message: "Clocked out. Hours worked were recorded." };
  } catch (error) {
    return { status: "error", message: readableTimeClockError(error, "Could not clock out. Please try again or tell Stephen.") };
  }
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

function readableTimeClockError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function revalidateTimeClockPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/daily-reports");
}
