import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { buildNovaSummary } from "@/server/data/dashboard";
import { getPrisma } from "@/server/db/prisma";
import { env } from "@/server/env/env";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000)
  })).min(1).max(12)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Nova request." }, { status: 400 });

  const messages = parsed.data.messages.slice(-8);
  const portalContext = await buildNovaContext(user);

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({
      message: [
        "Nova is ready, but the OpenAI API key is not configured in this environment.",
        "",
        portalContext.summary,
        "",
        "I can still point you to the right workspace: approvals, tasks, CRM, leads, daily reports, or support."
      ].join("\n")
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
      input: formatNovaInput(portalContext, messages),
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
  return NextResponse.json({ message: data.output_text?.trim() || "Nova did not return a response." });
}

async function buildNovaContext(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  const prisma = getPrisma();
  const [summary, tasks, approvals, leads, supportTickets] = await Promise.all([
    buildNovaSummary(user),
    prisma.task.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null },
      select: { title: true, status: true, priority: true, dueDate: true },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 6
    }),
    prisma.approval.findMany({
      where: user.role === "Founder" ? { status: { in: ["Open", "InReview"] } } : { requesterId: user.id },
      select: { summary: true, status: true, priority: true, deadline: true },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 5
    }),
    prisma.lead.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { assignedUserId: user.id, archivedAt: null },
      select: { company: true, contactName: true, stage: true, interestLevel: true, nextAction: true, followUpDate: true, missionControlStatus: true },
      orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
      take: 6
    }),
    prisma.feedbackSubmission.findMany({
      where: user.role === "Founder" ? { status: { in: ["New", "Reviewing", "Planned", "InProgress"] } } : { submittedById: user.id },
      select: { title: true, type: true, status: true, severity: true },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 5
    })
  ]);

  return {
    user: `${user.preferredName ?? user.name} (${user.role})`,
    summary,
    tasks: tasks.map((task) => `${task.title} | ${task.status} | ${task.priority} | due ${task.dueDate?.toISOString() ?? "not set"}`),
    approvals: approvals.map((approval) => `${approval.summary} | ${approval.status} | ${approval.priority} | due ${approval.deadline?.toISOString() ?? "not set"}`),
    leads: leads.map((lead) => `${lead.company} / ${lead.contactName ?? "Unknown"} | ${lead.stage} | ${lead.interestLevel} | ${lead.missionControlStatus} | ${lead.nextAction ?? "no next action"} | follow-up ${lead.followUpDate?.toISOString() ?? "not set"}`),
    supportTickets: supportTickets.map((ticket) => `${ticket.title} | ${ticket.type} | ${ticket.status} | ${ticket.severity}`)
  };
}

function novaInstructions(role: string) {
  return [
    "You are Nova, Ghost AI Solutions' internal operations assistant inside Ghost Ops Portal.",
    "Answer like a focused operations partner: concise, direct, and practical.",
    "Use only the supplied portal context unless the user asks for general drafting or planning help.",
    "Do not invent client facts, prices, deadlines, commitments, or permissions.",
    "Flag anything that needs Stephen approval, legal/contract review, pricing exception review, security review, or client-facing verification.",
    `The current user role is ${role}; respect that role in recommendations.`
  ].join("\n");
}

function formatNovaInput(context: Awaited<ReturnType<typeof buildNovaContext>>, messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return [
    "Portal context:",
    `User: ${context.user}`,
    `Briefing: ${context.summary}`,
    `Tasks: ${context.tasks.length ? context.tasks.join("; ") : "none visible"}`,
    `Approvals: ${context.approvals.length ? context.approvals.join("; ") : "none visible"}`,
    `Leads: ${context.leads.length ? context.leads.join("; ") : "none visible"}`,
    `Support: ${context.supportTickets.length ? context.supportTickets.join("; ") : "none visible"}`,
    "",
    "Conversation:",
    ...messages.map((message) => `${message.role === "user" ? "User" : "Nova"}: ${message.content}`)
  ].join("\n");
}
