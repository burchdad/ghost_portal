import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { decideApprovalAction } from "@/server/workflows/approvals";

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
      {user.role === "Founder" && approval.requesterId !== user.id ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Decision</h3>
          <form action={decideApprovalAction} className="mt-4 grid gap-3">
            <input type="hidden" name="approvalId" value={approval.id} />
            <select name="decision" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
              <option value="ChangesRequested">Request changes</option>
            </select>
            <textarea name="decisionNotes" required placeholder="Decision notes" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <Button variant="accent">Submit decision</Button>
          </form>
        </Card>
      ) : null}
    </PageSection>
  );
}
