import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/portal/simple-table";
import { PageSection } from "@/components/portal/page-section";
import { formatDuration, minutesBetween } from "@/lib/time-clock";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { syncLeadToGhostCrmAction, updateLeadTestRecordAction } from "@/server/workflows/leads";

export default async function OpsHealthPage() {
  await requirePermission("admin:access");
  const prisma = getPrisma();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    openShifts,
    longCompletedShifts,
    syncProblemLeads,
    unsentReadyLeads,
    testLeads,
    missingReports
  ] = await Promise.all([
    prisma.workShift.findMany({
      where: { status: { in: ["ClockedIn", "OnBreak", "AwaitingCorrection"] } },
      include: { user: true, breaks: { where: { endedAt: null }, take: 1 } },
      orderBy: { startedAt: "asc" },
      take: 25
    }),
    prisma.workShift.findMany({
      where: { status: "Completed", netMinutes: { gt: 12 * 60 } },
      include: { user: true },
      orderBy: { endedAt: "desc" },
      take: 10
    }),
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        isTestRecord: false,
        OR: [
          { ghostCrmStatus: { in: ["Not Synced", "Needs Sync", "Sync Failed", "Not Configured"] } },
          { missionControlStatus: "Sync Failed" }
        ]
      },
      include: { assignedUser: true },
      orderBy: { updatedAt: "desc" },
      take: 25
    }),
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        isTestRecord: false,
        ghostCrmStatus: "Synced",
        missionControlStatus: { not: "Sent to Mission Control" },
        OR: [
          { stage: { in: ["Interested", "Qualified", "Discovery", "MeetingScheduled"] } },
          { interestLevel: { in: ["Interested", "StrongInterest", "MeetingRequested"] } }
        ]
      },
      include: { assignedUser: true },
      orderBy: { updatedAt: "desc" },
      take: 25
    }),
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        OR: [
          { isTestRecord: true },
          { company: { startsWith: "Codex QA", mode: "insensitive" } },
          { company: { startsWith: "Codex Smoke", mode: "insensitive" } },
          { company: { startsWith: "Codex Test", mode: "insensitive" } }
        ]
      },
      include: { assignedUser: true },
      orderBy: { updatedAt: "desc" },
      take: 25
    }),
    prisma.user.findMany({
      where: {
        status: "Active",
        role: { name: { in: ["Operations", "Sales", "Support", "Marketing", "Developer", "Contractor"] } },
        reports: { none: { reportDate: { gte: todayStart } } }
      },
      include: { role: true },
      orderBy: { name: "asc" },
      take: 25
    })
  ]);

  const staleShifts = openShifts.filter((shift) => minutesBetween(shift.startedAt, now) >= 12 * 60);
  const failedSync = syncProblemLeads.filter((lead) => lead.ghostCrmStatus === "Sync Failed" || lead.missionControlStatus === "Sync Failed");

  return (
    <PageSection eyebrow="Operations health" title="Ops Health" description="Live blockers across time tracking, lead sync, Mission Control handoff, daily reports, and QA data.">
      <div className="mb-5 grid gap-3 md:grid-cols-5">
        <HealthMetric label="Open shifts" value={openShifts.length} tone={staleShifts.length ? "danger" : "neutral"} />
        <HealthMetric label="Stale shifts" value={staleShifts.length} tone={staleShifts.length ? "danger" : "neutral"} />
        <HealthMetric label="Sync issues" value={syncProblemLeads.length} tone={failedSync.length ? "danger" : syncProblemLeads.length ? "warning" : "neutral"} />
        <HealthMetric label="Ready handoffs" value={unsentReadyLeads.length} tone={unsentReadyLeads.length ? "warning" : "neutral"} />
        <HealthMetric label="Missing reports" value={missingReports.length} tone={missingReports.length ? "warning" : "neutral"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Time Clock Watchlist</h3>
              <p className="mt-1 text-sm text-white/50">Open shifts and unusually long completed shifts.</p>
            </div>
            <Button asChild variant="outline"><Link href="/admin/time-clock">Open Time Clock</Link></Button>
          </div>
          <div className="mt-4 space-y-3">
            {openShifts.length === 0 ? <EmptyState text="No open shifts right now." /> : openShifts.map((shift) => {
              const elapsed = minutesBetween(shift.startedAt, now);
              return (
                <div key={shift.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href="/admin/time-clock" className="font-semibold hover:text-accent">{shift.user.preferredName ?? shift.user.name}</Link>
                    <Badge>{elapsed >= 12 * 60 ? "Needs review" : shift.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/58">Open for {formatDuration(elapsed)} · Started {formatDate(shift.startedAt)}</p>
                  {shift.breaks[0] ? <p className="mt-1 text-sm text-warning">Open break since {formatDate(shift.breaks[0].startedAt)}</p> : null}
                </div>
              );
            })}
            {longCompletedShifts.length ? (
              <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
                {longCompletedShifts.length} recently completed shifts are longer than 12 hours.
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Lead Sync Watchlist</h3>
          <p className="mt-1 text-sm text-white/50">Real leads that need GhostCRM or Mission Control attention.</p>
          <div className="mt-4 space-y-3">
            {syncProblemLeads.length === 0 ? <EmptyState text="No sync blockers found." /> : syncProblemLeads.slice(0, 8).map((lead) => (
              <div key={lead.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/leads/${lead.id}`} className="font-semibold hover:text-accent">{lead.company}</Link>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{lead.ghostCrmStatus}</Badge>
                    <Badge>{lead.missionControlStatus}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/52">Caller: {lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned"}</p>
                {lead.ghostCrmSyncError ? <p className="mt-2 text-sm text-danger">{lead.ghostCrmSyncError}</p> : null}
                {lead.missionControlSyncErrorMessage ? <p className="mt-2 text-sm text-danger">{lead.missionControlSyncErrorMessage}</p> : null}
                {lead.ghostCrmStatus !== "Synced" ? (
                  <form action={syncLeadToGhostCrmAction} className="mt-3">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <Button size="sm" variant="accent">Sync GhostCRM</Button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SimpleTable
          columns={["Lead", "Caller", "Interest", "GhostCRM", "Mission Control"]}
          empty="No warm synced leads are waiting on Mission Control."
          rows={unsentReadyLeads.map((lead) => [
            <Link key="lead" href={`/leads/${lead.id}`} className="font-medium text-white hover:text-accent">{lead.company}</Link>,
            lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned",
            <Badge key="interest">{lead.interestLevel}</Badge>,
            lead.ghostCrmStatus,
            lead.missionControlStatus
          ])}
        />

        <SimpleTable
          columns={["Employee", "Role", "Timezone", "Today report"]}
          empty="All active employees in scoped roles have a report today."
          rows={missingReports.map((employee) => [
            employee.preferredName ?? employee.name,
            employee.role.name,
            employee.timezone,
            "Missing"
          ])}
        />
      </div>

      <Card className="mt-5">
        <h3 className="font-semibold">QA/Test Records</h3>
        <p className="mt-1 text-sm text-white/50">Test leads are hidden from health and CRM pipeline counts once flagged. Archive the leftovers after confirming they are not real prospects.</p>
        <div className="mt-4 space-y-3">
          {testLeads.length === 0 ? <EmptyState text="No active QA/test leads found." /> : testLeads.map((lead) => (
            <form key={lead.id} action={updateLeadTestRecordAction} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 md:grid-cols-[1fr_auto_auto]">
              <div>
                <Link href={`/leads/${lead.id}`} className="font-semibold hover:text-accent">{lead.company}</Link>
                <p className="mt-1 text-sm text-white/50">{lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned"} · {lead.stage} · {lead.ghostCrmStatus}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/62">
                <input type="hidden" name="leadId" value={lead.id} />
                <input name="isTestRecord" type="checkbox" defaultChecked={lead.isTestRecord} />
                Test record
              </label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">Save</Button>
                <Button size="sm" name="archive" value="on" variant="outline">Archive</Button>
              </div>
            </form>
          ))}
        </div>
      </Card>
    </PageSection>
  );
}

function HealthMetric({ label, value, tone }: { label: string; value: number; tone: "neutral" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-accent";
  return (
    <Card>
      <p className="text-xs text-white/42">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-white/12 bg-black/12 p-4 text-sm text-white/42">{text}</p>;
}

function formatDate(value: Date) {
  return value.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
