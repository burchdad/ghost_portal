import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function ApprovalDetailPage({ params }: { params: Promise<{ approvalId: string }> }) {
  const user = await requireUser();
  const { approvalId } = await params;
  const approval = await getPrisma().approval.findUnique({ where: { id: approvalId }, include: { requester: true } });
  if (!approval) notFound();
  if (user.role !== "Founder" && approval.requesterId !== user.id) redirect("/access-denied");

  return (
    <PageSection eyebrow="Approval" title={approval.summary} description={approval.businessImpact}>
      <Card>
        <h3 className="font-semibold">Recommendation</h3>
        <p className="mt-3 text-sm leading-6 text-white/58">{approval.recommendation}</p>
      </Card>
    </PageSection>
  );
}
