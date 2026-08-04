import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { CrmKanbanBoard, type CrmKanbanLead, type CrmKanbanStage } from "@/components/portal/crm-kanban-board";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGhostCrmLeads } from "@/server/data/ghostcrm-core";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { syncLeadToGhostCrmAction } from "@/server/workflows/leads";

export default async function CrmPage() {
  const user = await requirePermission("crm:read");
  const canSync = hasPermission(user, "crm:sync");
  const baseWhere: Prisma.LeadWhereInput = user.role === "Founder"
    ? { archivedAt: null }
    : { archivedAt: null, access: { some: { userId: user.id } } };

  const [ghostCrm, opsLeads] = await Promise.all([
    getGhostCrmLeads(100),
    getPrisma().lead.findMany({
      where: baseWhere,
      include: {
        assignedUser: true,
        callActivities: { orderBy: { occurredAt: "desc" }, take: 1 }
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100
    })
  ]);
  const syncedOpsLeadIds = new Set(ghostCrm.leads.map((lead) => lead.externalId).filter(Boolean));
  const metrics = buildMetrics(ghostCrm.leads, opsLeads, syncedOpsLeadIds);
  const boardLeads = opsLeads.map((lead): CrmKanbanLead => {
    const lastCall = lead.callActivities[0];
    const synced = lead.ghostCrmStatus === "Synced" || syncedOpsLeadIds.has(lead.id);
    return {
      id: lead.id,
      company: lead.company,
      contact: lead.contactName ?? lead.contactEmail ?? lead.contactPhone ?? "Unknown contact",
      stage: kanbanStage(lead.stage),
      outcomeStage: ["Won", "Lost"].includes(lead.stage) ? lead.stage : null,
      interest: interestLabel(lead.interestLevel),
      source: lead.leadSource ?? "Unknown",
      assignedTo: lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned",
      missionControlStatus: lead.missionControlStatus,
      ghostCrmStatus: synced ? "Synced" : lead.ghostCrmStatus,
      ghostCrmSyncError: lead.ghostCrmSyncError,
      value: formatMoney(Number(lead.approvedValue ?? lead.estimatedValue ?? 0)),
      lastActivity: lastCall?.outcome ?? lead.callResult ?? "No calls",
      href: `/leads/${lead.id}`
    };
  });

  return (
    <PageSection eyebrow="GhostCRM" title="CRM" description="A shared CRM workspace for GhostCRM Core records and Ops Portal lead activity.">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="GhostCRM leads" value={metrics.crmLeads} />
        <Metric label="Ops Portal leads" value={metrics.opsLeads} />
        <Metric label="Open pipeline" value={formatMoney(metrics.pipelineValue)} />
        <Metric label="Needs sync" value={metrics.needsSync} />
      </div>

      {!ghostCrm.configured ? (
        <Card className="mb-5">
          <h3 className="font-semibold">GhostCRM Core is ready for connection</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">
            Add `GHOSTCRM_CORE_API_URL` and `GHOSTCRM_CORE_API_KEY` in Vercel to let Ops Portal read the canonical GhostCRM Core pipeline.
          </p>
        </Card>
      ) : !ghostCrm.ok ? (
        <Card className="mb-5">
          <h3 className="font-semibold">GhostCRM Core unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{ghostCrm.reason}</p>
        </Card>
      ) : null}

      <CrmKanbanBoard leads={boardLeads} canSync={canSync} />

      <div className="space-y-3">
        {ghostCrm.configured && ghostCrm.ok ? (
          <details className="rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-white/78">GhostCRM Core pipeline details</summary>
            <div className="border-t border-white/10 p-3">
              <SimpleTable
                columns={["Lead", "Company", "Stage", "Score", "Deal", "Source", "Updated"]}
                empty="GhostCRM Core has no leads yet."
                rows={ghostCrm.leads.map((lead) => [
                  lead.title,
                  lead.companyName || "Unknown",
                  <Badge key="stage">{stageLabel(lead.stage)}</Badge>,
                  lead.leadScore || "Not scored",
                  lead.dealAmount ? formatMoney(lead.dealAmount) : lead.dealStage || "No deal",
                  lead.source,
                  lead.updatedAt ? new Date(lead.updatedAt).toLocaleString("en-US") : "Unknown"
                ])}
              />
            </div>
          </details>
        ) : null}

        <details className="rounded-lg border border-white/10 bg-white/[0.03]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-white/78">Ops Portal CRM bridge details</summary>
          <div className="border-t border-white/10 p-3">
            <SimpleTable
              columns={["Lead", "Contact", "Stage", "Interest", "Caller", "Mission Control", "Last call", "GhostCRM"]}
              empty="No Ops Portal leads are visible to you yet."
              rows={opsLeads.map((lead) => {
                const lastCall = lead.callActivities[0];
                const synced = lead.ghostCrmStatus === "Synced" || syncedOpsLeadIds.has(lead.id);
                const failed = lead.ghostCrmStatus === "Sync Failed";
                return [
                  <Link key="lead" href={`/leads/${lead.id}`} className="font-medium text-white hover:text-accent">{lead.company}</Link>,
                  lead.contactName ?? lead.contactEmail ?? lead.contactPhone ?? "Unknown",
                  <Badge key="stage">{lead.stage}</Badge>,
                  interestLabel(lead.interestLevel),
                  lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned",
                  lead.missionControlStatus,
                  lastCall?.outcome ?? lead.callResult ?? "No calls",
                  synced ? <Badge key="synced">Synced</Badge> : failed ? (
                    <div key="failed" className="space-y-2">
                      <Badge>Sync Failed</Badge>
                      {lead.ghostCrmSyncError ? <p className="text-xs leading-5 text-danger">{lead.ghostCrmSyncError}</p> : null}
                      {canSync ? (
                        <form action={syncLeadToGhostCrmAction}>
                          <input type="hidden" name="leadId" value={lead.id} />
                          <Button size="sm" variant="accent">Retry</Button>
                        </form>
                      ) : null}
                    </div>
                  ) : canSync ? (
                    <form key="form" action={syncLeadToGhostCrmAction}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <Button size="sm" variant="accent">Sync</Button>
                    </form>
                  ) : "Not synced"
                ];
              })}
            />
          </div>
        </details>
      </div>
    </PageSection>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs text-white/42">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function buildMetrics(
  crmLeads: Array<{ externalId: string | null; dealAmount: number; value: number }>,
  opsLeads: Array<{ id: string; ghostCrmStatus: string; estimatedValue: Prisma.Decimal | null; approvedValue: Prisma.Decimal | null }>,
  syncedOpsLeadIds: Set<string | null>
) {
  const pipelineValue = crmLeads.reduce((sum, lead) => sum + (lead.dealAmount || lead.value || 0), 0);
  return {
    crmLeads: crmLeads.length,
    opsLeads: opsLeads.length,
    pipelineValue: pipelineValue || opsLeads.reduce((sum, lead) => sum + Number(lead.approvedValue ?? lead.estimatedValue ?? 0), 0),
    needsSync: opsLeads.filter((lead) => lead.ghostCrmStatus !== "Synced" && !syncedOpsLeadIds.has(lead.id)).length
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function stageLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function interestLabel(value: string) {
  if (value === "StrongInterest") return "Strong Interest";
  if (value === "MeetingRequested") return "Meeting Requested";
  return value;
}

function kanbanStage(value: string): CrmKanbanStage {
  if (value === "Researching") return "New";
  if (value === "ReadyToCall") return "New";
  if (value === "Contacted") return "Attempted";
  if (value === "Connected") return "Attempted";
  if (value === "Interested") return "Qualified";
  if (value === "Discovery") return "Qualified";
  if (value === "MeetingScheduled") return "Qualified";
  if (value === "FollowUp") return "Nurture";
  if (value === "Negotiation") return "Proposal";
  if (value === "Won") return "Proposal";
  if (value === "Lost") return "Proposal";
  if (value === "DoNotContact") return "Nurture";
  if (isKanbanStage(value)) return value;
  return "New";
}

function isKanbanStage(value: string): value is CrmKanbanStage {
  return ["New", "Attempted", "Qualified", "Proposal", "Nurture"].includes(value);
}
