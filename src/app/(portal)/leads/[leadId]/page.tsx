import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { canAccessLead, minimizeLeadForUser, requireUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const user = await requireUser();
  const { leadId } = await params;
  const allowed = await canAccessLead(user, leadId);
  if (!allowed) redirect("/access-denied");

  const lead = await getPrisma().lead.findUnique({ where: { id: leadId } });
  if (!lead) notFound();

  const visibleLead = minimizeLeadForUser(user, lead);

  return (
    <PageSection eyebrow="Lead" title={visibleLead.company} description="Draft follow-ups stay manual and approval-gated in Phase 1.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Next action</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleLead.nextAction ?? "No next action."}</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Approved value</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleLead.approvedValue ? `$${Number(visibleLead.approvedValue).toLocaleString()}` : "Restricted or not approved."}</p>
        </Card>
      </div>
    </PageSection>
  );
}
