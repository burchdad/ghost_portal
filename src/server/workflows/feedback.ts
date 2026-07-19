"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

const feedbackSchema = z.object({
  type: z.enum(["Bug", "WorkflowIssue", "FeatureRequest", "ConfusingInterface", "MissingInformation", "NovaSuggestion", "MissionControlSuggestion", "Other"]),
  title: z.string().min(3),
  description: z.string().min(3),
  pageOrFeature: z.string().optional(),
  severity: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium")
});

export async function submitFeedbackAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "feedback:create")) throw new Error("Forbidden: feedback:create");

  const parsed = feedbackSchema.parse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    pageOrFeature: formData.get("pageOrFeature"),
    severity: formData.get("severity") ?? "Medium"
  });

  const feedback = await getPrisma().feedbackSubmission.create({
    data: {
      ...parsed,
      submittedById: user.id
    }
  });

  await writeAuditLog({ userId: user.id, action: "feedback.submitted", entity: "FeedbackSubmission", entityId: feedback.id, after: { type: feedback.type, severity: feedback.severity } });
  revalidatePath("/feedback");
}

export async function updateFeedbackStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "feedback:read")) throw new Error("Forbidden: feedback:read");

  const parsed = z.object({
    feedbackId: z.string().min(1),
    status: z.enum(["Reviewing", "Planned", "InProgress", "Completed", "Declined"]),
    founderResponse: z.string().optional()
  }).parse({
    feedbackId: formData.get("feedbackId"),
    status: formData.get("status"),
    founderResponse: formData.get("founderResponse")
  });

  await getPrisma().feedbackSubmission.update({
    where: { id: parsed.feedbackId },
    data: {
      status: parsed.status,
      founderResponse: parsed.founderResponse
    }
  });

  await writeAuditLog({ userId: user.id, action: "feedback.updated", entity: "FeedbackSubmission", entityId: parsed.feedbackId, after: { status: parsed.status } });
  revalidatePath("/feedback");
}
