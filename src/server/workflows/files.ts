import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

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

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : undefined;
}
