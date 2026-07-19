import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { markAnnouncementReadAction } from "@/server/workflows/announcements";

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
      <div className="grid gap-4">
        {announcements.length === 0 ? <Card><p className="text-sm text-white/48">No active announcements.</p></Card> : null}
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex gap-2">
                  <Badge>{announcement.category}</Badge>
                  <Badge>{announcement.priority}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{announcement.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{announcement.body}</p>
              </div>
              {announcement.readReceipts.length ? <Badge>Read</Badge> : (
                <form action={markAnnouncementReadAction}>
                  <input type="hidden" name="announcementId" value={announcement.id} />
                  <Button variant="outline">Mark read</Button>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
