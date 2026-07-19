import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function LeadsPage() {
  const user = await requireUser();
  const leads = await getPrisma().lead.findMany({
    where:
      user.role === "Founder"
        ? { archivedAt: null }
        : {
            archivedAt: null,
            access: { some: { userId: user.id } }
          },
    orderBy: [{ followUpDate: "asc" }]
  });

  return (
    <PageSection eyebrow="Pipeline" title="Leads" description="Alex can draft and propose next actions only for assigned leads.">
      <SimpleTable
        columns={["Company", "Stage", "Next action", "Approval"]}
        empty="No leads are assigned to you yet."
        rows={leads.map((lead) => [
          <Link key="company" href={`/leads/${lead.id}`} className="font-medium text-white hover:text-accent">
            {lead.company}
          </Link>,
          <Badge key="stage">{lead.stage}</Badge>,
          lead.nextAction ?? "Not set",
          lead.approvalRequired ? "Required" : "Not required"
        ])}
      />
    </PageSection>
  );
}
