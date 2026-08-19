import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitDailyReport } from "@/server/actions/reports";
import { submitDailyReportFormAction } from "@/server/actions/daily-report-form";

const prismaMock = {
  dailyReport: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn()
  },
  activity: {
    create: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
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
  })
}));

describe("daily report workflow", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("prevents duplicate submitted reports for a work date", async () => {
    prismaMock.dailyReport.findUnique.mockResolvedValue({ id: "report_1", status: "Submitted" });

    await expect(
      submitDailyReport({
        reportDate: "2026-07-20",
        shiftStart: "2026-07-20T09:00:00.000Z",
        shiftEnd: "2026-07-20T17:00:00.000Z",
        breakMinutes: 30,
        completed: "Completed onboarding",
        inProgress: "Tasks",
        tomorrowPriorities: "Follow ups",
        submit: true
      })
    ).rejects.toThrow("submitted report already exists");
  });

  it("returns duplicate report errors to the form instead of throwing", async () => {
    prismaMock.dailyReport.findUnique.mockResolvedValue({ id: "report_1", status: "Submitted" });
    const form = new FormData();
    form.set("reportDate", "2026-07-20");
    form.set("shiftStart", "2026-07-20T09:00:00.000Z");
    form.set("shiftEnd", "2026-07-20T17:00:00.000Z");
    form.set("breakMinutes", "30");
    form.set("completed", "Completed onboarding");
    form.set("inProgress", "Tasks");
    form.set("tomorrowPriorities", "Follow ups");
    form.set("submit", "true");

    const result = await submitDailyReportFormAction({ status: "idle" }, form);

    expect(result).toEqual({
      status: "error",
      message: "A submitted report already exists for this work date."
    });
    expect(prismaMock.dailyReport.upsert).not.toHaveBeenCalled();
  });

  it("rejects impossible shift hours", async () => {
    prismaMock.dailyReport.findUnique.mockResolvedValue(null);

    await expect(
      submitDailyReport({
        reportDate: "2026-07-20",
        shiftStart: "2026-07-20T17:00:00.000Z",
        shiftEnd: "2026-07-20T09:00:00.000Z",
        breakMinutes: 0,
        completed: "Completed onboarding",
        inProgress: "Tasks",
        tomorrowPriorities: "Follow ups",
        submit: true
      })
    ).rejects.toThrow("Shift end must be after shift start");
  });

  it("stores Alex's five-minute zero-break shift as worked minutes divided by 60", async () => {
    prismaMock.dailyReport.findUnique.mockResolvedValue(null);
    prismaMock.dailyReport.upsert.mockResolvedValue({
      id: "report_2",
      reportDate: new Date("2026-07-19T00:00:00.000Z"),
      status: "Submitted"
    });
    prismaMock.activity.create.mockResolvedValue({ id: "activity_1" });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit_1" });

    await submitDailyReport({
      reportDate: "2026-07-19",
      shiftStart: "2026-07-19T02:10:00.000Z",
      shiftEnd: "2026-07-19T02:15:00.000Z",
      breakMinutes: 0,
      completed: "Completed onboarding",
      inProgress: "Tasks",
      tomorrowPriorities: "Follow ups",
      submit: true
    });

    const upsertInput = prismaMock.dailyReport.upsert.mock.calls[0]?.[0];
    expect(Number(upsertInput.create.hoursWorked)).toBeCloseTo(5 / 60, 5);
    expect(Number(upsertInput.update.hoursWorked)).toBeCloseTo(5 / 60, 5);
  });

});
