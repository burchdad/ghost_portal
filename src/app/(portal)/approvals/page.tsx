import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { createApprovalRequestAction } from "@/server/workflows/approvals";

export default async function ApprovalsPage() {
  const user = await requireUser();
  const approvals = await getPrisma().approval.findMany({
    where: user.role === "Founder" ? {} : { requesterId: user.id },
    include: { requester: true },
    orderBy: [{ status: "asc" }, { deadline: "asc" }]
  });

  return (
    <PageSection eyebrow="Waiting on Stephen" title="Approvals" description="Decision queue for work that needs Founder review before Alex can proceed.">
      <Card className="mb-5">
        <h3 className="mb-4 text-lg font-semibold">Create Waiting on Stephen Request</h3>
        <form action={createApprovalRequestAction} className="grid gap-3 lg:grid-cols-2">
          <input name="summary" required placeholder="Summary" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="deadline" type="datetime-local" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <textarea name="context" required placeholder="Context" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
          <textarea name="businessImpact" required placeholder="Business impact" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="recommendation" required placeholder="Recommendation" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <select name="priority" defaultValue="Medium" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {["Low", "Medium", "High", "Urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <Button variant="accent">Create request</Button>
        </form>
      </Card>
      <SimpleTable
        columns={["Request", "Requester", "Status", "Priority"]}
        empty="No approvals in your scope."
        rows={approvals.map((approval) => [
          <Link key="summary" href={`/approvals/${approval.id}`} className="font-medium text-white hover:text-accent">
            {approval.summary}
          </Link>,
          approval.requester.preferredName ?? approval.requester.name,
          <Badge key="status">{approval.status}</Badge>,
          approval.priority
        ])}
      />
    </PageSection>
  );
}
