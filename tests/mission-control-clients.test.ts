import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

describe("Mission Control clients data adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("loads clients from the Mission Control clients endpoint derived from the webhook URL", async () => {
    process.env.GHOST_MISSION_CONTROL_WEBHOOK_URL = "https://mission.example.test/mission/web-helper-requests";
    process.env.GHOST_MISSION_CONTROL_WEBHOOK_SECRET = "shared-secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        clients: [
          {
            id: "ghost-ai-solutions",
            clientName: "Ghost AI Solutions",
            stage: "growth-services",
            websiteUrl: "https://www.ghostai.solutions",
            repo: "burchdad/ghostaisolutions",
            services: ["website-build", "web-helper-care"],
            actions: ["Define monthly scope."]
          },
          {
            id: "codex-geo-smoke-co",
            clientName: "Codex GEO Smoke Co",
            stage: "lead",
            websiteUrl: "https://www.ghostai.solutions",
            repo: "",
            services: []
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getMissionControlClients, missionClientRouteId, parseMissionClientRouteId } = await import("@/server/data/mission-control-clients");
    const result = await getMissionControlClients();

    expect(fetchMock).toHaveBeenCalledWith("https://mission.example.test/mission/clients?refresh=true", expect.objectContaining({
      cache: "no-store",
      headers: expect.objectContaining({
        authorization: "Bearer shared-secret",
        "x-ghost-webhook-secret": "shared-secret"
      })
    }));
    expect(result).toMatchObject({
      ok: true,
      clients: [
        {
          id: "ghost-ai-solutions",
          clientName: "Ghost AI Solutions",
          stage: "growth-services",
          websiteUrl: "https://www.ghostai.solutions",
          repo: "burchdad/ghostaisolutions",
          services: ["website-build", "web-helper-care"],
          source: "mission-control"
        }
      ]
    });
    expect(result.clients).toHaveLength(1);
    expect(parseMissionClientRouteId(missionClientRouteId("ghost-ai-solutions"))).toBe("ghost-ai-solutions");
  });
});
