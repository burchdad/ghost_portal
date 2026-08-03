"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, GripVertical, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateLeadCrmStageAction } from "@/server/workflows/leads";

export type CrmKanbanLead = {
  id: string;
  company: string;
  contact: string;
  stage: CrmKanbanStage;
  interest: string;
  source: string;
  assignedTo: string;
  missionControlStatus: string;
  ghostCrmStatus: string;
  ghostCrmSyncError: string | null;
  value: string;
  lastActivity: string;
  href: string;
};

export type CrmKanbanStage =
  | "New"
  | "ReadyToCall"
  | "Attempted"
  | "Connected"
  | "Qualified"
  | "Discovery"
  | "Proposal"
  | "Won"
  | "Lost"
  | "Nurture"
  | "DoNotContact";

const columns: Array<{ id: CrmKanbanStage; label: string; tone: string }> = [
  { id: "New", label: "New", tone: "border-sky-400/25 bg-sky-400/[0.06]" },
  { id: "ReadyToCall", label: "Ready", tone: "border-cyan-300/25 bg-cyan-300/[0.06]" },
  { id: "Attempted", label: "Attempted", tone: "border-zinc-300/20 bg-zinc-300/[0.05]" },
  { id: "Connected", label: "Connected", tone: "border-amber-300/25 bg-amber-300/[0.06]" },
  { id: "Qualified", label: "Qualified", tone: "border-emerald-300/25 bg-emerald-300/[0.06]" },
  { id: "Discovery", label: "Discovery", tone: "border-teal-300/25 bg-teal-300/[0.06]" },
  { id: "Proposal", label: "Proposal", tone: "border-fuchsia-300/25 bg-fuchsia-300/[0.06]" },
  { id: "Won", label: "Won", tone: "border-green-300/25 bg-green-300/[0.06]" },
  { id: "Lost", label: "Lost", tone: "border-red-300/25 bg-red-300/[0.06]" },
  { id: "Nurture", label: "Nurture", tone: "border-indigo-300/25 bg-indigo-300/[0.06]" },
  { id: "DoNotContact", label: "DNC", tone: "border-orange-300/25 bg-orange-300/[0.06]" }
];

export function CrmKanbanBoard({ leads, canSync }: { leads: CrmKanbanLead[]; canSync: boolean }) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<CrmKanbanStage | null>(null);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const grouped = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      leads: localLeads.filter((lead) => lead.stage === column.id)
    }));
  }, [localLeads]);

  function moveLead(leadId: string, stage: CrmKanbanStage) {
    const current = localLeads.find((lead) => lead.id === leadId);
    if (!current || current.stage === stage) return;
    const previous = localLeads;
    setError(null);
    setPendingLeadId(leadId);
    setLocalLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, stage, ghostCrmStatus: canSync ? "Syncing" : "Needs Sync" } : lead));
    startTransition(async () => {
      try {
        const form = new FormData();
        form.set("leadId", leadId);
        form.set("stage", stage);
        form.set("autoSync", canSync ? "true" : "false");
        await updateLeadCrmStageAction(form);
      } catch (moveError) {
        setLocalLeads(previous);
        setError(moveError instanceof Error ? moveError.message : "Stage move failed.");
      } finally {
        setPendingLeadId(null);
      }
    });
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">CRM pipeline board</h3>
          <p className="mt-1 text-sm text-white/54">Drag leads between stages or use card arrows to update the shared CRM pipeline.</p>
        </div>
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1640px] grid-cols-11 gap-3">
          {grouped.map((column, columnIndex) => (
            <div
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setActiveStage(column.id);
              }}
              onDragLeave={() => setActiveStage(null)}
              onDrop={(event) => {
                event.preventDefault();
                const leadId = event.dataTransfer.getData("text/plain") || draggedId;
                setActiveStage(null);
                setDraggedId(null);
                if (leadId) moveLead(leadId, column.id);
              }}
              className={cn(
                "min-h-[460px] rounded-lg border p-3 transition",
                column.tone,
                activeStage === column.id ? "ring-2 ring-accent/70" : ""
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{column.label}</p>
                  <p className="text-xs text-white/42">{column.leads.length} leads</p>
                </div>
                <Badge>{column.leads.reduce((sum, lead) => sum + numericMoney(lead.value), 0) ? formatColumnValue(column.leads) : "Open"}</Badge>
              </div>
              <div className="space-y-3">
                {column.leads.length ? column.leads.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", lead.id);
                      setDraggedId(lead.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setActiveStage(null);
                    }}
                    className={cn(
                      "rounded-lg border border-white/10 bg-black/24 p-3 shadow-sm transition hover:border-white/20",
                      pendingLeadId === lead.id ? "opacity-60" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={lead.href} className="block truncate text-sm font-semibold text-white hover:text-accent">
                          {lead.company}
                        </Link>
                        <p className="mt-1 truncate text-xs text-white/48">{lead.contact}</p>
                      </div>
                      <GripVertical className="mt-0.5 size-4 shrink-0 text-white/36" aria-hidden="true" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{lead.interest}</Badge>
                      <Badge>{lead.value}</Badge>
                    </div>
                    <dl className="mt-3 space-y-1 text-xs text-white/50">
                      <div className="flex justify-between gap-2">
                        <dt>Owner</dt>
                        <dd className="truncate text-white/72">{lead.assignedTo}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Source</dt>
                        <dd className="truncate text-white/72">{lead.source}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Last</dt>
                        <dd className="truncate text-white/72">{lead.lastActivity}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] px-2 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white/48">GhostCRM</span>
                        <span className={cn("font-medium", lead.ghostCrmStatus === "Sync Failed" ? "text-danger" : lead.ghostCrmStatus === "Synced" ? "text-accent" : "text-white/72")}>
                          {lead.ghostCrmStatus}
                        </span>
                      </div>
                      {lead.ghostCrmSyncError ? <p className="mt-1 line-clamp-2 text-danger">{lead.ghostCrmSyncError}</p> : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Move lead left"
                        disabled={columnIndex === 0 || pendingLeadId === lead.id}
                        onClick={() => moveLead(lead.id, columns[columnIndex - 1].id)}
                      >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                      </Button>
                      <Button asChild size="icon" variant="ghost" aria-label="Open lead">
                        <Link href={lead.href}><ExternalLink className="size-4" aria-hidden="true" /></Link>
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label={canSync ? "Move lead right and sync" : "Move lead right"}
                        disabled={columnIndex === columns.length - 1 || pendingLeadId === lead.id}
                        onClick={() => moveLead(lead.id, columns[columnIndex + 1].id)}
                      >
                        {pendingLeadId === lead.id ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                      </Button>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-lg border border-dashed border-white/12 px-3 py-6 text-center text-sm text-white/38">No leads</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function numericMoney(value: string) {
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

function formatColumnValue(leads: CrmKanbanLead[]) {
  const total = leads.reduce((sum, lead) => sum + numericMoney(lead.value), 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(total);
}
