import { notFound, redirect } from "next/navigation";
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
        <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-white/64">{article.body}</pre>
      </Card>
    </PageSection>
  );
}
