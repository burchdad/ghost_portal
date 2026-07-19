import { getPrisma } from "@/server/db/prisma";

export async function createNotification(input: {
  userId: string;
  title: string;
  body?: string;
  href?: string;
}) {
  return getPrisma().notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href
    }
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return getPrisma().notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() }
  });
}

export async function markAllNotificationsRead(userId: string) {
  return getPrisma().notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  });
}
