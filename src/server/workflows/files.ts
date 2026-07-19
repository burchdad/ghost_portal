import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { canModifyTask, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
export const maxFileBytes = 10 * 1024 * 1024;

const fileMetadataSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().refine((mime) => allowedMimeTypes.includes(mime), "Unsupported file type"),
  size: z.coerce.number().int().min(1).max(maxFileBytes),
  taskId: z.string().optional(),
  approvalId: z.string().optional(),
  reportId: z.string().optional(),
  feedbackId: z.string().optional()
});

export async function createLocalFileMetadataAction(formData: FormData) {
  "use server";

  const user = await requireUser();
  const parsed = fileMetadataSchema.parse({
    name: formData.get("name"),
    mimeType: formData.get("mimeType"),
    size: formData.get("size"),
    taskId: stringOrUndefined(formData.get("taskId")),
    approvalId: stringOrUndefined(formData.get("approvalId")),
    reportId: stringOrUndefined(formData.get("reportId")),
    feedbackId: stringOrUndefined(formData.get("feedbackId"))
  });

  await assertAttachmentTargetAccess(user, parsed);

  const file = await getPrisma().fileAsset.create({
    data: {
      name: sanitizeFilename(parsed.name),
      mimeType: parsed.mimeType,
      size: parsed.size,
      storageKey: `local-dev/${Date.now()}-${sanitizeFilename(parsed.name)}`,
      folder: "attachments",
      uploaderId: user.id,
      taskId: parsed.taskId,
      approvalId: parsed.approvalId,
      reportId: parsed.reportId,
      feedbackId: parsed.feedbackId
    }
  });

  await writeAuditLog({ userId: user.id, action: "file.metadata_created", entity: "FileAsset", entityId: file.id, after: { name: file.name, size: file.size } });
}

async function assertAttachmentTargetAccess(
  user: Awaited<ReturnType<typeof requireUser>>,
  target: z.infer<typeof fileMetadataSchema>
) {
  const targetCount = [target.taskId, target.approvalId, target.reportId, target.feedbackId].filter(Boolean).length;
  if (targetCount !== 1) {
    throw new Error("Attach metadata to exactly one authorized record.");
  }

  if (target.taskId) {
    const task = await getPrisma().task.findUnique({ where: { id: target.taskId } });
    if (!task || (user.role !== "Founder" && !canModifyTask(user, task))) throw new Error("Forbidden: file task target");
  }

  if (target.approvalId) {
    const approval = await getPrisma().approval.findUnique({ where: { id: target.approvalId } });
    if (!approval || (user.role !== "Founder" && approval.requesterId !== user.id)) throw new Error("Forbidden: file approval target");
  }

  if (target.reportId) {
    const report = await getPrisma().dailyReport.findUnique({ where: { id: target.reportId } });
    if (!report || (report.userId !== user.id && !hasPermission(user, "reports:review"))) throw new Error("Forbidden: file report target");
  }

  if (target.feedbackId) {
    const feedback = await getPrisma().feedbackSubmission.findUnique({ where: { id: target.feedbackId } });
    if (!feedback || (feedback.submittedById !== user.id && !hasPermission(user, "feedback:read"))) throw new Error("Forbidden: file feedback target");
  }
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : undefined;
}
