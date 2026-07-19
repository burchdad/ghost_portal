import { describe, expect, it, vi } from "vitest";
import { decideDraftCommunicationAction } from "@/server/workflows/draft-communications";

const prismaMock = {
  draftCommunication: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  },
  notification: {
    create: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "user_stephen",
    name: "Stephen Burch",
    email: "stephen@ghostai.solutions",
    role: "Founder",
    preferredName: "Stephen",
    status: "Active",
    timezone: "America/Chicago"
  })
}));

describe("draft communication decisions", () => {
  it("prevents authors from approving their own draft", async () => {
    prismaMock.draftCommunication.findUnique.mockResolvedValue({
      id: "draft_1",
      authorId: "user_stephen",
      status: "PendingApproval"
    });

    const form = new FormData();
    form.set("draftId", "draft_1");
    form.set("decision", "Approved");
    form.set("approvalComments", "Approved");

    await expect(decideDraftCommunicationAction(form)).rejects.toThrow("Author cannot approve their own draft");
  });
});
