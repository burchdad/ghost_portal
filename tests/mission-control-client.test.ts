import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

describe("Mission Control client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("uses the deployed GHOST_MISSION_CONTROL webhook env aliases", async () => {
    delete process.env.MISSION_CONTROL_WEBHOOK_URL;
    delete process.env.MISSION_CONTROL_WEBHOOK_SECRET;
    process.env.GHOST_MISSION_CONTROL_WEBHOOK_URL = "https://mission.example.test/handoff";
    process.env.GHOST_MISSION_CONTROL_WEBHOOK_SECRET = "secret-token";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ id: "mc_alias_1" }))
    });
    vi.stubGlobal("fetch", fetchMock);

    const { syncLeadHandoffToMissionControl } = await import("@/server/mission-control/client");
    const result = await syncLeadHandoffToMissionControl({
      sourceSystem: "Ghost Ops Portal",
      leadId: "lead_1",
      missionControlStage: "Sales-Ready - Needs Discovery",
      businessName: "Acme Plumbing",
      contactName: "Dana",
      phone: "555-0100",
      email: null,
      website: null,
      industry: "Home Services",
      location: "Texas",
      leadSource: "Manual Cold Call",
      setter: null,
      conversationSummary: "Possible website need.",
      callHistorySummary: null,
      needDiscovered: ["Website"],
      interestLevel: "Possible",
      decisionMakerStatus: null,
      recommendedOffer: "Needs Discovery",
      qualificationSummary: null,
      followUpDate: null,
      appointmentDate: null,
      appointmentStatus: "Discovery follow-up requested",
      doNotContact: false,
      recommendedNextAction: "Book discovery call."
    });

    expect(result).toEqual({ status: "sent", externalId: "mc_alias_1", response: { id: "mc_alias_1" } });
    expect(fetchMock).toHaveBeenCalledWith("https://mission.example.test/handoff", expect.objectContaining({
      headers: expect.objectContaining({
        authorization: "Bearer secret-token",
        "x-ghost-webhook-secret": "secret-token",
        "x-webhook-secret": "secret-token"
      })
    }));
  });
});
