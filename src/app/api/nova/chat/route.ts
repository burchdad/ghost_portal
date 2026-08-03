import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { buildNovaSummary } from "@/server/data/dashboard";
import { getPrisma } from "@/server/db/prisma";
import { env } from "@/server/env/env";
import { agentsForMessage, formatAgentNetworkForNova } from "@/server/nova/agent-network";
import { hasPermission } from "@/server/permissions/roles";
import { buildViktorGrowthContext, formatViktorContext } from "@/server/viktor/growth-context";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000)
  })).min(1).max(12)
});

type NovaAction = {
  label: string;
  href: string;
  detail: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Nova request." }, { status: 400 });

  const messages = parsed.data.messages.slice(-8);
  const portalContext = await buildNovaContext(user);
  const latestMessage = messages.at(-1)?.content ?? "";
  const viktorContext = shouldIncludeViktor(latestMessage) ? await buildViktorGrowthContext(user) : null;
  const actions = buildNovaActions(latestMessage, portalContext);

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({
      message: [
        "Nova is ready, but the OpenAI API key is not configured in this environment.",
        "",
        portalContext.summary,
        "",
        "I can still point you to the right workspace: approvals, tasks, CRM, leads, daily reports, or support."
      ].join("\n"),
      actions
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.NOVA_OPENAI_MODEL ?? "gpt-4o-mini",
      instructions: novaInstructions(user.role),
      input: formatNovaInput(portalContext, messages, viktorContext),
      temperature: 0.3,
      max_output_tokens: 900
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Nova OpenAI request failed", response.status, detail.slice(0, 500));
    return NextResponse.json({ error: "Nova could not complete that request. Try again in a moment." }, { status: 502 });
  }

  const data = await response.json() as { output_text?: string };
  return NextResponse.json({ message: data.output_text?.trim() || "Nova did not return a response.", actions });
}

async function buildNovaContext(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  const prisma = getPrisma();
  const canSeeAllClients = user.role === "Founder" || hasPermission(user, "clients:read:all");
  const canSeeAssignedClients = hasPermission(user, "clients:read:assigned");
  const canReadKnowledge = hasPermission(user, "knowledge:read");
  const canReadPricing = hasPermission(user, "pricing:read");
  const canReadProjects = hasPermission(user, "projects:read:assigned");
  const [summary, tasks, approvals, leads, clients, projects, pricing, sops, knowledge, dailyReports, files, supportTickets] = await Promise.all([
    buildNovaSummary(user),
    prisma.task.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null },
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 6
    }),
    prisma.approval.findMany({
      where: user.role === "Founder" ? { status: { in: ["Open", "InReview"] } } : { requesterId: user.id },
      select: { id: true, summary: true, status: true, priority: true, deadline: true },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 5
    }),
    prisma.lead.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { assignedUserId: user.id, archivedAt: null },
      select: { id: true, company: true, contactName: true, stage: true, interestLevel: true, nextAction: true, followUpDate: true, missionControlStatus: true },
      orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
      take: 6
    }),
    prisma.client.findMany({
      where: canSeeAllClients
        ? { archivedAt: null }
        : canSeeAssignedClients
          ? { archivedAt: null, access: { some: { userId: user.id } } }
          : { id: "__no_client_access__" },
      select: { id: true, company: true, status: true, services: true, riskStatus: true, nextFollowUp: true },
      orderBy: [{ riskStatus: "desc" }, { updatedAt: "desc" }],
      take: 6
    }),
    prisma.project.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : canReadProjects ? { archivedAt: null, tasks: { some: { ownerId: user.id } } } : { id: "__no_project_access__" },
      select: { id: true, name: true, status: true, timeline: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    canReadPricing
      ? prisma.serviceOffering.findMany({
          where: { active: true },
          select: { id: true, name: true, offerType: true, category: true, pricingStatus: true, standardPriceCents: true, standardMonthlyPriceCents: true },
          orderBy: [{ reviewPriority: "asc" }, { name: "asc" }],
          take: 8
        })
      : Promise.resolve([]),
    canReadKnowledge
      ? prisma.sOPArticle.findMany({
          where: { published: true, archivedAt: null, OR: [{ audienceRoles: { isEmpty: true } }, { audienceRoles: { has: user.role } }] },
          select: { id: true, title: true, category: true, trigger: true },
          orderBy: [{ category: "asc" }, { title: "asc" }],
          take: 6
        })
      : Promise.resolve([]),
    canReadKnowledge
      ? prisma.knowledgeArticle.findMany({
          where: { status: "Published", archivedAt: null, visibleToRoles: { has: user.role } },
          select: { id: true, title: true, category: true, requiredReading: true },
          orderBy: [{ requiredReading: "desc" }, { updatedAt: "desc" }],
          take: 5
        })
      : Promise.resolve([]),
    prisma.dailyReport.findMany({
      where: user.role === "Founder" ? {} : { userId: user.id },
      select: { id: true, reportDate: true, status: true, blockers: true, waitingOnStephen: true, tomorrowPriorities: true },
      orderBy: { reportDate: "desc" },
      take: 4
    }),
    prisma.fileAsset.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { archivedAt: null, OR: [{ uploaderId: user.id }, { access: { some: { userId: user.id } } }] },
      select: { id: true, name: true, folder: true, visibility: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.feedbackSubmission.findMany({
      where: user.role === "Founder" ? { status: { in: ["New", "Reviewing", "Planned", "InProgress"] } } : { submittedById: user.id },
      select: { id: true, title: true, type: true, status: true, severity: true },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 5
    })
  ]);

  return {
    user: `${user.preferredName ?? user.name} (${user.role})`,
    summary,
    role: user.role,
    tasks: tasks.map((task) => ({ label: task.title, href: `/tasks/${task.id}`, detail: `${task.status} | ${task.priority} | due ${task.dueDate?.toISOString() ?? "not set"}` })),
    approvals: approvals.map((approval) => ({ label: approval.summary, href: `/approvals/${approval.id}`, detail: `${approval.status} | ${approval.priority} | due ${approval.deadline?.toISOString() ?? "not set"}` })),
    leads: leads.map((lead) => ({ label: lead.company, href: `/leads/${lead.id}`, detail: `${lead.contactName ?? "Unknown"} | ${lead.stage} | ${lead.interestLevel} | ${lead.missionControlStatus} | ${lead.nextAction ?? "no next action"} | follow-up ${lead.followUpDate?.toISOString() ?? "not set"}` })),
    clients: clients.map((client) => ({ label: client.company, href: `/clients/${client.id}`, detail: `${client.status} | ${client.riskStatus} risk | ${client.services.join(", ") || "no services"} | follow-up ${client.nextFollowUp?.toISOString() ?? "not set"}` })),
    projects: projects.map((project) => ({ label: project.name, href: `/projects`, detail: `${project.status} | ${project.timeline ?? "no timeline"}` })),
    pricing: pricing.map((service) => ({ label: service.name, href: `/pricing`, detail: `${service.offerType} | ${service.category} | ${service.pricingStatus} | setup ${formatCents(service.standardPriceCents)} | monthly ${formatCents(service.standardMonthlyPriceCents)}` })),
    sops: sops.map((sop) => ({ label: sop.title, href: `/sops/${sop.id}`, detail: `${sop.category} | trigger: ${sop.trigger}` })),
    knowledge: knowledge.map((article) => ({ label: article.title, href: `/knowledge/${article.id}`, detail: `${article.category} | ${article.requiredReading ? "required" : "reference"}` })),
    dailyReports: dailyReports.map((report) => ({ label: report.reportDate.toISOString().slice(0, 10), href: `/daily-reports/${report.id}`, detail: `${report.status} | waiting: ${report.waitingOnStephen ?? "none"} | tomorrow: ${report.tomorrowPriorities}` })),
    files: files.map((file) => ({ label: file.name, href: `/files`, detail: `${file.folder} | ${file.visibility} | updated ${file.updatedAt.toISOString()}` })),
    supportTickets: supportTickets.map((ticket) => ({ label: ticket.title, href: user.role === "Founder" ? `/admin/support` : `/support`, detail: `${ticket.type} | ${ticket.status} | ${ticket.severity}` }))
  };
}

function novaInstructions(role: string) {
  return [
    "You are Nova, Ghost AI Solutions' CEO-style executive AI agent inside Ghost Ops Portal.",
    "Answer like an executive operating partner: concise, direct, practical, and aware of company priorities.",
    "You are the command layer, not every specialist. Route growth strategy to Viktor, sales and lead generation to Vega, visibility/search intelligence to GEO, and marketing/content work to Echo.",
    "Use only the supplied portal context unless the user asks for general drafting or planning help.",
    "Do not invent client facts, prices, deadlines, commitments, or permissions.",
    "When a user asks for action, explain what to do and reference the relevant workspace. The app may show action cards separately.",
    "Flag anything that needs Stephen approval, legal/contract review, pricing exception review, security review, or client-facing verification.",
    `The current user role is ${role}; respect that role in recommendations.`
  ].join("\n");
}

function formatNovaInput(context: Awaited<ReturnType<typeof buildNovaContext>>, messages: Array<{ role: "user" | "assistant"; content: string }>, viktorContext: Awaited<ReturnType<typeof buildViktorGrowthContext>> | null) {
  return [
    "Portal context:",
    "Ghost agent network:",
    formatAgentNetworkForNova(),
    "",
    `User: ${context.user}`,
    `Briefing: ${context.summary}`,
    `Tasks: ${formatRecords(context.tasks)}`,
    `Approvals: ${formatRecords(context.approvals)}`,
    `Leads: ${formatRecords(context.leads)}`,
    `Clients: ${formatRecords(context.clients)}`,
    `Projects: ${formatRecords(context.projects)}`,
    `Pricing: ${formatRecords(context.pricing)}`,
    `SOPs: ${formatRecords(context.sops)}`,
    `Knowledge: ${formatRecords(context.knowledge)}`,
    `Daily reports: ${formatRecords(context.dailyReports)}`,
    `Files: ${formatRecords(context.files)}`,
    `Support: ${formatRecords(context.supportTickets)}`,
    viktorContext ? ["", "Viktor growth specialist context:", formatViktorContext(viktorContext)].join("\n") : "",
    "",
    "Conversation:",
    ...messages.map((message) => `${message.role === "user" ? "User" : "Nova"}: ${message.content}`)
  ].join("\n");
}

function buildNovaActions(message: string, context: Awaited<ReturnType<typeof buildNovaContext>>): NovaAction[] {
  const lower = message.toLowerCase();
  const actions: NovaAction[] = [];
  const add = (action: NovaAction) => {
    if (!actions.some((existing) => existing.href === action.href && existing.label === action.label)) actions.push(action);
  };

  if (mentions(lower, ["lead", "crm", "pipeline", "call", "mission control", "sync"])) {
    add({ label: "Vega: sales pipeline", href: "/leads", detail: "Use Vega's lane for sales, lead generation, qualification, and follow-up strategy." });
    add({ label: "Open CRM board", href: "/crm", detail: "Review pipeline columns and sync status." });
    add({ label: "Open lead queue", href: "/leads", detail: "Filter, search, and follow up with leads." });
    context.leads.slice(0, 2).forEach(add);
  }
  if (mentions(lower, ["approval", "decision", "stephen", "waiting"])) {
    add({ label: "Open approvals", href: "/approvals", detail: "Review open decisions and bottlenecks." });
    context.approvals.slice(0, 2).forEach(add);
  }
  if (mentions(lower, ["task", "priority", "today", "work", "overdue"])) {
    add({ label: "Open tasks", href: "/tasks", detail: "See assigned work, due dates, and status." });
    context.tasks.slice(0, 2).forEach(add);
  }
  if (mentions(lower, ["client", "customer", "account"])) {
    add({ label: "Open clients", href: "/clients", detail: "Review client records and operational status." });
    context.clients.slice(0, 2).forEach(add);
  }
  if (mentions(lower, ["price", "pricing", "quote", "discount", "offer", "service"])) {
    add({ label: "Viktor: offer strategy", href: "/viktor", detail: "Use Viktor's lane for growth strategy, offer positioning, and revenue opportunities." });
    add({ label: "Open pricing", href: "/pricing", detail: "Check approved service positioning and pricing rules." });
    context.pricing.slice(0, 2).forEach(add);
  }
  if (mentions(lower, ["growth", "grow", "revenue", "strategy", "experiment", "positioning"])) {
    add({ label: "Viktor: growth strategy", href: "/viktor", detail: "Review growth opportunities, pipeline movement, and expansion plays." });
    add({ label: "Open CRM board", href: "/crm", detail: "Review current revenue pipeline." });
  }
  if (mentions(lower, ["geo", "seo", "aeo", "visibility", "search", "ranking", "discoverability"])) {
    add({ label: "GEO: visibility intelligence", href: "/pricing?filter=seo", detail: "Review SEO, AEO, GEO services and visibility-related work." });
    add({ label: "Open service catalog", href: "/services", detail: "Review approved visibility service descriptions." });
  }
  if (mentions(lower, ["echo", "marketing", "content", "social", "campaign", "post", "newsletter", "brand"])) {
    add({ label: "Echo: content operations", href: "/communications", detail: "Draft and review marketing or client-facing communications." });
    add({ label: "Open draft communications", href: "/communications", detail: "Prepare content and messaging for approval." });
  }
  if (mentions(lower, ["sop", "policy", "knowledge", "training", "academy", "explain"])) {
    add({ label: "Open SOP Library", href: "/sops", detail: "Find step-by-step operating procedures." });
    add({ label: "Open Knowledge Base", href: "/knowledge", detail: "Review articles and required reading." });
    context.sops.slice(0, 1).forEach(add);
    context.knowledge.slice(0, 1).forEach(add);
  }
  if (mentions(lower, ["report", "daily", "end-of-day", "hours", "clock"])) {
    add({ label: "Open daily reports", href: "/daily-reports", detail: "Review submitted reports and blockers." });
    add({ label: "Create daily report", href: "/daily-reports/new", detail: "Submit end-of-day work details." });
  }
  if (mentions(lower, ["support", "bug", "issue", "broken", "feedback"])) {
    add({ label: context.role === "Founder" ? "Open support queue" : "Create support ticket", href: context.role === "Founder" ? "/admin/support" : "/support", detail: "Track product issues and improvement requests." });
    context.supportTickets.slice(0, 2).forEach(add);
  }
  if (mentions(lower, ["file", "document", "asset", "upload"])) {
    add({ label: "Open files", href: "/files", detail: "Find uploaded assets and documents." });
    context.files.slice(0, 2).forEach(add);
  }

  if (!actions.length) {
    agentsForMessage(message).slice(0, 2).forEach((agent) => add({ label: `${agent.name}: ${agent.role}`, href: agent.href, detail: agent.purpose }));
    add({ label: "Dashboard", href: "/dashboard", detail: "Return to the operational command center." });
    add({ label: "Tasks", href: "/tasks", detail: "Review assigned work." });
    add({ label: "CRM", href: "/crm", detail: "Review current lead pipeline." });
  }

  return actions.slice(0, 5);
}

function formatRecords(records: Array<{ label: string; href: string; detail: string }>) {
  return records.length ? records.map((record) => `${record.label} (${record.href}) | ${record.detail}`).join("; ") : "none visible";
}

function shouldIncludeViktor(input: string) {
  return mentions(input.toLowerCase(), ["viktor", "growth", "grow", "revenue", "strategy", "experiment", "positioning", "offer", "pipeline", "sales"]);
}

function mentions(input: string, words: string[]) {
  return words.some((word) => input.includes(word));
}

function formatCents(cents: number | null) {
  return typeof cents === "number" ? `$${(cents / 100).toLocaleString()}` : "not set";
}
