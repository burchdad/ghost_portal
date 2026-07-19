import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const now = new Date();
  const announcements = await getPrisma().announcement.findMany({
    where: {
      archivedAt: null,
      publishAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      audienceRoles: { has: user.role }
    },
    include: { readReceipts: { where: { userId: user.id } } },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }]
  });

  return (
    <PageSection eyebrow="Company updates" title="Announcements" description="Role-targeted updates with read receipt tracking.">
      <SimpleTable
        columns={["Title", "Category", "Priority", "Read"]}
        empty="No active announcements."
        rows={announcements.map((announcement) => [
          announcement.title,
          announcement.category,
          <Badge key="priority">{announcement.priority}</Badge>,
          announcement.readReceipts.length ? "Read" : "Unread"
        ])}
      />
    </PageSection>
  );
}
