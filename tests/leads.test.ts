import { describe, expect, it, beforeEach, vi } from "vitest";
import { createLeadAction, logCallActivityAction, sendLeadToMissionControlAction } from "@/server/workflows/leads";
import { syncLeadHandoffToMissionControl } from "@/server/mission-control/client";

const prismaMock = {
  lead: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn()
  },
  leadAccess: {
    upsert: vi.fn()
  },
  callActivity: {
    create: vi.fn()
  },
  activity: {
    create: vi.fn()
  },
  approval: {
    create: vi.fn()
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
  canAccessLead: vi.fn().mockResolvedValue(true)
}));

vi.mock("@/server/audit/audit", () => ({
  writeAuditLog: vi.fn()
}));

vi.mock("@/server/mission-control/client", () => ({
  syncLeadHandoffToMissionControl: vi.fn().mockResolvedValue({ status: "not_configured" })
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  })
}));

describe("lead workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations));
    prismaMock.leadAccess.upsert.mockResolvedValue({});
    prismaMock.activity.create.mockResolvedValue({ id: "activity_1" });
    prismaMock.approval.create.mockResolvedValue({ id: "approval_1" });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit_1" });
    vi.mocked(syncLeadHandoffToMissionControl).mockResolvedValue({ status: "not_configured" });
  });

  it("creates a raw cold-call lead without service interest or estimated value", async () => {
    prismaMock.lead.create.mockResolvedValue({ id: "lead_1", company: "Acme Plumbing", leadSource: "Manual Cold Call" });

    const form = new FormData();
    form.set("company", "Acme Plumbing");
    form.set("contactMethod", "555-0100");
    form.set("leadSource", "Manual Cold Call");
    form.set("assignedUserId", "user_alex");
    form.set("intent", "startCall");

    await expect(createLeadAction(form)).rejects.toThrow("redirect:/leads/lead_1?call=1#quick-call");

    const createData = prismaMock.lead.create.mock.calls[0]?.[0].data;
    expect(createData).toMatchObject({
      company: "Acme Plumbing",
      contactPhone: "555-0100",
      leadSource: "Manual Cold Call",
      assignedUserId: "user_alex",
      serviceInterest: "Unknown"
    });
    expect(createData).not.toHaveProperty("estimatedValue");
  });

  it("logs call details, creates activity, and opens approval when a pricing trigger appears", async () => {
    prismaMock.callActivity.create.mockResolvedValue({ id: "call_1" });
    prismaMock.lead.update.mockResolvedValue({ id: "lead_1" });

    const form = new FormData();
    form.set("leadId", "lead_1");
    form.set("outcome", "Decision-Maker Reached");
    form.set("summary", "Asked for a discount before seeing scope.");
    form.set("decisionMakerStatus", "Decision-maker confirmed");
    form.set("pricingRequested", "on");
    form.set("discountRequested", "on");

    await logCallActivityAction(form);

    expect(prismaMock.callActivity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        outcome: "Decision-Maker Reached",
        decisionMakerStatus: "Decision-maker confirmed"
      })
    }));
    expect(prismaMock.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "logged call: Decision-Maker Reached" })
    }));
    expect(prismaMock.approval.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        summary: expect.stringContaining("Pricing requested")
      })
    }));
  });

  it("blocks discovery handoff until partial Mission Control minimums exist", async () => {
    prismaMock.lead.findUnique.mockResolvedValue({
      id: "lead_1",
      company: "Acme Plumbing",
      contactName: null,
      contactPhone: "555-0100",
      contactEmail: null,
      website: null,
      industry: null,
      location: null,
      leadSource: "Manual Cold Call",
      assignedUser: null,
      needDiscovered: [],
      interestLevel: "Unknown",
      decisionMakerStatus: null,
      recommendedGhostOffer: null,
      qualificationSummary: null,
      followUpDate: null,
      appointmentDate: null,
      appointmentStatus: null,
      doNotContact: false,
      callActivities: []
    });

    const form = new FormData();
    form.set("leadId", "lead_1");
    form.set("level", "discovery");
    form.set("conversationSummary", "Talked briefly.");
    form.set("recommendedNextAction", "Call back Friday.");

    await expect(sendLeadToMissionControlAction(form)).rejects.toThrow("identified or suspected need");
  });

  it("stores a partial Mission Control discovery payload when minimums are met", async () => {
    prismaMock.lead.findUnique.mockResolvedValue({
      id: "lead_1",
      company: "Acme Plumbing",
      contactName: "Dana",
      contactPhone: "555-0100",
      contactEmail: null,
      website: null,
      industry: "Home Services",
      location: "Texas",
      leadSource: "Manual Cold Call",
      assignedUser: { id: "user_alex", name: "Alexandra Marie Canto", preferredName: "Alex" },
      needDiscovered: ["Website"],
      interestLevel: "Possible",
      decisionMakerStatus: "Unknown",
      recommendedGhostOffer: null,
      qualificationSummary: null,
      followUpDate: new Date("2026-07-24T15:00:00.000Z"),
      appointmentDate: null,
      appointmentStatus: null,
      doNotContact: false,
      callActivities: [{ outcome: "Interested", summary: "Asked for website examples.", occurredAt: new Date("2026-07-23T15:00:00.000Z") }]
    });
    prismaMock.lead.update.mockResolvedValue({ id: "lead_1" });

    const form = new FormData();
    form.set("leadId", "lead_1");
    form.set("level", "discovery");
    form.set("conversationSummary", "Possible website need.");
    form.set("recommendedNextAction", "Book discovery call.");

    await sendLeadToMissionControlAction(form);

    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        handoffStatus: "SalesReadyNeedsDiscovery",
        missionControlStatus: "Ready to Sync",
        missionControlStage: "Sales-Ready - Needs Discovery",
        missionControlPayload: expect.objectContaining({
          businessName: "Acme Plumbing",
          recommendedOffer: "Needs Discovery",
          needDiscovered: ["Website"],
          helperSync: { status: "not_configured" }
        })
      })
    }));
  });

  it("marks the lead sent when the Mission Control helper accepts the handoff", async () => {
    vi.mocked(syncLeadHandoffToMissionControl).mockResolvedValue({ status: "sent", externalId: "mc_123", response: { id: "mc_123" } });
    prismaMock.lead.findUnique.mockResolvedValue({
      id: "lead_1",
      company: "Acme Plumbing",
      contactName: "Dana",
      contactPhone: "555-0100",
      contactEmail: null,
      website: null,
      industry: "Home Services",
      location: "Texas",
      leadSource: "Manual Cold Call",
      assignedUser: { id: "user_alex", name: "Alexandra Marie Canto", preferredName: "Alex" },
      needDiscovered: ["Website"],
      interestLevel: "Possible",
      decisionMakerStatus: "Unknown",
      recommendedGhostOffer: null,
      qualificationSummary: null,
      followUpDate: new Date("2026-07-24T15:00:00.000Z"),
      appointmentDate: null,
      appointmentStatus: null,
      doNotContact: false,
      callActivities: []
    });
    prismaMock.lead.update.mockResolvedValue({ id: "lead_1" });

    const form = new FormData();
    form.set("leadId", "lead_1");
    form.set("level", "discovery");
    form.set("conversationSummary", "Possible website need.");
    form.set("recommendedNextAction", "Book discovery call.");

    await sendLeadToMissionControlAction(form);

    expect(syncLeadHandoffToMissionControl).toHaveBeenCalledWith(expect.objectContaining({
      businessName: "Acme Plumbing",
      missionControlStage: "Sales-Ready - Needs Discovery"
    }));
    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        handoffStatus: "SentToMissionControl",
        missionControlStatus: "Sent to Mission Control",
        missionControlPayload: expect.objectContaining({
          helperSync: { status: "sent", externalId: "mc_123", response: { id: "mc_123" } }
        })
      })
    }));
  });
});
