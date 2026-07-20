import { notFound, redirect } from "next/navigation";
import { MarkdownRenderer } from "@/components/portal/markdown-renderer";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ articleId: string }> }) {
  const user = await requireUser();
  const { articleId } = await params;
  const article = await getPrisma().knowledgeArticle.findUnique({ where: { id: articleId } });
  if (!article) notFound();
  if (user.role !== "Founder" && (article.status !== "Published" || !article.visibleToRoles.includes(user.role))) redirect("/access-denied");

  return (
    <PageSection eyebrow={article.category} title={article.title} description={`Version ${article.version}`}>
      <Card>
        <MarkdownRenderer content={article.body} />
      </Card>
    </PageSection>
  );
}
