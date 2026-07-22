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
  feedbackSubmission: {
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
  },
  trialSettings: {
    findFirst: vi.fn()
  },
  user: {
    findFirst: vi.fn()
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

const founder: SessionUser = {
  id: "user_stephen",
  name: "Stephen Burch",
  preferredName: "Stephen",
  email: "stephen@ghostai.solutions",
  role: "Founder",
  status: "Active",
  timezone: "America/Chicago"
};

describe("dashboard snapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.trialSettings.findFirst.mockResolvedValue({
      user: {
        id: "user_alex",
        name: "Alexandra Marie Canto",
        preferredName: "Alex",
        email: "amariexc@gmail.com",
        timezone: "Asia/Manila"
      }
    });
    prismaMock.user.findFirst.mockResolvedValue(null);
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
    prismaMock.feedbackSubmission.count.mockResolvedValue(2);
  });

  it("formats timezone-aware dashboard dates without unsupported Intl options", async () => {
    const snapshot = await getDashboardSnapshot(user);

    expect(snapshot.tasks[0]?.due).toContain("2026");
    expect(snapshot.tasks[0]?.state).toBe("Not Started");
    expect(snapshot.approvals[0]?.deadline).toContain("2026");
    expect(snapshot.activity[0]?.time).toContain("2026");
  });

  it("keeps Operations dashboard wording learner-scoped", async () => {
    const snapshot = await getDashboardSnapshot(user);

    expect(snapshot.scope.assignedWorkTitle).toBe("My assigned work");
    expect(snapshot.scope.progressTitle).toBe("My onboarding progress");
    expect(snapshot.scope.hoursLabel).toBe("My submitted hours: 4.0 this week.");
    expect(snapshot.scope.progressAction).toBe("Submit end-of-day report");
    expect(snapshot.scope.progressHref).toBe("/daily-reports/new");
    expect(snapshot.novaSummary).toContain("2 open support tickets");
  });

  it("scopes Founder dashboard wording and trial metrics to Alex", async () => {
    const snapshot = await getDashboardSnapshot(founder);

    expect(snapshot.scope.assignedWorkTitle).toBe("Alex's assigned work");
    expect(snapshot.scope.progressTitle).toBe("Alex's onboarding progress");
    expect(snapshot.scope.hoursLabel).toBe("Alex has submitted 4.0 hours this week.");
    expect(snapshot.scope.progressAction).toBe("Review daily reports");
    expect(snapshot.scope.progressHref).toBe("/daily-reports");
    expect(snapshot.novaSummary).toContain("2 open support tickets");
    expect(prismaMock.task.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: "user_alex", archivedAt: null }
    }));
    expect(prismaMock.onboardingCompletion.count).toHaveBeenCalledWith({ where: { userId: "user_alex" } });
    expect(prismaMock.dailyReport.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "user_alex" })
    }));
  });
});
