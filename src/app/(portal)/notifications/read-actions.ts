"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/permissions/authorize";
import { markAllNotificationsRead, markNotificationRead } from "@/server/workflows/notifications";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = z.string().min(1).parse(formData.get("notificationId"));
  await markNotificationRead(notificationId, user.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/notifications");
}
