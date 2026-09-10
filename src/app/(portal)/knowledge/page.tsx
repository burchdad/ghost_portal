import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export default async function KnowledgePage() {
  const user = await requireUser();
  const canManageKnowledge = hasPermission(user, "knowledge:manage");
  const articles = await getPrisma().knowledgeArticle.findMany({
    where: canManageKnowledge ? { archivedAt: null } : { archivedAt: null, status: "Published", visibleToRoles: { has: user.role } },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <PageSection eyebrow="SOPs" title="Knowledge Center" description="Published, role-visible operating knowledge. Rendering remains Markdown-only and avoids unsafe HTML.">
      <SimpleTable
        columns={["Article", "Category", "Status", "Version"]}
        empty="No knowledge articles are available for your role."
        rows={articles.map((article) => [
          <Link key="title" href={`/knowledge/${article.id}`} className="font-medium text-white hover:text-accent">
            {article.title}
          </Link>,
          article.category,
          <Badge key="status">{article.status}</Badge>,
          `v${article.version}`
        ])}
      />
    </PageSection>
  );
}
