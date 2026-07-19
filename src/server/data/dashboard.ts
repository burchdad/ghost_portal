import type { AuthzUser } from "@/server/permissions/roles";
import { hasPermission } from "@/server/permissions/roles";

export type DashboardSnapshot = {
  priorities: Array<{ label: string; detail: string; status: "urgent" | "active" | "steady" }>;
  tasks: Array<{ title: string; owner: string; due: string; state: string; priority: string }>;
  meetings: Array<{ title: string; time: string; context: string }>;
  clientUpdates: Array<{ company: string; update: string; risk: "Low" | "Medium" | "High" }>;
  leadFollowUps: Array<{ company: string; nextAction: string; value: string }>;
  announcements: Array<{ title: string; category: string; unread: boolean }>;
  approvals: Array<{ summary: string; deadline: string; impact: string }>;
  activity: Array<{ actor: string; action: string; target: string; time: string }>;
  novaSummary: string;
};

export async function getDashboardSnapshot(user: AuthzUser): Promise<DashboardSnapshot> {
  const founderOnly = hasPermission(user, "approvals:decide");

  return {
    priorities: [
      { label: "Launch operations portal foundation", detail: "Architecture, permissions, and core modules", status: "urgent" },
      { label: "Review Alex onboarding", detail: "Confirm Operations role access boundaries", status: "active" },
      { label: "Prepare Nova policy layer", detail: "Permission-safe assistant retrieval contract", status: "steady" }
    ],
    tasks: [
      { title: "Approve initial CRM workflow", owner: "Stephen Burch", due: "Today", state: "Waiting on Stephen", priority: "High" },
      { title: "Create Operations first-week checklist", owner: "Alexandra Canto", due: "Tomorrow", state: "Assigned", priority: "Medium" },
      { title: "Map Ghost product knowledge categories", owner: "Stephen Burch", due: "Friday", state: "In Progress", priority: "Medium" }
    ],
    meetings: [
      { title: "Operations onboarding", time: "10:00 AM", context: "Alexandra Canto" },
      { title: "Client pipeline review", time: "2:30 PM", context: "Lead follow-up queue" }
    ],
    clientUpdates: [
      { company: "Northstar Dental", update: "Awaiting campaign copy approval", risk: "Medium" },
      { company: "Meridian Services", update: "Portal access request received", risk: "Low" }
    ],
    leadFollowUps: [
      { company: "Atlas Roofing", nextAction: "Draft website automation follow-up", value: "$18k" },
      { company: "CivicStone", nextAction: "Founder approval needed before proposal", value: "$42k" }
    ],
    announcements: [
      { title: "Security policy refresh", category: "Urgent", unread: true },
      { title: "Nova operating guidelines", category: "AI", unread: true }
    ],
    approvals: founderOnly
      ? [
          { summary: "Proposal discount exception", deadline: "Today 4:00 PM", impact: "Could unblock CivicStone close" },
          { summary: "Client file sharing request", deadline: "Tomorrow", impact: "Needed for onboarding handoff" }
        ]
      : [],
    activity: [
      { actor: "Nova", action: "summarized", target: "today's priorities", time: "2 min ago" },
      { actor: "Alexandra Canto", action: "updated", target: "Northstar Dental notes", time: "18 min ago" },
      { actor: "Stephen Burch", action: "created", target: "Operations onboarding checklist", time: "1 hr ago" }
    ],
    novaSummary:
      "Two approvals are blocking revenue and onboarding. Alex should focus on client notes, follow-up drafts, and completing security onboarding. No restricted finance or credential data is included in this summary."
  };
}
