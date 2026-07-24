import { beforeEach, describe, expect, it, vi } from "vitest";
import { activeElapsedMinutes, calculateShiftMinutes, formatDuration, minutesBetween } from "@/lib/time-clock";
import { clockInAction, clockOutAction, endBreakAction, requestTimeCorrectionAction, startBreakAction } from "@/server/workflows/time-clock";

const prismaMock = {
  workShift: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  workBreak: {
    create: vi.fn(),
    update: vi.fn()
  },
  timeCorrectionRequest: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  },
  $transaction: vi.fn()
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "user_alex",
    name: "Alexandra Marie Canto",
    email: "amariexc@gmail.com",
    role: "Operations",
    preferredName: "Alex",
    status: "Active",
    timezone: "Asia/Manila"
  }),
  requirePermission: vi.fn().mockResolvedValue({
    id: "user_stephen",
    role: "Founder"
  })
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

describe("time clock helpers", () => {
  it("subtracts closed break minutes from completed shifts", () => {
    const totals = calculateShiftMinutes({
      startedAt: new Date("2026-07-21T14:00:00.000Z"),
      endedAt: new Date("2026-07-21T18:30:00.000Z"),
      breakMinutes: 30
    });

    expect(totals.grossMinutes).toBe(270);
    expect(totals.breakMinutes).toBe(30);
    expect(totals.netMinutes).toBe(240);
  });

  it("pauses active elapsed time while an open break is running", () => {
    expect(activeElapsedMinutes(
      new Date("2026-07-21T14:00:00.000Z"),
      new Date("2026-07-21T17:00:00.000Z"),
      15,
      new Date("2026-07-21T16:30:00.000Z")
    )).toBe(135);
  });

  it("formats timer minutes for the dashboard", () => {
    expect(minutesBetween(new Date("2026-07-21T14:00:00.000Z"), new Date("2026-07-21T15:05:00.000Z"))).toBe(65);
    expect(formatDuration(65)).toBe("1h 05m");
  });
});

describe("time clock workflow guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations));
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit_1" });
  });

  it("blocks duplicate clock-in while an active shift exists", async () => {
    prismaMock.workShift.findFirst.mockResolvedValue({ id: "shift_open", status: "ClockedIn" });

    await expect(clockInAction()).rejects.toThrow("already have an open shift");
    expect(prismaMock.workShift.create).not.toHaveBeenCalled();
  });

  it("blocks duplicate break starts", async () => {
    prismaMock.workShift.findFirst.mockResolvedValue({
      id: "shift_1",
      status: "ClockedIn",
      breaks: [{ id: "break_open" }]
    });

    await expect(startBreakAction()).rejects.toThrow("break is already open");
    expect(prismaMock.workBreak.create).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before clocking out with an open break", async () => {
    prismaMock.workShift.findFirst.mockResolvedValue({
      id: "shift_1",
      startedAt: new Date("2026-07-21T14:00:00.000Z"),
      breakMinutes: 0,
      breaks: [{ id: "break_open", startedAt: new Date("2026-07-21T16:00:00.000Z"), endedAt: null }]
    });

    await expect(clockOutAction(new FormData())).rejects.toThrow("End your break");
    expect(prismaMock.workShift.update).not.toHaveBeenCalled();
  });

  it("closes an open break and records net time when clocking out with confirmation", async () => {
    vi.setSystemTime(new Date("2026-07-21T18:00:00.000Z"));
    prismaMock.workShift.findFirst.mockResolvedValue({
      id: "shift_1",
      startedAt: new Date("2026-07-21T14:00:00.000Z"),
      breakMinutes: 15,
      breaks: [{ id: "break_open", startedAt: new Date("2026-07-21T17:30:00.000Z"), endedAt: null }]
    });

    const form = new FormData();
    form.set("allowOpenBreak", "on");
    await clockOutAction(form);

    expect(prismaMock.workBreak.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "break_open" },
      data: expect.objectContaining({ durationMinutes: 30 })
    }));
    expect(prismaMock.workShift.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "shift_1" },
      data: expect.objectContaining({ grossMinutes: 240, breakMinutes: 45, netMinutes: 195, status: "Completed" })
    }));
    vi.useRealTimers();
  });

  it("increments break totals when ending a break", async () => {
    vi.setSystemTime(new Date("2026-07-21T15:20:00.000Z"));
    prismaMock.workShift.findFirst.mockResolvedValue({
      id: "shift_1",
      status: "OnBreak",
      breaks: [{ id: "break_1", startedAt: new Date("2026-07-21T15:00:00.000Z") }]
    });

    await endBreakAction();

    expect(prismaMock.workShift.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: "ClockedIn", breakMinutes: { increment: 20 } }
    }));
    vi.useRealTimers();
  });

  it("records employee time correction requests", async () => {
    prismaMock.timeCorrectionRequest.create.mockResolvedValue({ id: "correction_1" });
    const form = new FormData();
    form.set("shiftId", "shift_1");
    form.set("requestedStartTime", "2026-07-21T09:00");
    form.set("requestedEndTime", "2026-07-21T17:00");
    form.set("requestedBreakDuration", "30");
    form.set("reason", "Forgot to clock in");
    form.set("supportingNote", "Started after standup.");

    await requestTimeCorrectionAction(form);

    expect(prismaMock.timeCorrectionRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requesterId: "user_alex",
        shiftId: "shift_1",
        requestedBreakDuration: 30,
        reason: "Forgot to clock in"
      })
    });
  });
});
