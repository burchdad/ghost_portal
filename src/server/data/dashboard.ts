import type { SessionUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";
import { hasPermission } from "@/server/permissions/roles";

export type DashboardSnapshot = {
  greeting: string;
  onboardingPercent: number;
  priorities: Array<{ label: string; detail: string; status: "urgent" | "active" | "steady" }>;
  tasks: Array<{ id: string; title: string; owner: string; due: string; state: string; priority: string }>;
  clientUpdates: Array<{ id: string; company: string; update: string; risk: "Low" | "Medium" | "High" }>;
  leadFollowUps: Array<{ id: string; company: string; nextAction: string; value: string }>;
  announcements: Array<{ id: string; title: string; category: string; unread: boolean }>;
  approvals: Array<{ id: string; summary: string; deadline: string; impact: string }>;
  activity: Array<{ actor: string; action: string; target: string; time: string }>;
  hoursThisWeek: string;
  novaSummary: string;
};

export async function getDashboardSnapshot(user: SessionUser): Promise<DashboardSnapshot> {
  const prisma = getPrisma();
  const now = new Date();
  const canSeeAllClients = user.role === "Founder" || hasPermission(user, "clients:read:all");

  const [taskRows, clientRows, leadRows, announcementRows, approvalRows, modules, completions, reports, activityRows] = await Promise.all([
    prisma.task.findMany({
      where: user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null },
      include: { owner: true },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 8
    }),
    prisma.client.findMany({
      where: canSeeAllClients
        ? { archivedAt: null }
        : {
            archivedAt: null,
            access: {
              some: { userId: user.id }
            }
          },
      orderBy: [{ riskStatus: "desc" }, { updatedAt: "desc" }],
      take: 4
    }),
    prisma.lead.findMany({
      where:
        user.role === "Founder"
          ? { archivedAt: null }
          : {
              archivedAt: null,
              access: {
                some: { userId: user.id }
              }
            },
      orderBy: [{ followUpDate: "asc" }],
      take: 4
    }),
    prisma.announcement.findMany({
      where: {
        archivedAt: null,
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        audienceRoles: { has: user.role }
      },
      include: {
        readReceipts: {
          where: { userId: user.id }
        }
      },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 5
    }),
    prisma.approval.findMany({
      where: user.role === "Founder" ? { status: { in: ["Open", "InReview"] } } : { requesterId: user.id },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 5
    }),
    prisma.onboardingModule.count({ where: { published: true } }),
    prisma.onboardingCompletion.count({ where: { userId: user.id } }),
    prisma.dailyReport.findMany({
      where: {
        userId: user.id,
        reportDate: {
          gte: startOfWeekUtc(now)
        }
      },
      select: { hoursWorked: true }
    }),
    prisma.activity.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const onboardingPercent = modules === 0 ? 0 : Math.round((completions / modules) * 100);
  const hoursThisWeek = reports.reduce((total, report) => total + Number(report.hoursWorked), 0).toFixed(1);

  return {
    greeting: greetingForTimezone(user.timezone),
    onboardingPercent,
    priorities: buildPriorities(taskRows.filter((task) => task.dueDate && task.dueDate < now).length, approvalRows.length, onboardingPercent),
    tasks: taskRows.map((task) => ({
      id: task.id,
      title: task.title,
      owner: task.owner?.preferredName ?? task.owner?.name ?? "Unassigned",
      due: formatDate(task.dueDate, user.timezone),
      state: task.status,
      priority: task.priority
    })),
    clientUpdates: clientRows.map((client) => ({
      id: client.id,
      company: client.company,
      update: client.operationalNotes ?? "No operational update recorded.",
      risk: client.riskStatus
    })),
    leadFollowUps: leadRows.map((lead) => ({
      id: lead.id,
      company: lead.company,
      nextAction: lead.nextAction ?? "No next action set.",
      value: lead.estimatedValue ? `$${Number(lead.estimatedValue).toLocaleString()}` : "TBD"
    })),
    announcements: announcementRows.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      category: announcement.category,
      unread: announcement.readReceipts.length === 0
    })),
    approvals: approvalRows.map((approval) => ({
      id: approval.id,
      summary: approval.summary,
      deadline: formatDate(approval.deadline, user.timezone),
      impact: approval.businessImpact
    })),
    activity: activityRows.map((event) => ({
      actor: event.actor?.preferredName ?? event.actor?.name ?? "System",
      action: event.action,
      target: event.target,
      time: formatDate(event.createdAt, user.timezone)
    })),
    hoursThisWeek,
    novaSummary: await buildNovaSummary(user)
  };
}

export async function buildNovaSummary(user: SessionUser) {
  const prisma = getPrisma();
  const taskCount = await prisma.task.count({
    where: user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null }
  });
  const approvalCount = await prisma.approval.count({
    where: user.role === "Founder" ? { status: { in: ["Open", "InReview"] } } : { requesterId: user.id, status: { in: ["Open", "InReview"] } }
  });

  if (user.role === "Founder") {
    return `You have ${approvalCount} open decision items and ${taskCount} visible active tasks. Review approvals, Alex's trial progress, and recent audit activity before assigning new work.`;
  }

  return `You have ${taskCount} assigned active tasks and ${approvalCount} open requests waiting on Stephen. Focus on onboarding, due tasks, and your end-of-day report.`;
}

function buildPriorities(overdueTasks: number, approvals: number, onboardingPercent: number): DashboardSnapshot["priorities"] {
  return [
    { label: `${overdueTasks} overdue tasks`, detail: "Review due dates and unblock active work.", status: overdueTasks > 0 ? "urgent" : "steady" },
    { label: `${approvals} open approvals`, detail: "Keep Waiting on Stephen from becoming a bottleneck.", status: approvals > 0 ? "active" : "steady" },
    { label: `${onboardingPercent}% onboarding`, detail: "Complete required trial modules before operational handoff.", status: onboardingPercent < 100 ? "active" : "steady" }
  ];
}

function greetingForTimezone(timezone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: safeTimezone(timezone) }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date | null, timezone: string) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: safeTimezone(timezone),
    timeZoneName: "short"
  }).format(date);
}

function safeTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return "UTC";
  }
}

function startOfWeekUtc(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - day);
  return copy;
}
