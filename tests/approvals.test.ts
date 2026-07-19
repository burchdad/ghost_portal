import { describe, expect, it, vi } from "vitest";
import { decideApproval } from "@/server/workflows/approvals";

const prismaMock = {
  approval: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", async () => {
  const actual = await vi.importActual<typeof import("@/server/permissions/authorize")>("@/server/permissions/authorize");
  return {
    ...actual,
    requireUser: vi.fn().mockResolvedValue({
      id: "user_stephen",
      name: "Stephen Burch",
      email: "stephen@ghostai.solutions",
      role: "Founder",
      preferredName: "Stephen",
      status: "Active",
      timezone: "America/Chicago"
    })
  };
});

describe("approval decisions", () => {
  it("blocks users from approving their own request", async () => {
    prismaMock.approval.findUnique.mockResolvedValue({
      id: "approval_1",
      requesterId: "user_stephen",
      status: "Open"
    });

    await expect(decideApproval("approval_1", "Approved", "Looks good")).rejects.toThrow("Requester cannot approve their own request.");
  });
});
