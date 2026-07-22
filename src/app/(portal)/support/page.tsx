import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { submitFeedbackAction } from "@/server/workflows/feedback";

const ticketTypes = ["Bug", "WorkflowIssue", "FeatureRequest", "ConfusingInterface", "MissingInformation", "NovaSuggestion", "MissionControlSuggestion", "Other"];
const severities = ["Low", "Medium", "High", "Urgent"];
const missionAreas = ["Ops Portal", "Ghost Academy", "Nova", "Mission Control", "Tasks", "Clients", "Leads", "Daily Reports", "Approvals", "Files", "Notifications", "Deployment", "Data", "Other"];

export default async function SupportPage() {
  const user = await requirePermission("support:create");
  const tickets = await getPrisma().feedbackSubmission.findMany({
    where: user.role === "Founder" ? {} : { submittedById: user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50
  });

  return (
    <PageSection eyebrow="Support Agent" title="Get help fast" description="Submit Ops Portal or Mission Control issues with enough context for Stephen to fix, route, or prioritize quickly.">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <form action={submitFeedbackAction} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium">
                Ticket type
                <select name="type" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                  {ticketTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">
                Severity
                <select name="severity" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                  {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
                </select>
              </label>
            </div>
            <label className="text-sm font-medium">
              Mission Control area
              <select name="missionControlArea" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                {missionAreas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              Title
              <input name="title" required placeholder="Short issue title" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">
              Page or feature
              <input name="pageOrFeature" placeholder="/tasks, Nova drawer, daily report submit..." className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">
              What happened?
              <textarea name="description" required placeholder="Describe the issue, what you were trying to do, and why it matters." className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium">
                Expected result
                <textarea name="expectedResult" placeholder="What should have happened?" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Actual result
                <textarea name="actualResult" placeholder="What happened instead?" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              </label>
            </div>
            <label className="text-sm font-medium">
              Workaround tried
              <input name="workaroundTried" placeholder="Refresh, different page, manual note, none..." className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm text-white/64">
              <input name="blocked" type="checkbox" />
              This is blocking current work
            </label>
            <Button variant="accent">Submit support ticket</Button>
          </form>
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

function labelize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
