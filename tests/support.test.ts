import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitFeedbackAction, updateFeedbackStatusAction } from "@/server/workflows/feedback";

const authMock = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

const prismaMock = vi.hoisted(() => ({
  feedbackSubmission: {
    create: vi.fn(),
    update: vi.fn()
  },
  user: {
    findMany: vi.fn()
  },
  notification: {
    create: vi.fn()
  },
  activity: {
    create: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
}));

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", () => ({
  requireUser: authMock.requireUser
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const alex = {
  id: "user_alex",
  name: "Alexandra Marie Canto",
  email: "amariexc@gmail.com",
  role: "Operations",
  preferredName: "Alex",
  status: "Active",
  timezone: "Asia/Manila"
};

const stephen = {
  id: "user_stephen",
  name: "Stephen Burch",
  email: "stephen@ghostai.solutions",
  role: "Founder",
  preferredName: "Stephen",
  status: "Active",
  timezone: "America/Chicago"
};

describe("support agent workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.notification.create.mockResolvedValue({ id: "notification_1" });
    prismaMock.activity.create.mockResolvedValue({ id: "activity_1" });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit_1" });
  });

  it("creates a Mission Control ticket with summary, Founder notification, activity, and audit", async () => {
    authMock.requireUser.mockResolvedValue(alex);
    prismaMock.feedbackSubmission.create.mockImplementation(async ({ data }) => ({
      id: "ticket_1",
      ...data
    }));
    prismaMock.user.findMany.mockResolvedValue([{ id: stephen.id }]);

    const formData = new FormData();
    formData.set("type", "Bug");
    formData.set("severity", "High");
    formData.set("missionControlArea", "Tasks");
    formData.set("title", "Task form saves slowly");
    formData.set("description", "Saving a task spins without confirmation.");
    formData.set("pageOrFeature", "/tasks");
    formData.set("expectedResult", "Task saves and shows in the table.");
    formData.set("actualResult", "The button keeps loading.");
    formData.set("workaroundTried", "Refreshed the page.");
    formData.set("blocked", "on");

    await submitFeedbackAction(formData);

    expect(prismaMock.feedbackSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        supportKey: expect.stringMatching(/^GSA-/),
        submittedById: alex.id,
        blocked: true,
        missionControlArea: "Tasks",
        agentSummary: expect.stringContaining("Expected: Task saves and shows in the table.")
      })
    });
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: stephen.id,
        title: expect.stringContaining("support ticket"),
        href: "/admin/support?ticketId=ticket_1"
      })
    });
    expect(prismaMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: alex.id,
        action: "submitted support ticket",
        target: expect.stringContaining("Task form saves slowly")
      })
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "support_ticket.submitted",
        entity: "FeedbackSubmission",
        entityId: "ticket_1"
      })
    });
  });

  it("lets Mission Control update a ticket and notify the submitter", async () => {
    authMock.requireUser.mockResolvedValue(stephen);
    prismaMock.feedbackSubmission.update.mockResolvedValue({
      id: "ticket_1",
      supportKey: "GSA-ABC-1234",
      status: "Completed",
      submittedById: alex.id,
      founderResponse: "Fixed and deployed."
    });

    const formData = new FormData();
    formData.set("feedbackId", "ticket_1");
    formData.set("status", "Completed");
    formData.set("missionControlArea", "Ops Portal");
    formData.set("founderResponse", "Fixed and deployed.");
    formData.set("resolutionNotes", "Resolved with a server action patch.");

    await updateFeedbackStatusAction(formData);

    expect(prismaMock.feedbackSubmission.update).toHaveBeenCalledWith({
      where: { id: "ticket_1" },
      data: expect.objectContaining({
        status: "Completed",
        founderResponse: "Fixed and deployed.",
        resolutionNotes: "Resolved with a server action patch.",
        resolvedAt: expect.any(Date)
      })
    });
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: alex.id,
        title: "GSA-ABC-1234 updated",
        href: "/support?ticketId=ticket_1"
      })
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "support_ticket.updated",
        entityId: "ticket_1"
      })
    });
  });
});
