import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

describe("GhostCRM Core adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("reports not configured when the core URL or API key is missing", async () => {
    delete process.env.GHOSTCRM_CORE_API_URL;
    delete process.env.GHOSTCRM_CORE_API_KEY;
    delete process.env.GHOSTCRM_API_KEY;
    delete process.env.GHOSTCRM_SYNC_URL;

    const { getGhostCrmLeads, syncLeadToGhostCrm } = await import("@/server/data/ghostcrm-core");

    await expect(getGhostCrmLeads()).resolves.toEqual({
      configured: false,
      reason: "not_configured",
      leads: []
    });
    await expect(syncLeadToGhostCrm({ id: "lead_1", title: "Acme" })).resolves.toEqual({ status: "not_configured" });
  });

  it("loads and normalizes leads from GhostCRM Core", async () => {
    process.env.GHOSTCRM_CORE_API_URL = "https://ghostcrm-core.example.test";
    process.env.GHOSTCRM_CORE_API_KEY = "core-token";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({
        success: true,
        leads: [{
          id: "crm_lead_1",
          externalId: "ops_lead_1",
          title: "Dana at Acme",
          source: "Ops Portal",
          stage: "qualified",
          priority: "high",
          value: 12000,
          leadScore: 84,
          updatedAt: "2026-08-03T12:00:00.000Z",
          company: { name: "Acme Plumbing" },
          contact: { firstName: "Dana", lastName: "Lee", email: "dana@example.test", phone: "555-0100" },
          deals: [{ stage: "discovery", amount: 12000 }]
        }]
      }))
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getGhostCrmLeads } = await import("@/server/data/ghostcrm-core");
    const result = await getGhostCrmLeads(25);

    expect(fetchMock).toHaveBeenCalledWith(new URL("https://ghostcrm-core.example.test/api/leads?limit=25"), expect.objectContaining({
      cache: "no-store",
      headers: { authorization: "Bearer core-token" }
    }));
    expect(result).toEqual({
      configured: true,
      ok: true,
      leads: [expect.objectContaining({
        id: "crm_lead_1",
        externalId: "ops_lead_1",
        title: "Dana at Acme",
        companyName: "Acme Plumbing",
        contactName: "Dana Lee",
        email: "dana@example.test",
        phone: "555-0100",
        stage: "qualified",
        dealAmount: 12000,
        sourceSystem: "ghostcrm-core"
      })]
    });
  });

  it("syncs an Ops Portal lead through the lead command endpoint", async () => {
    process.env.GHOSTCRM_CORE_API_URL = "https://ghostcrm-core.example.test";
    process.env.GHOSTCRM_CORE_API_KEY = "core-token";
    process.env.GHOSTCRM_ORGANIZATION_ID = "org_ghost";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ success: true, leadId: "crm_lead_2" }))
    });
    vi.stubGlobal("fetch", fetchMock);

    const { syncLeadToGhostCrm } = await import("@/server/data/ghostcrm-core");
    const result = await syncLeadToGhostCrm({
      id: "ops_lead_2",
      title: "Alex at Haven",
      firstName: "Alex",
      lastName: "Morgan",
      email: "alex@example.test",
      company: "Haven Design",
      stage: "qualified",
      value: 8000,
      leadScore: 72,
      customFields: { opsPortalLeadId: "ops_lead_2" }
    });

    expect(result).toEqual({ status: "synced", externalId: "crm_lead_2", response: { success: true, leadId: "crm_lead_2" } });
    expect(fetchMock).toHaveBeenCalledWith("https://ghostcrm-core.example.test/api/lead-command/sync", expect.objectContaining({
      method: "POST",
      headers: {
        authorization: "Bearer core-token",
        "content-type": "application/json"
      }
    }));
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({
      lead: expect.objectContaining({
        externalId: "ops_lead_2",
        organizationId: "org_ghost",
        title: "Alex at Haven",
        firstName: "Alex",
        lastName: "Morgan",
        email: "alex@example.test",
        company: "Haven Design",
        source: "Ops Portal",
        stage: "qualified",
        value: 8000,
        leadScore: 72,
        customFields: { opsPortalLeadId: "ops_lead_2" }
      })
    });
  });
});
