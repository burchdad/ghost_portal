import { env } from "@/server/env/env";

export type GhostCrmLead = {
  id: string;
  externalId: string | null;
  title: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  priority: string;
  value: number;
  leadScore: number;
  dealStage: string;
  dealAmount: number;
  updatedAt: string;
  sourceSystem: "ghostcrm-core";
};

export type GhostCrmStatus =
  | { configured: false; reason: "not_configured"; leads: GhostCrmLead[] }
  | { configured: true; ok: true; leads: GhostCrmLead[] }
  | { configured: true; ok: false; reason: string; leads: GhostCrmLead[] };

type GhostCrmLeadResponse = {
  success?: boolean;
  leads?: unknown[];
};

type GhostCrmSyncResponse = {
  success?: boolean;
  lead?: { id?: unknown };
  leadId?: unknown;
  error?: unknown;
};

export async function getGhostCrmLeads(limit = 100): Promise<GhostCrmStatus> {
  const baseUrl = ghostCrmBaseUrl();
  const token = ghostCrmApiKey();
  if (!baseUrl || !token) return { configured: false, reason: "not_configured", leads: [] };

  try {
    const url = new URL("/api/leads", baseUrl);
    url.searchParams.set("limit", String(limit));
    const response = await fetch(url, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` }
    });
    const body = await readJson(response);
    if (!response.ok) {
      return { configured: true, ok: false, reason: `GhostCRM Core returned ${response.status}: ${responseBodyText(body)}`, leads: [] };
    }
    const data = body as GhostCrmLeadResponse;
    return {
      configured: true,
      ok: true,
      leads: (data.leads ?? []).map(normalizeGhostCrmLead).filter(Boolean) as GhostCrmLead[]
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      reason: error instanceof Error ? error.message : "GhostCRM Core unavailable",
      leads: []
    };
  }
}

export async function syncLeadToGhostCrm(payload: {
  id: string;
  title: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  source?: string | null;
  stage?: string | null;
  priority?: string | null;
  value?: number | null;
  leadScore?: number | null;
  description?: string | null;
  tags?: string[];
  customFields?: Record<string, unknown>;
}) {
  const baseUrl = ghostCrmBaseUrl();
  const syncUrl = env.GHOSTCRM_SYNC_URL ?? (baseUrl ? new URL("/api/lead-command/sync", baseUrl).toString() : null);
  const token = ghostCrmApiKey();
  if (!syncUrl || !token) return { status: "not_configured" as const };

  const response = await fetch(syncUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      lead: {
        externalId: payload.id,
        organizationId: env.GHOSTCRM_ORGANIZATION_ID || undefined,
        title: payload.title,
        firstName: payload.firstName || undefined,
        lastName: payload.lastName || undefined,
        email: payload.email || undefined,
        phone: payload.phone || undefined,
        company: payload.company || undefined,
        website: payload.website || undefined,
        source: payload.source || "Ops Portal",
        stage: payload.stage || "new",
        priority: payload.priority || "medium",
        value: payload.value || 0,
        leadScore: payload.leadScore || 50,
        description: payload.description || undefined,
        tags: payload.tags || ["ops-portal"],
        customFields: payload.customFields || {}
      }
    })
  });
  const body = await readJson(response);
  if (!response.ok) {
    return { status: "failed" as const, error: `GhostCRM Core returned ${response.status}: ${responseBodyText(body)}` };
  }
  const data = body as GhostCrmSyncResponse;
  return { status: "synced" as const, externalId: stringValue(data.lead?.id) || stringValue(data.leadId) || null, response: body };
}

function ghostCrmBaseUrl() {
  const raw = env.GHOSTCRM_CORE_API_URL;
  return raw ? raw.replace(/\/+$/, "") : null;
}

function ghostCrmApiKey() {
  return env.GHOSTCRM_CORE_API_KEY ?? env.GHOSTCRM_API_KEY ?? null;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function responseBodyText(value: unknown) {
  if (typeof value === "string") return value.slice(0, 300);
  if (!value) return "No response body";
  return JSON.stringify(value).slice(0, 300);
}

function normalizeGhostCrmLead(value: unknown): GhostCrmLead | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const company = objectValue(record.company);
  const contact = objectValue(record.contact);
  const deals = Array.isArray(record.deals) ? record.deals : [];
  const primaryDeal = objectValue(deals[0]);
  const firstName = stringValue(contact.firstName);
  const lastName = stringValue(contact.lastName);
  const title = stringValue(record.title);
  const id = stringValue(record.id);
  if (!id || !title) return null;

  return {
    id,
    externalId: stringValue(record.externalId) || null,
    title,
    companyName: stringValue(company.name),
    contactName: [firstName, lastName].filter(Boolean).join(" ") || title,
    email: stringValue(contact.email),
    phone: stringValue(contact.phone),
    source: stringValue(record.source) || "unknown",
    stage: stringValue(record.stage) || "new",
    priority: stringValue(record.priority) || "medium",
    value: numberValue(record.value),
    leadScore: numberValue(record.leadScore),
    dealStage: stringValue(primaryDeal.stage),
    dealAmount: numberValue(primaryDeal.amount),
    updatedAt: stringValue(record.updatedAt),
    sourceSystem: "ghostcrm-core"
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
