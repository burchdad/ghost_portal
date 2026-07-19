import { z } from "zod";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { canAccessClient, canAccessLead, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export const createApprovalSchema = z.object({
  summary: z.string().min(3),
  context: z.string().min(3),
  businessImpact: z.string().min(3),
  recommendation: z.string().min(3),
  deadline: z.coerce.date().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  taskId: z.string().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  draftCommunicationId: z.string().optional()
});

export async function createApprovalRequest(input: unknown) {
  const user = await requireUser();
  if (!hasPermission(user, "approvals:request")) throw new Error("Forbidden: approvals:request");

  const parsed = createApprovalSchema.parse(input);

  if (parsed.clientId && !(await canAccessClient(user, parsed.clientId))) throw new Error("Forbidden: client");
  if (parsed.leadId && !(await canAccessLead(user, parsed.leadId))) throw new Error("Forbidden: lead");

  const approval = await getPrisma().approval.create({
    data: {
      ...parsed,
      requesterId: user.id
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "approval.requested",
    entity: "Approval",
    entityId: approval.id,
    after: { summary: approval.summary, status: approval.status }
  });

  return approval;
}

export async function createApprovalRequestAction(formData: FormData) {
  "use server";

  await createApprovalRequest({
    summary: formData.get("summary"),
    context: formData.get("context"),
    businessImpact: formData.get("businessImpact"),
    recommendation: formData.get("recommendation"),
    deadline: formData.get("deadline") || undefined,
    priority: formData.get("priority") || "Medium",
    taskId: formData.get("taskId") || undefined,
    clientId: formData.get("clientId") || undefined,
    leadId: formData.get("leadId") || undefined,
    draftCommunicationId: formData.get("draftCommunicationId") || undefined
  });

  revalidatePath("/approvals");
}

export async function decideApproval(approvalId: string, decision: "Approved" | "Rejected" | "ChangesRequested", decisionNotes: string) {
  const user = await requireUser();
  if (!hasPermission(user, "approvals:decide")) throw new Error("Forbidden: approvals:decide");

  const approval = await getPrisma().approval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new Error("Approval not found");
  if (approval.requesterId === user.id) throw new Error("Requester cannot approve their own request.");

  const updated = await getPrisma().approval.update({
    where: { id: approvalId },
    data: {
      status: decision,
      decision,
      decisionNotes,
      decisionAt: new Date(),
      deciderId: user.id
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "approval.decided",
    entity: "Approval",
    entityId: approvalId,
    before: { status: approval.status },
    after: { status: updated.status, decisionNotes }
  });

  return updated;
}

export async function decideApprovalAction(formData: FormData) {
  "use server";

  const parsed = z.object({
    approvalId: z.string().min(1),
    decision: z.enum(["Approved", "Rejected", "ChangesRequested"]),
    decisionNotes: z.string().min(1)
  }).parse({
    approvalId: formData.get("approvalId"),
    decision: formData.get("decision"),
    decisionNotes: formData.get("decisionNotes")
  });

  await decideApproval(parsed.approvalId, parsed.decision, parsed.decisionNotes);
  revalidatePath(`/approvals/${parsed.approvalId}`);
  revalidatePath("/approvals");
}
