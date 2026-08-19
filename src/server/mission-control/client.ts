import { env } from "@/server/env/env";

export type MissionControlLeadPayload = {
  sourceSystem: "Ghost Ops Portal";
  leadId: string;
  missionControlStage: string;
  businessName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  leadSource: string;
  setter: { id: string; name: string } | null;
  conversationSummary: string;
  callHistorySummary: string | null;
  needDiscovered: string[];
  interestLevel: string;
  decisionMakerStatus: string | null;
  recommendedOffer: string;
  qualificationSummary: string | null;
  followUpDate: string | null;
  appointmentDate: string | null;
  appointmentStatus: string | null;
  doNotContact: boolean;
  recommendedNextAction: string;
};

export type MissionControlSyncResult =
  | { status: "not_configured" }
  | { status: "sent"; externalId?: string; response?: unknown }
  | { status: "failed"; error: string };

export async function syncLeadHandoffToMissionControl(payload: MissionControlLeadPayload): Promise<MissionControlSyncResult> {
  const webhookUrl = env.MISSION_CONTROL_WEBHOOK_URL ?? env.GHOST_MISSION_CONTROL_WEBHOOK_URL;
  const webhookSecret = env.MISSION_CONTROL_WEBHOOK_SECRET ?? env.GHOST_MISSION_CONTROL_WEBHOOK_SECRET;

  if (!webhookUrl) {
    return { status: "not_configured" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(webhookSecret
          ? {
              authorization: `Bearer ${webhookSecret}`,
              "x-ghost-webhook-secret": webhookSecret,
              "x-webhook-secret": webhookSecret,
              "x-mission-control-token": webhookSecret
            }
          : {})
      },
      body: JSON.stringify(buildWebhookBody(payload))
    });

    const responseBody = await readResponseBody(response);
    if (!response.ok) {
      return { status: "failed", error: `Mission Control helper returned ${response.status}: ${responseBodyText(responseBody)}` };
    }

    return {
      status: "sent",
      externalId: extractExternalId(responseBody),
      response: responseBody
    };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Unknown Mission Control sync failure" };
  }
}

function buildWebhookBody(payload: MissionControlLeadPayload) {
  const leadName = payload.businessName ?? payload.contactName ?? payload.leadId;
  const summary = `Lead handoff: ${leadName}`;
  const clientIdentity = getMissionControlClientIdentity();
  const details = [
    `Stage: ${payload.missionControlStage}`,
    `Client: ${clientIdentity.clientName}`,
    `Need: ${payload.needDiscovered.join(", ") || "Not specified"}`,
    `Interest: ${payload.interestLevel}`,
    `Recommended next action: ${payload.recommendedNextAction}`,
    payload.conversationSummary ? `Conversation: ${payload.conversationSummary}` : null
  ].filter(Boolean).join("\n");

  return {
    event: "ghost_portal.lead_handoff",
    source: "client_admin_dashboard",
    requestType: "lead_handoff",
    request_type: "lead_handoff",
    priority: payload.interestLevel === "StrongInterest" || payload.interestLevel === "MeetingRequested" ? "High" : "Medium",
    summary,
    title: summary,
    details,
    message: details,
    clientId: clientIdentity.clientId,
    client: clientIdentity.clientName,
    clientName: clientIdentity.clientName,
    client_name: clientIdentity.clientName,
    site: clientIdentity.siteUrl,
    siteUrl: clientIdentity.siteUrl,
    site_url: clientIdentity.siteUrl,
    websiteUrl: clientIdentity.siteUrl,
    website_url: clientIdentity.siteUrl,
    repo: clientIdentity.repo,
    githubRepo: clientIdentity.repo,
    github_repo: clientIdentity.repo,
    webHelperId: clientIdentity.webHelperId,
    page_url: "/leads",
    leadId: payload.leadId,
    businessName: payload.businessName,
    contactName: payload.contactName,
    email: payload.email,
    phone: payload.phone,
    missionControlStage: payload.missionControlStage,
    payload,
    lead: payload,
    metadata: {
      sourceSystem: payload.sourceSystem,
      source: "ghost_ops_portal",
      clientId: clientIdentity.clientId,
      clientName: clientIdentity.clientName,
      siteUrl: clientIdentity.siteUrl,
      repo: clientIdentity.repo,
      leadId: payload.leadId,
      missionControlStage: payload.missionControlStage,
      recommendedOffer: payload.recommendedOffer,
      doNotContact: payload.doNotContact
    }
  };
}

function getMissionControlClientIdentity() {
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://opsportal.ghostai.solutions";
  const clientId = env.GHOST_CLIENT_ID ?? "ghostcrm";
  return {
    clientId,
    clientName: env.GHOST_CLIENT_NAME ?? "GhostCRM",
    siteUrl: env.GHOST_SITE_URL ?? appUrl,
    repo: env.GHOST_REPO ?? "burchdad/ghost_portal",
    webHelperId: env.GHOST_WEB_HELPER_ID ?? `${clientId}-web-helper`
  };
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function responseBodyText(value: unknown) {
  if (typeof value === "string") return value.slice(0, 500);
  if (!value) return "No response body";
  return JSON.stringify(value).slice(0, 500);
}

function extractExternalId(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const candidate = record.id ?? record.externalId ?? record.missionControlId ?? record.recordId;
  return typeof candidate === "string" ? candidate : undefined;
}
