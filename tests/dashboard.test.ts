import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardSnapshot } from "@/server/data/dashboard";
import type { SessionUser } from "@/server/permissions/authorize";

const prismaMock = {
  task: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  client: {
    findMany: vi.fn()
  },
  lead: {
    findMany: vi.fn()
  },
  announcement: {
    findMany: vi.fn()
  },
  approval: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  onboardingModule: {
    count: vi.fn()
  },
  onboardingCompletion: {
    count: vi.fn()
  },
  dailyReport: {
    findMany: vi.fn()
  },
  activity: {
    findMany: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

const user: SessionUser = {
  id: "user_alex",
  name: "Alexandra Marie Canto",
  preferredName: "Alex",
  email: "amariexc@gmail.com",
  role: "Operations",
  status: "Active",
  timezone: "Asia/Manila"
};

describe("dashboard snapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.task.findMany.mockResolvedValue([
      {
        id: "task_1",
        title: "Prepare update",
        dueDate: new Date("2026-07-20T15:00:00.000Z"),
        status: "Assigned",
        priority: "High",
        owner: { preferredName: "Alex", name: "Alexandra Marie Canto" }
      }
    ]);
    prismaMock.client.findMany.mockResolvedValue([]);
    prismaMock.lead.findMany.mockResolvedValue([]);
    prismaMock.announcement.findMany.mockResolvedValue([]);
    prismaMock.approval.findMany.mockResolvedValue([
      {
        id: "approval_1",
        summary: "Review draft",
        deadline: new Date("2026-07-21T15:00:00.000Z"),
        businessImpact: "Needs Founder approval."
      }
    ]);
    prismaMock.onboardingModule.count.mockResolvedValue(4);
    prismaMock.onboardingCompletion.count.mockResolvedValue(2);
    prismaMock.dailyReport.findMany.mockResolvedValue([{ hoursWorked: 4 }]);
    prismaMock.activity.findMany.mockResolvedValue([
      {
        actor: { preferredName: "Stephen", name: "Stephen Burch" },
        action: "created",
        target: "task",
        createdAt: new Date("2026-07-19T15:00:00.000Z")
      }
    ]);
    prismaMock.task.count.mockResolvedValue(1);
    prismaMock.approval.count.mockResolvedValue(1);
  });

  it("formats timezone-aware dashboard dates without unsupported Intl options", async () => {
    const snapshot = await getDashboardSnapshot(user);

    expect(snapshot.tasks[0]?.due).toContain("2026");
    expect(snapshot.approvals[0]?.deadline).toContain("2026");
    expect(snapshot.activity[0]?.time).toContain("2026");
  });
});
