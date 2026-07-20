import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function AcademyAdminPage() {
  await requirePermission("academy:manage");
  const [paths, modules, sops, questions, reviewItems] = await Promise.all([
    getPrisma().learningPath.count({ where: { archivedAt: null } }),
    getPrisma().courseModule.count({ where: { archivedAt: null } }),
    getPrisma().sOPArticle.count({ where: { archivedAt: null } }),
    getPrisma().employeeQuestion.count({ where: { status: "Open" } }),
    getPrisma().courseModule.count({ where: { founderReviewRequired: true, archivedAt: null } })
  ]);

  return (
    <PageSection eyebrow="Founder admin" title="Academy Dashboard" description="Manage Ghost Academy paths, content, questions, progress, acknowledgements, and review items.">
      <div className="grid gap-5 md:grid-cols-5">
        <Metric label="Paths" value={paths} />
        <Metric label="Modules" value={modules} />
        <Metric label="SOPs" value={sops} />
        <Metric label="Open questions" value={questions} />
        <Metric label="Review flags" value={reviewItems} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Button asChild variant="outline"><Link href="/admin/academy/content">Content Review</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/academy/progress">Progress</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/academy/questions">Questions</Link></Button>
        <Button asChild variant="outline"><Link href="/academy">Preview My Learning</Link></Button>
      </div>
    </PageSection>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-white/48">{label}</p>
    </Card>
  );
}
