import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function ApprovalsPage() {
  const user = await requireUser();
  const approvals = await getPrisma().approval.findMany({
    where: user.role === "Founder" ? {} : { requesterId: user.id },
    include: { requester: true },
    orderBy: [{ status: "asc" }, { deadline: "asc" }]
  });

  return (
    <PageSection eyebrow="Waiting on Stephen" title="Approvals" description="Decision queue for work that needs Founder review before Alex can proceed.">
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
