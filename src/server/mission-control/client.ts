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
  if (!env.MISSION_CONTROL_WEBHOOK_URL) {
    return { status: "not_configured" };
  }

  try {
    const response = await fetch(env.MISSION_CONTROL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.MISSION_CONTROL_WEBHOOK_SECRET ? { authorization: `Bearer ${env.MISSION_CONTROL_WEBHOOK_SECRET}` } : {})
      },
      body: JSON.stringify({
        event: "ghost_portal.lead_handoff",
        payload
      })
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
