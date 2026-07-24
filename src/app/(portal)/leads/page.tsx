import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createLeadAction } from "@/server/workflows/leads";

const leadSources = ["Manual Cold Call", "Vega", "Referral", "Facebook", "Networking", "Website Inquiry", "Email", "Partner", "Existing Relationship", "Other"];
const filters = ["New", "Ready to Call", "No Answer", "Follow-Up Due", "Interested", "Sales-Ready", "Qualified", "Sent to Mission Control", "Returned for Information", "Meeting Booked", "Do Not Contact"];

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const filter = params.filter ?? "New";
  const canCreate = hasPermission(user, "leads:manage") || hasPermission(user, "leads:update:assigned");
  const baseWhere: Prisma.LeadWhereInput = user.role === "Founder"
    ? { archivedAt: null }
    : { archivedAt: null, access: { some: { userId: user.id } } };
  const [leads, users] = await Promise.all([
    getPrisma().lead.findMany({
      where: { ...baseWhere, ...whereForFilter(filter) },
      include: {
        assignedUser: true,
        callActivities: { orderBy: { occurredAt: "desc" }, take: 1 }
      },
      orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
      take: 100
    }),
    getPrisma().user.findMany({ where: { status: "Active", role: { name: { in: ["Founder", "Operations", "Sales"] } } }, include: { role: true }, orderBy: { name: "asc" } })
  ]);
  const sourceMetrics = buildSourceMetrics(leads);

  return (
    <PageSection eyebrow="Cold-call workspace" title="Leads" description="Create raw leads fast, log outreach, enrich progressively, and hand off only when the lead is ready.">
      {canCreate ? (
        <Card className="mb-5">
          <h3 className="mb-4 text-lg font-semibold">Quick Add Lead</h3>
          <form action={createLeadAction} className="grid gap-3 lg:grid-cols-4">
            <input name="company" required placeholder="Business name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="contactMethod" required placeholder="Phone number or email" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="leadSource" required defaultValue="Manual Cold Call" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {leadSources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <select name="assignedUserId" required defaultValue={user.id} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {users.map((row) => <option key={row.id} value={row.id}>{row.preferredName ?? row.name}</option>)}
            </select>
            <input name="contactName" placeholder="Contact name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="website" placeholder="Website" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="industry" placeholder="Industry" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="location" placeholder="Location" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <textarea name="initialNote" placeholder="Initial note" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-4" />
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <Button name="intent" value="startCall" variant="accent">Create and Start Call</Button>
              <Button name="intent" value="create" variant="outline">Create Lead</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button key={item} asChild size="sm" variant={filter === item ? "accent" : "outline"}>
            <Link href={`/leads?filter=${encodeURIComponent(item)}`}>{item}</Link>
          </Button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {sourceMetrics.slice(0, 5).map((metric) => (
          <Card key={metric.source}>
            <p className="text-xs text-white/42">{metric.source}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.leads}</p>
            <p className="mt-1 text-xs text-white/42">{metric.calls} calls · {metric.interested} interested · {metric.handoffs} handoffs</p>
          </Card>
        ))}
      </div>

      <SimpleTable
        columns={["Company", "Contact", "Source", "Caller", "Last call", "Interest", "Next follow-up", "Handoff", "Mission Control", "Stephen"]}
        empty="No leads match this calling filter."
        rows={leads.map((lead) => {
          const lastCall = lead.callActivities[0];
          return [
            <Link key="company" href={`/leads/${lead.id}`} className="font-medium text-white hover:text-accent">{lead.company}</Link>,
            lead.contactName ?? lead.contactPhone ?? lead.contactEmail ?? "Unknown",
            lead.leadSource ?? "Unknown",
            lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned",
            lastCall?.outcome ?? lead.callResult ?? "No calls",
            <Badge key="interest">{interestLabel(lead.interestLevel)}</Badge>,
            lead.followUpDate ? lead.followUpDate.toLocaleString("en-US") : "Not set",
            <Badge key="handoff">{handoffLabel(lead.handoffStatus)}</Badge>,
            lead.missionControlStatus,
            lead.needsStephenReview ? "Needs Stephen" : ""
          ];
        })}
      />
    </PageSection>
  );
}

function whereForFilter(filter: string): Prisma.LeadWhereInput {
  const now = new Date();
  if (filter === "Ready to Call") return { stage: { in: ["New", "ReadyToCall"] } };
  if (filter === "No Answer") return { callResult: "No Answer" };
  if (filter === "Follow-Up Due") return { followUpDate: { lte: now }, doNotContact: false };
  if (filter === "Interested") return { interestLevel: { in: ["Interested", "StrongInterest", "MeetingRequested"] } };
  if (filter === "Sales-Ready") return { handoffStatus: "SalesReadyNeedsDiscovery" };
  if (filter === "Qualified") return { handoffStatus: "QualifiedAwaitingFounderReview" };
  if (filter === "Sent to Mission Control") return { missionControlStatus: { not: "Not Sent" } };
  if (filter === "Returned for Information") return { handoffStatus: "ReturnedForInformation" };
  if (filter === "Meeting Booked") return { stage: "MeetingScheduled" };
  if (filter === "Do Not Contact") return { doNotContact: true };
  return { stage: "New" };
}

function buildSourceMetrics(leads: Array<{ leadSource: string | null; callActivities: Array<{ outcome: string }>; handoffStatus: string; stage: string; interestLevel: string }>) {
  const map = new Map<string, { source: string; leads: number; calls: number; interested: number; handoffs: number }>();
  for (const source of leadSources) map.set(source, { source, leads: 0, calls: 0, interested: 0, handoffs: 0 });
  for (const lead of leads) {
    const key = lead.leadSource ?? "Other";
    const metric = map.get(key) ?? { source: key, leads: 0, calls: 0, interested: 0, handoffs: 0 };
    metric.leads += 1;
    metric.calls += lead.callActivities.length;
    if (["Interested", "StrongInterest", "MeetingRequested"].includes(lead.interestLevel) || lead.stage === "Interested") metric.interested += 1;
    if (lead.handoffStatus !== "OpsOnly") metric.handoffs += 1;
    map.set(key, metric);
  }
  return [...map.values()].filter((metric) => metric.leads > 0 || metric.source === "Manual Cold Call");
}

function interestLabel(value: string) {
  if (value === "StrongInterest") return "Strong Interest";
  if (value === "MeetingRequested") return "Meeting Requested";
  return value;
}

function handoffLabel(value: string) {
  if (value === "SalesReadyNeedsDiscovery") return "Sales-Ready";
  if (value === "QualifiedAwaitingFounderReview") return "Qualified";
  if (value === "SentToMissionControl") return "Sent";
  if (value === "ReturnedForInformation") return "Returned";
  return "Ops Only";
}
