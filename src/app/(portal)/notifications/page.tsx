import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./read-actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getPrisma().notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <PageSection eyebrow="Inbox" title="Notifications" description="Database-backed event notifications for tasks, reports, approvals, drafts, and announcements.">
      <form action={markAllNotificationsReadAction} className="mb-4 flex justify-end">
        <Button variant="outline">Mark all read</Button>
      </form>
      <SimpleTable
        columns={["Notification", "State", "When", "Action"]}
        empty="No notifications yet."
        rows={notifications.map((notification) => [
          notification.href ? <Link key="title" href={notification.href} className="font-medium text-white hover:text-accent">{notification.title}</Link> : notification.title,
          <Badge key="state">{notification.readAt ? "Read" : "Unread"}</Badge>,
          notification.createdAt.toISOString(),
          notification.readAt ? "" : (
            <form key="form" action={markNotificationReadAction}>
              <input type="hidden" name="notificationId" value={notification.id} />
              <Button size="sm" variant="outline">Mark read</Button>
            </form>
          )
        ])}
      />
    </PageSection>
  );
}
