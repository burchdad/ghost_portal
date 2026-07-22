import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { updateFeedbackStatusAction } from "@/server/workflows/feedback";

const statuses = ["Reviewing", "Planned", "InProgress", "Completed", "Declined"];
const missionAreas = ["Ops Portal", "Ghost Academy", "Nova", "Mission Control", "Tasks", "Clients", "Leads", "Daily Reports", "Approvals", "Files", "Notifications", "Deployment", "Data", "Other"];

export default async function MissionControlSupportPage({ searchParams }: { searchParams: Promise<{ ticketId?: string }> }) {
  await requirePermission("support:triage");
  const params = await searchParams;
  const [tickets, selected] = await Promise.all([
    getPrisma().feedbackSubmission.findMany({
      include: { submittedBy: true },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      take: 75
    }),
    params.ticketId ? getPrisma().feedbackSubmission.findUnique({ where: { id: params.ticketId }, include: { submittedBy: true, files: true } }) : null
  ]);
  const activeTicket = selected ?? tickets[0] ?? null;

  return (
    <PageSection eyebrow="Mission Control" title="Support Queue" description="Triage Ops Portal tickets, route fixes, and send clear updates back to the submitter.">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          {tickets.length === 0 ? <Card><p className="text-sm text-white/50">No support tickets submitted.</p></Card> : null}
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/admin/support?ticketId=${ticket.id}`} className="block rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/[0.065]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/38">{ticket.supportKey ?? "Ticket"} - {ticket.missionControlArea ?? "Unassigned"}</p>
                  <h3 className="mt-2 font-semibold text-white">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-white/48">{ticket.submittedBy.preferredName ?? ticket.submittedBy.name}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge>{ticket.status}</Badge>
                  <Badge>{ticket.severity}</Badge>
                  {ticket.blocked ? <Badge className="border-warning/40 bg-warning/10 text-warning">Blocked</Badge> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {activeTicket ? (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent">{activeTicket.supportKey ?? "Support ticket"}</p>
                <h2 className="mt-2 text-2xl font-semibold">{activeTicket.title}</h2>
                <p className="mt-2 text-sm text-white/48">Submitted by {activeTicket.submittedBy.preferredName ?? activeTicket.submittedBy.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{activeTicket.status}</Badge>
                <Badge>{activeTicket.severity}</Badge>
                {activeTicket.blocked ? <Badge className="border-warning/40 bg-warning/10 text-warning">Work blocked</Badge> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Info label="Type" value={labelize(activeTicket.type)} />
              <Info label="Area" value={activeTicket.missionControlArea ?? "Unassigned"} />
              <Info label="Page or feature" value={activeTicket.pageOrFeature ?? "Not provided"} />
              <Info label="Submitted" value={activeTicket.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" })} />
            </div>

            <div className="mt-5 space-y-4 text-sm leading-6 text-white/64">
              <Block label="Description" value={activeTicket.description} />
              <Block label="Expected result" value={activeTicket.expectedResult} />
              <Block label="Actual result" value={activeTicket.actualResult} />
              <Block label="Workaround tried" value={activeTicket.workaroundTried} />
              <Block label="Support agent summary" value={activeTicket.agentSummary} />
            </div>

            <form action={updateFeedbackStatusAction} className="mt-6 grid gap-3">
              <input type="hidden" name="feedbackId" value={activeTicket.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Status
                  <select name="status" defaultValue={activeTicket.status === "New" ? "Reviewing" : activeTicket.status} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                    {statuses.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Mission Control area
                  <select name="missionControlArea" defaultValue={activeTicket.missionControlArea ?? "Ops Portal"} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                    {missionAreas.map((area) => <option key={area} value={area}>{area}</option>)}
                  </select>
                </label>
              </div>
              <label className="text-sm font-medium">
                Response to submitter
                <textarea name="founderResponse" defaultValue={activeTicket.founderResponse ?? ""} placeholder="What should Alex know now?" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Internal resolution notes
                <textarea name="resolutionNotes" defaultValue={activeTicket.resolutionNotes ?? ""} placeholder="Fix summary, route, deployment note, or reason declined." className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              </label>
              <Button variant="accent">Update ticket</Button>
            </form>
          </Card>
        ) : null}
      </div>
    </PageSection>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-white/34">{label}</p>
      <p className="mt-1 text-sm text-white/70">{value}</p>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-white/34">{label}</p>
      <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.035] p-3">{value}</p>
    </div>
  );
}

function labelize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
