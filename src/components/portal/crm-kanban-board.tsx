"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, DollarSign, ExternalLink, GripVertical, MoreHorizontal, Plus, RefreshCw, UserRound } from "lucide-react";
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

const columns: Array<{ id: CrmKanbanStage; label: string; accent: string }> = [
  { id: "New", label: "New", accent: "bg-sky-300" },
  { id: "ReadyToCall", label: "Ready", accent: "bg-cyan-300" },
  { id: "Attempted", label: "Attempted", accent: "bg-zinc-300" },
  { id: "Connected", label: "Connected", accent: "bg-amber-300" },
  { id: "Qualified", label: "Qualified", accent: "bg-emerald-300" },
  { id: "Discovery", label: "Discovery", accent: "bg-teal-300" },
  { id: "Proposal", label: "Proposal", accent: "bg-fuchsia-300" },
  { id: "Won", label: "Won", accent: "bg-green-300" },
  { id: "Lost", label: "Lost", accent: "bg-red-300" },
  { id: "Nurture", label: "Nurture", accent: "bg-indigo-300" },
  { id: "DoNotContact", label: "DNC", accent: "bg-orange-300" }
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
    <section className="mb-6 rounded-lg border border-white/10 bg-black/18 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-base font-semibold">CRM pipeline board</h3>
          <p className="mt-1 text-sm text-white/50">Drag cards across lists or use the arrow controls on each card.</p>
        </div>
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      </div>
      <div className="overflow-x-auto pb-3">
        <div className="flex min-h-[560px] w-max items-start gap-3 pr-3">
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
                "flex max-h-[calc(100vh-260px)] min-h-[220px] w-[272px] shrink-0 flex-col rounded-lg border border-white/10 bg-[#16171c] p-2 shadow-sm transition",
                activeStage === column.id ? "ring-2 ring-accent/70" : "hover:border-white/16"
              )}
            >
              <div className="flex h-10 items-center justify-between gap-2 px-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("h-2.5 w-8 rounded-full", column.accent)} aria-hidden="true" />
                  <h4 className="truncate text-sm font-semibold">{column.label}</h4>
                  <span className="text-sm text-white/48">{column.leads.length}</span>
                </div>
                <Button type="button" size="icon" variant="ghost" className="size-8" aria-label={`${column.label} list options`}>
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-2">
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
                      "rounded-lg border border-white/10 bg-[#202127] p-2.5 shadow-sm transition hover:border-white/20 hover:bg-[#25262d]",
                      pendingLeadId === lead.id ? "opacity-60" : ""
                    )}
                  >
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className={cn("h-2 w-10 rounded-full", column.accent)} aria-hidden="true" />
                      {lead.ghostCrmStatus === "Synced" ? <span className="h-2 w-10 rounded-full bg-accent" aria-hidden="true" /> : null}
                      {lead.ghostCrmStatus === "Sync Failed" ? <span className="h-2 w-10 rounded-full bg-danger" aria-hidden="true" /> : null}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={lead.href} className="block text-sm font-semibold leading-5 text-white hover:text-accent">
                          {lead.company}
                        </Link>
                        <p className="mt-1 truncate text-xs text-white/52">{lead.contact}</p>
                      </div>
                      <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-white/36" aria-hidden="true" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/62">
                      <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" aria-hidden="true" />{lead.assignedTo}</span>
                      <span className="inline-flex items-center gap-1"><DollarSign className="size-3.5" aria-hidden="true" />{lead.value.replace("$", "")}</span>
                      <span className="inline-flex min-w-0 items-center gap-1"><Clock3 className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{lead.lastActivity}</span></span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="h-6 px-2">{lead.interest}</Badge>
                      <Badge className={cn("h-6 px-2", lead.ghostCrmStatus === "Synced" ? "border-accent/30 text-accent" : lead.ghostCrmStatus === "Sync Failed" ? "border-danger/30 text-danger" : "")}>
                        {lead.ghostCrmStatus}
                      </Badge>
                    </div>
                    {lead.ghostCrmSyncError ? <p className="mt-2 line-clamp-2 text-xs text-danger">{lead.ghostCrmSyncError}</p> : null}
                    <div className="mt-3 flex items-center justify-between gap-1 border-t border-white/8 pt-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        aria-label="Move lead left"
                        disabled={columnIndex === 0 || pendingLeadId === lead.id}
                        onClick={() => moveLead(lead.id, columns[columnIndex - 1].id)}
                      >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                      </Button>
                      <Button asChild size="icon" variant="ghost" className="size-8" aria-label="Open lead">
                        <Link href={lead.href}><ExternalLink className="size-4" aria-hidden="true" /></Link>
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        aria-label={canSync ? "Move lead right and sync" : "Move lead right"}
                        disabled={columnIndex === columns.length - 1 || pendingLeadId === lead.id}
                        onClick={() => moveLead(lead.id, columns[columnIndex + 1].id)}
                      >
                        {pendingLeadId === lead.id ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                      </Button>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-lg border border-dashed border-white/12 bg-black/12 px-3 py-6 text-center text-sm text-white/38">No leads</div>
                )}
              </div>
              <Button asChild variant="ghost" className="mt-1 h-9 justify-start px-2 text-white/62 hover:text-white">
                <Link href="/leads"><Plus className="size-4" aria-hidden="true" /> Add a card</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
