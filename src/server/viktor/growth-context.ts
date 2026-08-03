import type { LeadStage, Prisma } from "@prisma/client";
import { getPrisma } from "@/server/db/prisma";
import type { SessionUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export type GrowthAction = {
  label: string;
  href: string;
  detail: string;
};

export type ViktorGrowthContext = {
  summary: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  opportunities: GrowthAction[];
  risks: GrowthAction[];
  offers: GrowthAction[];
  leads: GrowthAction[];
  recentSignals: string[];
};

const warmStages: LeadStage[] = ["Interested", "Qualified", "MeetingScheduled", "Discovery", "Proposal", "Negotiation", "Won"];

export async function buildViktorGrowthContext(user: SessionUser): Promise<ViktorGrowthContext> {
  const prisma = getPrisma();
  const canReadAll = user.role === "Founder" || hasPermission(user, "leads:manage");
  const leadWhere: Prisma.LeadWhereInput = canReadAll
    ? { archivedAt: null, doNotContact: false }
    : { archivedAt: null, doNotContact: false, assignedUserId: user.id };

  const [leads, services, reports, approvals] = await Promise.all([
    prisma.lead.findMany({
      where: leadWhere,
      select: {
        id: true,
        company: true,
        contactName: true,
        leadSource: true,
        serviceInterest: true,
        recommendedGhostOffer: true,
        needDiscovered: true,
        stage: true,
        interestLevel: true,
        estimatedValue: true,
        approvedValue: true,
        nextAction: true,
        followUpDate: true,
        missionControlStatus: true,
        ghostCrmStatus: true,
        needsStephenReview: true,
        needsStephenReason: true,
        updatedAt: true
      },
      orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
      take: 40
    }),
    prisma.serviceOffering.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        offerType: true,
        category: true,
        idealCustomer: true,
        shortExplanation: true,
        pricingStatus: true,
        standardPriceCents: true,
        standardMonthlyPriceCents: true,
        reviewPriority: true
      },
      orderBy: [{ reviewPriority: "asc" }, { name: "asc" }],
      take: 12
    }),
    prisma.dailyReport.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      select: { reportDate: true, leadActivity: true, clientUpdates: true, blockers: true, recommendations: true },
      orderBy: { reportDate: "desc" },
      take: 8
    }),
    prisma.approval.findMany({
      where: user.role === "Founder" ? { status: { in: ["Open", "InReview"] } } : { requesterId: user.id },
      select: { id: true, summary: true, priority: true, status: true, deadline: true },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 8
    })
  ]);

  const totalPipeline = leads.reduce((sum, lead) => sum + moneyValue(lead.approvedValue ?? lead.estimatedValue), 0);
  const warmLeads = leads.filter((lead) => warmStages.includes(lead.stage) || ["Interested", "StrongInterest", "MeetingRequested"].includes(lead.interestLevel));
  const needsSync = leads.filter((lead) => lead.missionControlStatus !== "SentToMissionControl" || lead.ghostCrmStatus !== "Synced");
  const followUpDue = leads.filter((lead) => lead.followUpDate && lead.followUpDate <= new Date());
  const reviewBlocked = leads.filter((lead) => lead.needsStephenReview);

  const opportunities = [
    ...warmLeads.slice(0, 4).map((lead) => leadAction(lead, "Warm pipeline opportunity")),
    ...followUpDue.slice(0, 3).map((lead) => leadAction(lead, "Follow-up can move revenue now"))
  ].slice(0, 5);

  const risks = [
    ...reviewBlocked.slice(0, 3).map((lead) => leadAction(lead, lead.needsStephenReason ?? "Needs Stephen review")),
    ...needsSync.slice(0, 3).map((lead) => leadAction(lead, "CRM or Mission Control sync is incomplete")),
    ...approvals.slice(0, 2).map((approval) => ({
      label: approval.summary,
      href: `/approvals/${approval.id}`,
      detail: `${approval.status} | ${approval.priority} | deadline ${approval.deadline?.toISOString() ?? "not set"}`
    }))
  ].slice(0, 5);

  const offerSignals = rankServiceSignals(leads);
  const offers = services.slice(0, 8).map((service) => ({
    label: service.name,
    href: "/pricing",
    detail: `${service.category} | ${service.offerType} | ${service.pricingStatus} | setup ${formatCents(service.standardPriceCents)} | monthly ${formatCents(service.standardMonthlyPriceCents)} | signal ${offerSignals.get(service.name.toLowerCase()) ?? 0}`
  })).slice(0, 5);

  const recentSignals = reports.flatMap((report) => [
    report.leadActivity ? `${report.reportDate.toISOString().slice(0, 10)} lead activity: ${report.leadActivity}` : null,
    report.clientUpdates ? `${report.reportDate.toISOString().slice(0, 10)} client update: ${report.clientUpdates}` : null,
    report.blockers ? `${report.reportDate.toISOString().slice(0, 10)} blocker: ${report.blockers}` : null,
    report.recommendations ? `${report.reportDate.toISOString().slice(0, 10)} recommendation: ${report.recommendations}` : null
  ]).filter(Boolean).slice(0, 8) as string[];

  const metrics = [
    { label: "Open pipeline", value: `$${totalPipeline.toLocaleString()}`, detail: `${leads.length} visible active leads` },
    { label: "Warm leads", value: String(warmLeads.length), detail: "Interested, qualified, proposal, negotiation, or won stage" },
    { label: "Follow-up due", value: String(followUpDue.length), detail: "Leads with due or overdue follow-up dates" },
    { label: "Needs sync", value: String(needsSync.length), detail: "CRM or Mission Control state needs attention" }
  ];

  return {
    summary: [
      `Viktor sees ${leads.length} active leads with about $${totalPipeline.toLocaleString()} in visible pipeline value.`,
      `${warmLeads.length} leads look warm, ${followUpDue.length} need follow-up, and ${needsSync.length} need CRM or Mission Control sync cleanup.`,
      reviewBlocked.length ? `${reviewBlocked.length} growth items are blocked on Stephen review.` : "No visible growth items are currently blocked on Stephen review."
    ].join(" "),
    metrics,
    opportunities,
    risks,
    offers,
    leads: leads.slice(0, 8).map((lead) => leadAction(lead, lead.nextAction ?? "No next action set")),
    recentSignals
  };
}

export function formatViktorContext(context: ViktorGrowthContext) {
  return [
    `Briefing: ${context.summary}`,
    `Metrics: ${context.metrics.map((metric) => `${metric.label}: ${metric.value} (${metric.detail})`).join("; ")}`,
    `Opportunities: ${formatActions(context.opportunities)}`,
    `Risks: ${formatActions(context.risks)}`,
    `Offers: ${formatActions(context.offers)}`,
    `Visible leads: ${formatActions(context.leads)}`,
    `Recent signals: ${context.recentSignals.length ? context.recentSignals.join("; ") : "none visible"}`
  ].join("\n");
}

function leadAction(lead: {
  id: string;
  company: string;
  contactName: string | null;
  stage: LeadStage;
  interestLevel: string;
  estimatedValue: { toString(): string } | null;
  approvedValue: { toString(): string } | null;
  followUpDate: Date | null;
  missionControlStatus: string;
  ghostCrmStatus: string;
}, detailPrefix: string): GrowthAction {
  return {
    label: lead.company,
    href: `/leads/${lead.id}`,
    detail: `${detailPrefix} | ${lead.contactName ?? "Unknown contact"} | ${lead.stage} | ${lead.interestLevel} | value $${moneyValue(lead.approvedValue ?? lead.estimatedValue).toLocaleString()} | follow-up ${lead.followUpDate?.toISOString() ?? "not set"} | MC ${lead.missionControlStatus} | CRM ${lead.ghostCrmStatus}`
  };
}

function rankServiceSignals(leads: Array<{ serviceInterest: string; recommendedGhostOffer: string | null; needDiscovered: string[] }>) {
  const signals = new Map<string, number>();
  for (const lead of leads) {
    for (const value of [lead.serviceInterest, lead.recommendedGhostOffer, ...lead.needDiscovered]) {
      if (!value) continue;
      const key = value.toLowerCase();
      signals.set(key, (signals.get(key) ?? 0) + 1);
    }
  }
  return signals;
}

function formatActions(actions: GrowthAction[]) {
  return actions.length ? actions.map((action) => `${action.label} (${action.href}) | ${action.detail}`).join("; ") : "none visible";
}

function moneyValue(value: { toString(): string } | null | undefined) {
  if (!value) return 0;
  const numberValue = Number(value.toString());
  return Number.isFinite(numberValue) ? Math.round(numberValue) : 0;
}

function formatCents(cents: number | null) {
  return typeof cents === "number" ? `$${(cents / 100).toLocaleString()}` : "not set";
}
