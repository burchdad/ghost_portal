import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { SupportTicketForm } from "./support-ticket-form";

const ticketTypes = ["Bug", "WorkflowIssue", "FeatureRequest", "ConfusingInterface", "MissingInformation", "NovaSuggestion", "MissionControlSuggestion", "Other"];
const severities = ["Low", "Medium", "High", "Urgent"];
const missionAreas = ["Ops Portal", "Ghost Academy", "Nova", "Mission Control", "Tasks", "Clients", "Leads", "Daily Reports", "Approvals", "Files", "Notifications", "Deployment", "Data", "Other"];

export default async function SupportPage({ searchParams }: { searchParams?: Promise<{ submitted?: string }> }) {
  const user = await requirePermission("support:create");
  const params = await searchParams;
  const tickets = await getPrisma().feedbackSubmission.findMany({
    where: user.role === "Founder" ? {} : { submittedById: user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50
  });

  return (
    <PageSection eyebrow="Support Agent" title="Get help fast" description="Submit Ops Portal or Mission Control issues with enough context for Stephen to fix, route, or prioritize quickly.">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          {params?.submitted ? (
            <p className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              Support ticket {params.submitted} was submitted to Stephen.
            </p>
          ) : null}
          <SupportTicketForm ticketTypes={ticketTypes} severities={severities} missionAreas={missionAreas} />
        </Card>

        <div className="grid gap-4">
          {tickets.length === 0 ? <Card><p className="text-sm text-white/50">No support tickets yet.</p></Card> : null}
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{ticket.supportKey ?? "Ticket"}</Badge>
                    <Badge>{ticket.status}</Badge>
                    <Badge>{ticket.severity}</Badge>
                    {ticket.blocked ? <Badge className="border-warning/40 bg-warning/10 text-warning">Blocked</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{ticket.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{ticket.description}</p>
                  {ticket.founderResponse ? <p className="mt-3 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm text-white/74">{ticket.founderResponse}</p> : null}
                </div>
                <p className="text-xs text-white/38">{ticket.missionControlArea ?? "Unassigned"}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageSection>
  );
}
