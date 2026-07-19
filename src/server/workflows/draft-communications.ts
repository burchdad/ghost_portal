"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { canAccessClient, canAccessLead, requireUser } from "@/server/permissions/authorize";
import { createNotification } from "@/server/workflows/notifications";

const draftSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  channel: z.enum(["Email", "SMS", "Facebook", "LinkedIn", "WhatsApp", "Phone follow-up", "Other"]),
  recipient: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  purpose: z.string().min(1),
  submitForApproval: z.boolean().default(false)
});

export async function createDraftCommunicationAction(formData: FormData) {
  const user = await requireUser();
  const parsed = draftSchema.parse({
    clientId: stringOrUndefined(formData.get("clientId")),
    leadId: stringOrUndefined(formData.get("leadId")),
    channel: formData.get("channel"),
    recipient: formData.get("recipient"),
    subject: stringOrUndefined(formData.get("subject")),
    body: formData.get("body"),
    purpose: formData.get("purpose"),
    submitForApproval: formData.get("submitForApproval") === "on"
  });

  if (!parsed.clientId && !parsed.leadId) throw new Error("Draft must relate to a client or lead.");
  if (parsed.clientId && !(await canAccessClient(user, parsed.clientId, "View"))) throw new Error("Forbidden: client");
  if (parsed.leadId && !(await canAccessLead(user, parsed.leadId, "View"))) throw new Error("Forbidden: lead");

  const founder = await getPrisma().user.findFirst({ where: { role: { name: "Founder" }, status: "Active" } });
  const draft = await getPrisma().draftCommunication.create({
    data: {
      authorId: user.id,
      clientId: parsed.clientId,
      leadId: parsed.leadId,
      channel: parsed.channel,
      recipient: parsed.recipient,
      subject: parsed.subject,
      body: parsed.body,
      purpose: parsed.purpose,
      status: parsed.submitForApproval ? "PendingApproval" : "Draft",
      approverId: founder?.id
    }
  });

  if (parsed.submitForApproval && founder) {
    await createNotification({ userId: founder.id, title: "Draft communication awaiting review", href: `/communications/${draft.id}` });
  }

  await writeAuditLog({
    userId: user.id,
    action: parsed.submitForApproval ? "draft_communication.submitted" : "draft_communication.created",
    entity: "DraftCommunication",
    entityId: draft.id,
    after: { status: draft.status, channel: draft.channel }
  });

  revalidatePath("/communications");
  redirect(`/communications/${draft.id}`);
}

export async function decideDraftCommunicationAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "Founder") throw new Error("Forbidden: Founder");

  const parsed = z.object({
    draftId: z.string().min(1),
    decision: z.enum(["Approved", "ChangesRequested", "Cancelled"]),
    approvalComments: z.string().optional()
  }).parse({
    draftId: formData.get("draftId"),
    decision: formData.get("decision"),
    approvalComments: stringOrUndefined(formData.get("approvalComments"))
  });

  const draft = await getPrisma().draftCommunication.findUnique({ where: { id: parsed.draftId } });
  if (!draft) throw new Error("Draft not found");
  if (draft.authorId === user.id) throw new Error("Author cannot approve their own draft.");

  const updated = await getPrisma().draftCommunication.update({
    where: { id: parsed.draftId },
    data: {
      status: parsed.decision,
      approvalComments: parsed.approvalComments,
      approvedAt: parsed.decision === "Approved" ? new Date() : null,
      approverId: user.id
    }
  });

  await Promise.all([
    createNotification({ userId: draft.authorId, title: "Draft communication reviewed", body: parsed.decision, href: `/communications/${draft.id}` }),
    writeAuditLog({
      userId: user.id,
      action: "draft_communication.decided",
      entity: "DraftCommunication",
      entityId: draft.id,
      before: { status: draft.status },
      after: { status: updated.status }
    })
  ]);

  revalidatePath(`/communications/${draft.id}`);
}

export async function markDraftCommunicationSentAction(formData: FormData) {
  const user = await requireUser();
  const draftId = z.string().min(1).parse(formData.get("draftId"));
  const outcome = z.string().min(1).parse(formData.get("outcome"));
  const draft = await getPrisma().draftCommunication.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("Draft not found");
  if (draft.authorId !== user.id && user.role !== "Founder") throw new Error("Forbidden: draft");
  if (draft.status !== "Approved") throw new Error("Only approved communications can be marked manually sent.");

  await getPrisma().draftCommunication.update({
    where: { id: draftId },
    data: {
      status: "Sent",
      sentAt: new Date(),
      sentById: user.id,
      outcome
    }
  });

  await writeAuditLog({ userId: user.id, action: "draft_communication.manual_sent", entity: "DraftCommunication", entityId: draftId, after: { outcome } });
  revalidatePath(`/communications/${draftId}`);
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : undefined;
}
