import { ClientStatus, RiskStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canAccessClient, canAccessLead, canModifyTask, minimizeClientForUser } from "@/server/permissions/authorize";
import type { AuthzUser } from "@/server/permissions/roles";

const prismaMock = {
  clientAccess: {
    findUnique: vi.fn()
  },
  leadAccess: {
    findUnique: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

const alex: AuthzUser = {
  id: "user_alex",
  name: "Alexandra Marie Canto",
  email: "amariexc@gmail.com",
  role: "Operations"
};

const stephen: AuthzUser = {
  id: "user_stephen",
  name: "Stephen Burch",
  email: "stephen@ghostai.solutions",
  role: "Founder"
};

describe("record-level authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies Operations access to an unassigned client", async () => {
    prismaMock.clientAccess.findUnique.mockResolvedValue(null);

    await expect(canAccessClient(alex, "client_unassigned")).resolves.toBe(false);
  });

  it("denies Operations access after client access is revoked", async () => {
    prismaMock.clientAccess.findUnique.mockResolvedValue(null);

    await expect(canAccessClient(alex, "client_revoked")).resolves.toBe(false);
  });

  it("allows Operations access to an assigned client", async () => {
    prismaMock.clientAccess.findUnique.mockResolvedValue({ access: "Edit" });

    await expect(canAccessClient(alex, "client_assigned", "View")).resolves.toBe(true);
  });

  it("denies Operations access to an unassigned lead", async () => {
    prismaMock.leadAccess.findUnique.mockResolvedValue(null);

    await expect(canAccessLead(alex, "lead_unassigned")).resolves.toBe(false);
  });

  it("allows Founder to bypass record assignments", async () => {
    await expect(canAccessClient(stephen, "any_client")).resolves.toBe(true);
    await expect(canAccessLead(stephen, "any_lead")).resolves.toBe(true);
  });

  it("removes founder-only notes for Operations users", () => {
    const client = {
      id: "client_1",
      company: "Demo",
      status: ClientStatus.Active,
      services: [],
      riskStatus: RiskStatus.Low,
      nextFollowUp: null,
      operationalNotes: "Visible",
      founderOnlyNotes: "Restricted",
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null
    };

    expect(minimizeClientForUser(alex, client).founderOnlyNotes).toBeNull();
    expect(minimizeClientForUser(stephen, client).founderOnlyNotes).toBe("Restricted");
  });

  it("allows Operations to modify only their own active tasks", () => {
    expect(canModifyTask(alex, { ownerId: alex.id, archivedAt: null })).toBe(true);
    expect(canModifyTask(alex, { ownerId: "someone_else", archivedAt: null })).toBe(false);
    expect(canModifyTask(alex, { ownerId: alex.id, archivedAt: new Date() })).toBe(false);
  });
});
