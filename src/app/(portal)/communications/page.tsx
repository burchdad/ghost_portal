import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { createDraftCommunicationAction } from "@/server/workflows/draft-communications";

export default async function CommunicationsPage() {
  const user = await requireUser();
  const [drafts, clients, leads] = await Promise.all([
    getPrisma().draftCommunication.findMany({
      where: user.role === "Founder" ? {} : { authorId: user.id },
      include: { author: true, client: true, lead: true },
      orderBy: { updatedAt: "desc" },
      take: 50
    }),
    getPrisma().client.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { archivedAt: null, access: { some: { userId: user.id } } },
      orderBy: { company: "asc" }
    }),
    getPrisma().lead.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { archivedAt: null, access: { some: { userId: user.id } } },
      orderBy: { company: "asc" }
    })
  ]);

  return (
    <PageSection eyebrow="Approval-gated outreach" title="Draft Communications" description="Phase 1 prepares and approves communication only. Nothing is sent automatically.">
      <Card className="mb-5">
        <h3 className="mb-4 text-lg font-semibold">Create Draft</h3>
        <form action={createDraftCommunicationAction} className="grid gap-3 lg:grid-cols-2">
          <select name="clientId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            <option value="">Related client</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
          </select>
          <select name="leadId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            <option value="">Related lead</option>
            {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company}</option>)}
          </select>
          <select name="channel" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {["Email", "SMS", "Facebook", "LinkedIn", "WhatsApp", "Phone follow-up", "Other"].map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <input name="recipient" required placeholder="Recipient" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="subject" placeholder="Subject" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm lg:col-span-2" />
          <textarea name="purpose" required placeholder="Purpose" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
          <textarea name="body" required placeholder="Draft message" className="min-h-32 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-white/64">
            <input name="submitForApproval" type="checkbox" /> Submit for Stephen approval
          </label>
          <Button variant="accent">Save draft</Button>
        </form>
      </Card>

      <SimpleTable
        columns={["Draft", "Context", "Author", "Status"]}
        empty="No draft communications yet."
        rows={drafts.map((draft) => [
          <Link key="draft" href={`/communications/${draft.id}`} className="font-medium text-white hover:text-accent">
            {draft.subject ?? draft.purpose}
          </Link>,
          draft.client?.company ?? draft.lead?.company ?? "General",
          draft.author.preferredName ?? draft.author.name,
          <Badge key="status">{draft.status}</Badge>
        ])}
      />
    </PageSection>
  );
}
