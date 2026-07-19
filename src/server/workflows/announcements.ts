"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export async function markAnnouncementReadAction(formData: FormData) {
  const user = await requireUser();
  const announcementId = z.string().min(1).parse(formData.get("announcementId"));
  const announcement = await getPrisma().announcement.findUnique({ where: { id: announcementId } });
  if (!announcement || !announcement.audienceRoles.includes(user.role)) throw new Error("Forbidden: announcement");

  await getPrisma().announcementRead.upsert({
    where: { announcementId_userId: { announcementId, userId: user.id } },
    update: { readAt: new Date() },
    create: { announcementId, userId: user.id }
  });

  await writeAuditLog({ userId: user.id, action: "announcement.read", entity: "Announcement", entityId: announcementId });
  revalidatePath("/announcements");
}
