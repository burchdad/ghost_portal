"use client";

import {
  Bell,
  Bot,
  CalendarDays,
  ChevronRight,
  Clock3,
  Command,
  FileText,
  Folder,
  Home,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Workflow
} from "lucide-react";
import { motion } from "framer-motion";
import type { DashboardSnapshot } from "@/server/data/dashboard";
import type { AuthzUser } from "@/server/permissions/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Tasks", icon: Inbox },
  { label: "Clients", icon: Users },
  { label: "Leads", icon: Target },
  { label: "Projects", icon: Workflow },
  { label: "Calendar", icon: CalendarDays },
  { label: "Knowledge Center", icon: FileText },
  { label: "Files", icon: Folder },
  { label: "Daily Reports", icon: MessageSquareText },
  { label: "Waiting on Stephen", icon: Clock3 },
  { label: "Announcements", icon: Megaphone },
  { label: "Mission Feedback", icon: Sparkles },
  { label: "Settings", icon: Settings }
];

type PortalShellProps = {
  user: AuthzUser;
  snapshot: DashboardSnapshot;
};

export function PortalShell({ user, snapshot }: PortalShellProps) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="border-r border-white/10 bg-black/20 px-4 py-5 backdrop-blur-2xl">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Home className="size-5" />
            </div>
            <div>
              <p className="text-sm text-white/50">Ghost AI Solutions</p>
              <h1 className="text-lg font-semibold">Ghost Portal</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <button
                  key={item.label}
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                    active ? "bg-white text-zinc-950" : "text-white/68 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/10 bg-[#08090d]/80 px-8 backdrop-blur-2xl">
            <div className="flex h-11 w-full max-w-xl items-center gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-white/50">
              <Search className="size-4" />
              <span className="text-sm">Search clients, tasks, SOPs, files, leads...</span>
              <kbd className="ml-auto rounded border border-white/10 px-2 py-1 font-mono text-[11px] text-white/45">
                <Command className="mr-1 inline size-3" />K
              </kbd>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                Quick Action
              </Button>
              <Button variant="accent" size="sm">
                <Bot className="size-4" />
                Nova
              </Button>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
                <div className="size-8 rounded-full bg-gradient-to-br from-white to-white/50" />
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-white/45">{user.role}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="px-8 py-7">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge className="mb-3">Operations Portal</Badge>
                <h2 className="text-4xl font-semibold tracking-normal">Today at Ghost</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
                  A permission-aware command center for priorities, clients, projects, approvals, and the next best action.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/52">
                <Clock3 className="size-4" />
                <span>America/Chicago</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid gap-5"
            >
              <div className="grid grid-cols-3 gap-5">
                {snapshot.priorities.map((priority) => (
                  <Card key={priority.label}>
                    <div className="mb-5 flex items-center justify-between">
                      <Badge className={statusTone(priority.status)}>{priority.status}</Badge>
                      <ChevronRight className="size-4 text-white/35" />
                    </div>
                    <h3 className="text-lg font-semibold">{priority.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/54">{priority.detail}</p>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-[1.4fr_0.9fr] gap-5">
                <Card>
                  <SectionHeader title="Assigned Work" action="View all" />
                  <div className="mt-4 space-y-3">
                    {snapshot.tasks.map((task) => (
                      <div key={task.title} className="grid grid-cols-[1fr_150px_110px_90px] items-center gap-4 rounded-lg border border-white/10 bg-black/16 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="mt-1 text-xs text-white/42">{task.owner}</p>
                        </div>
                        <Badge>{task.state}</Badge>
                        <span className="text-white/58">{task.due}</span>
                        <span className="text-right text-white/70">{task.priority}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Upcoming" action="Calendar" />
                  <div className="mt-4 space-y-3">
                    {snapshot.meetings.map((meeting) => (
                      <div key={meeting.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                        <p className="font-medium">{meeting.time}</p>
                        <p className="mt-2 text-sm">{meeting.title}</p>
                        <p className="mt-1 text-xs text-white/45">{meeting.context}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <ListCard title="Client Updates" items={snapshot.clientUpdates.map((item) => `${item.company}: ${item.update} (${item.risk})`)} />
                <ListCard title="Lead Follow-ups" items={snapshot.leadFollowUps.map((item) => `${item.company}: ${item.nextAction} ${item.value}`)} />
                <ListCard title="Unread Announcements" items={snapshot.announcements.map((item) => `${item.category}: ${item.title}`)} />
              </div>

              <div className="grid grid-cols-[0.85fr_1.15fr] gap-5">
                <Card>
                  <SectionHeader title="Waiting on Stephen" action="Review" />
                  <div className="mt-4 space-y-3">
                    {snapshot.approvals.map((approval) => (
                      <div key={approval.summary} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                        <p className="font-medium">{approval.summary}</p>
                        <p className="mt-1 text-sm text-white/52">{approval.impact}</p>
                        <p className="mt-3 font-mono text-xs text-warning">{approval.deadline}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Activity Timeline" action="Audit trail" />
                  <div className="mt-4 space-y-3">
                    {snapshot.activity.map((event) => (
                      <div key={`${event.actor}-${event.time}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/14 px-4 py-3">
                        <div className="size-2 rounded-full bg-accent" />
                        <p className="min-w-0 flex-1 text-sm">
                          <span className="font-medium">{event.actor}</span>
                          <span className="text-white/50"> {event.action} </span>
                          <span>{event.target}</span>
                        </p>
                        <span className="font-mono text-xs text-white/38">{event.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          </section>
        </main>

        <aside className="border-l border-white/10 bg-black/24 px-5 py-5 backdrop-blur-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent">Nova</p>
              <h2 className="text-xl font-semibold">AI Drawer</h2>
            </div>
            <Button variant="outline" size="icon" aria-label="Open Nova drawer">
              <PanelRightOpen className="size-4" />
            </Button>
          </div>

          <Card className="p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-zinc-950">
                <Bot className="size-5" />
              </div>
              <div>
                <p className="font-medium">Permission-safe summary</p>
                <p className="text-xs text-white/45">Scoped to {user.role}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-white/62">{snapshot.novaSummary}</p>
          </Card>

          <div className="mt-5 space-y-3">
            {["What should I work on?", "Draft a client follow-up", "Show overdue work", "Explain this SOP"].map((prompt) => (
              <button key={prompt} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.08]">
                {prompt}
                <ChevronRight className="size-4 text-white/35" />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold">{title}</h3>
      <Button variant="ghost" size="sm">
        {action}
      </Button>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <SectionHeader title={title} action="Open" />
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <p key={item} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-white/62">
            {item}
          </p>
        ))}
      </div>
    </Card>
  );
}

function statusTone(status: string) {
  if (status === "urgent") return "border-danger/40 bg-danger/10 text-danger";
  if (status === "active") return "border-warning/40 bg-warning/10 text-warning";
  return "border-accent/40 bg-accent/10 text-accent";
}
