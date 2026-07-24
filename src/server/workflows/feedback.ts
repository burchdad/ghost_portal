"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { recordActivity } from "@/server/workflows/activity";
import { createNotification } from "@/server/workflows/notifications";

const feedbackSchema = z.object({
  type: z.enum(["Bug", "EmployeeOnboardingBeta", "ConfusingWording", "BrokenWorkflow", "PermissionIssue", "TrainingIssue", "PricingQuestion", "ServiceQuestion", "ProcessImprovement", "WorkflowIssue", "FeatureRequest", "ConfusingInterface", "MissingInformation", "NovaSuggestion", "MissionControlSuggestion", "Other"]),
  title: z.string().min(3),
  description: z.string().min(3),
  pageOrFeature: z.string().optional(),
  missionControlArea: z.string().optional(),
  expectedResult: z.string().optional(),
  actualResult: z.string().optional(),
  workaroundTried: z.string().optional(),
  blocked: z.boolean().default(false),
  severity: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium")
});

export async function submitFeedbackAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "support:create") && !hasPermission(user, "feedback:create")) throw new Error("Forbidden: support:create");

  const parsed = feedbackSchema.parse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    pageOrFeature: stringOrUndefined(formData.get("pageOrFeature")),
    missionControlArea: stringOrUndefined(formData.get("missionControlArea")),
    expectedResult: stringOrUndefined(formData.get("expectedResult")),
    actualResult: stringOrUndefined(formData.get("actualResult")),
    workaroundTried: stringOrUndefined(formData.get("workaroundTried")),
    blocked: formData.get("blocked") === "on",
    severity: formData.get("severity") ?? "Medium"
  });

  const feedback = await getPrisma().feedbackSubmission.create({
    data: {
      ...parsed,
      supportKey: createSupportKey(),
      agentSummary: buildAgentSummary(parsed),
      submittedById: user.id
    }
  });

  const founders = await getPrisma().user.findMany({ where: { role: { name: "Founder" }, status: "Active" }, select: { id: true } });

  await Promise.all([
    ...founders.map((founder) => createNotification({
      userId: founder.id,
      title: `${feedback.supportKey} support ticket`,
      body: `${feedback.severity}: ${feedback.title}`,
      href: `/admin/support?ticketId=${feedback.id}`
    })),
    recordActivity({ actorId: user.id, action: "submitted support ticket", target: `${feedback.supportKey}: ${feedback.title}` }),
    writeAuditLog({ userId: user.id, action: "support_ticket.submitted", entity: "FeedbackSubmission", entityId: feedback.id, after: { supportKey: feedback.supportKey, type: feedback.type, severity: feedback.severity, blocked: feedback.blocked } })
  ]);

  revalidatePath("/support");
  revalidatePath("/admin/support");
  revalidatePath("/feedback");
}

export async function updateFeedbackStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "support:triage") && !hasPermission(user, "feedback:read")) throw new Error("Forbidden: support:triage");

  const parsed = z.object({
    feedbackId: z.string().min(1),
    status: z.enum(["Reviewing", "Planned", "InProgress", "Completed", "Declined"]),
    founderResponse: z.string().optional(),
    resolutionNotes: z.string().optional(),
    missionControlArea: z.string().optional()
  }).parse({
    feedbackId: formData.get("feedbackId"),
    status: formData.get("status"),
    founderResponse: stringOrUndefined(formData.get("founderResponse")),
    resolutionNotes: stringOrUndefined(formData.get("resolutionNotes")),
    missionControlArea: stringOrUndefined(formData.get("missionControlArea"))
  });

  const updated = await getPrisma().feedbackSubmission.update({
    where: { id: parsed.feedbackId },
    data: {
      status: parsed.status,
      founderResponse: parsed.founderResponse,
      resolutionNotes: parsed.resolutionNotes,
      missionControlArea: parsed.missionControlArea,
      resolvedAt: parsed.status === "Completed" || parsed.status === "Declined" ? new Date() : null
    }
  });

  await Promise.all([
    createNotification({
      userId: updated.submittedById,
      title: `${updated.supportKey ?? "Support ticket"} updated`,
      body: `${updated.status}${updated.founderResponse ? `: ${updated.founderResponse.slice(0, 140)}` : ""}`,
      href: `/support?ticketId=${updated.id}`
    }),
    recordActivity({ actorId: user.id, action: "updated support ticket", target: `${updated.supportKey ?? updated.id}: ${updated.status}` }),
    writeAuditLog({ userId: user.id, action: "support_ticket.updated", entity: "FeedbackSubmission", entityId: parsed.feedbackId, after: { status: parsed.status, missionControlArea: parsed.missionControlArea } })
  ]);
  revalidatePath("/support");
  revalidatePath("/admin/support");
  revalidatePath("/feedback");
}

function createSupportKey() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GSA-${timestamp}-${suffix}`;
}

function buildAgentSummary(input: z.infer<typeof feedbackSchema>) {
  return [
    `Area: ${input.missionControlArea ?? "Unspecified"}`,
    `Severity: ${input.severity}${input.blocked ? " - work blocked" : ""}`,
    `Page/feature: ${input.pageOrFeature ?? "Not provided"}`,
    `Expected: ${input.expectedResult ?? "Not provided"}`,
    `Actual: ${input.actualResult ?? "Not provided"}`,
    `Workaround: ${input.workaroundTried ?? "Not provided"}`
  ].join("\n");
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
