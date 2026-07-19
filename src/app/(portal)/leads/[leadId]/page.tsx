import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { canAccessLead, minimizeLeadForUser, requireUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";
import { grantLeadAccessAction, revokeLeadAccessAction } from "@/server/workflows/record-access";
import { updateLeadOperationalAction } from "@/server/workflows/leads";

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const user = await requireUser();
  const { leadId } = await params;
  const allowed = await canAccessLead(user, leadId);
  if (!allowed) redirect("/access-denied");

  const [lead, users] = await Promise.all([
    getPrisma().lead.findUnique({ where: { id: leadId }, include: { access: { include: { user: true } } } }),
    getPrisma().user.findMany({ where: { status: "Active" }, include: { role: true }, orderBy: { name: "asc" } })
  ]);
  if (!lead) notFound();

  const visibleLead = minimizeLeadForUser(user, lead);

  return (
    <PageSection eyebrow="Lead" title={visibleLead.company} description="Draft follow-ups stay manual and approval-gated in Phase 1.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Next action</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleLead.nextAction ?? "No next action."}</p>
          <form action={updateLeadOperationalAction} className="mt-4 space-y-3">
            <input type="hidden" name="leadId" value={visibleLead.id} />
            <textarea name="nextAction" defaultValue={visibleLead.nextAction ?? ""} placeholder="Proposed next action" className="min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="notes" defaultValue={visibleLead.notes ?? ""} placeholder="Operational notes" className="min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <input name="followUpDate" type="datetime-local" className="h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <Button>Save operational update</Button>
          </form>
        </Card>
        <Card>
          <h3 className="font-semibold">Approved value</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleLead.approvedValue ? `$${Number(visibleLead.approvedValue).toLocaleString()}` : "Restricted or not approved."}</p>
        </Card>
      </div>
      {user.role === "Founder" ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Access Management</h3>
          <form action={grantLeadAccessAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input type="hidden" name="leadId" value={visibleLead.id} />
            <select name="userId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {users.filter((row) => row.role.name !== "Founder").map((row) => <option key={row.id} value={row.id}>{row.preferredName ?? row.name}</option>)}
            </select>
            <select name="access" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["View", "Edit", "Manage"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <Button variant="accent">Grant access</Button>
          </form>
          <div className="mt-4 space-y-2">
            {lead.access.map((access) => (
              <form key={access.userId} action={revokeLeadAccessAction} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">
                <span>{access.user.preferredName ?? access.user.name}: {access.access}</span>
                <input type="hidden" name="leadId" value={visibleLead.id} />
                <input type="hidden" name="userId" value={access.userId} />
                <Button size="sm" variant="outline">Revoke</Button>
              </form>
            ))}
          </div>
        </Card>
      ) : null}
    </PageSection>
  );
}
