import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createLeadAction } from "@/server/workflows/leads";

export default async function LeadsPage() {
  const user = await requireUser();
  const canCreate = hasPermission(user, "leads:manage");
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
      {canCreate ? (
        <Card className="mb-5">
          <h3 className="mb-4 text-lg font-semibold">Create Lead</h3>
          <form action={createLeadAction} className="grid gap-3 lg:grid-cols-2">
            <input name="company" required placeholder="Company" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="contactName" placeholder="Contact name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="serviceInterest" required placeholder="Service interest" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="estimatedValue" type="number" placeholder="Estimated value" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="stage" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["New", "Contacted", "Qualified", "Discovery", "Proposal", "Negotiation", "Won", "Lost", "Nurture"].map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <input name="followUpDate" type="datetime-local" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <textarea name="nextAction" placeholder="Next action" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <label className="flex items-center gap-2 text-sm text-white/64">
              <input name="approvalRequired" type="checkbox" /> Approval required
            </label>
            <Button variant="accent">Create lead</Button>
          </form>
        </Card>
      ) : null}
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
