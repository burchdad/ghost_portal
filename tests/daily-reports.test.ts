import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitDailyReport } from "@/server/actions/reports";

const prismaMock = {
  dailyReport: {
    findUnique: vi.fn(),
    upsert: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
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
  })
}));

describe("daily report workflow", () => {
  beforeEach(() => {
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
});
