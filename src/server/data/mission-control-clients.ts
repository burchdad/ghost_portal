import { env } from "@/server/env/env";

export type MissionControlClientRecord = {
  id: string;
  clientName: string;
  stage: string;
  websiteUrl: string;
  repo: string;
  githubUrl: string;
  railwayUrl: string;
  vercelUrl: string;
  businessEmail: string;
  businessPhone: string;
  contact: string;
  plan: string;
  notes: string;
  services: string[];
  plannedServices: string[];
  relationshipType: string;
  pricingTier: string;
  supportUrl: string;
  actions: string[];
  updatedAt: string;
  source: "mission-control";
};

type MissionControlClientsResponse = {
  clients?: unknown[];
  dataHealth?: unknown;
  storage?: unknown;
};

export function missionClientRouteId(id: string) {
  return `mission-${encodeURIComponent(id)}`;
}

export function parseMissionClientRouteId(routeId: string) {
  if (routeId.startsWith("mission-")) return decodeURIComponent(routeId.slice("mission-".length));
  if (routeId.startsWith("mission:")) return decodeURIComponent(routeId.slice("mission:".length));
  return null;
}

export async function getMissionControlClients() {
  const url = missionControlClientsUrl();
  if (!url) return { ok: false as const, reason: "not_configured" as const, clients: [] };

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: missionControlHeaders()
    });
    if (!response.ok) {
      return { ok: false as const, reason: `Mission Control returned ${response.status}`, clients: [] };
    }

    const body = await response.json() as MissionControlClientsResponse;
    return {
      ok: true as const,
      clients: (body.clients ?? []).map(normalizeMissionControlClient).filter(Boolean) as MissionControlClientRecord[],
      dataHealth: body.dataHealth,
      storage: body.storage
    };
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : "Mission Control clients unavailable",
      clients: []
    };
  }
}

export async function getMissionControlClientById(id: string) {
  const result = await getMissionControlClients();
  return {
    ...result,
    client: result.clients.find((client) => client.id === id) ?? null
  };
}

function missionControlClientsUrl() {
  const explicitBase = env.GHOST_MISSION_CONTROL_API_URL;
  const webhookUrl = env.GHOST_MISSION_CONTROL_WEBHOOK_URL ?? env.MISSION_CONTROL_WEBHOOK_URL;
  const raw = explicitBase ?? webhookUrl;
  if (!raw) return null;

  const url = new URL(raw);
  url.pathname = "/mission/clients";
  url.search = "refresh=true";
  return url.toString();
}

function missionControlHeaders(): Record<string, string> {
  const secret = env.GHOST_MISSION_CONTROL_WEBHOOK_SECRET ?? env.MISSION_CONTROL_WEBHOOK_SECRET;
  return secret
    ? {
        authorization: `Bearer ${secret}`,
        "x-ghost-webhook-secret": secret,
        "x-webhook-secret": secret,
        "x-mission-control-token": secret
      }
    : {};
}

function normalizeMissionControlClient(value: unknown): MissionControlClientRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = stringValue(record.id);
  const clientName = stringValue(record.clientName ?? record.client_name ?? record.name);
  if (!id || !clientName) return null;

  return {
    id,
    clientName,
    stage: stringValue(record.stage ?? record.status) || "unknown",
    websiteUrl: stringValue(record.websiteUrl ?? record.website_url),
    repo: stringValue(record.repo),
    githubUrl: stringValue(record.githubUrl ?? record.github_url),
    railwayUrl: stringValue(record.railwayUrl ?? record.railway_url),
    vercelUrl: stringValue(record.vercelUrl ?? record.vercel_url),
    businessEmail: stringValue(record.businessEmail ?? record.business_email),
    businessPhone: stringValue(record.businessPhone ?? record.business_phone),
    contact: stringValue(record.contact),
    plan: stringValue(record.plan),
    notes: stringValue(record.notes),
    services: stringArray(record.services),
    plannedServices: stringArray(record.plannedServices ?? record.planned_services),
    relationshipType: stringValue(record.relationshipType ?? record.relationship_type),
    pricingTier: stringValue(record.pricingTier ?? record.pricing_tier),
    supportUrl: stringValue(record.supportUrl ?? record.support_url),
    actions: stringArray(record.actions),
    updatedAt: stringValue(record.updatedAt ?? record.updated_at),
    source: "mission-control"
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}
