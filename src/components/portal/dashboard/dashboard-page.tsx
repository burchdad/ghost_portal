import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { DashboardSnapshot } from "@/server/data/dashboard";
import type { SessionUser } from "@/server/permissions/authorize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimeClockCard } from "@/components/portal/time-clock-card";

export function DashboardPage({ user, snapshot }: { user: SessionUser; snapshot: DashboardSnapshot }) {
  return (
    <section className="px-5 py-7 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-3">Operations Portal</Badge>
          <h2 className="text-4xl font-semibold tracking-normal">
            {snapshot.greeting}, {user.preferredName ?? user.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
            Your permission-scoped command center for priorities, onboarding, tasks, approvals, and end-of-day reporting.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/52">
          <Clock3 className="size-4" />
          <span>{user.timezone}</span>
        </div>
      </div>

      <div className="grid gap-5">
        <TimeClockCard clock={snapshot.timeClock} />

        <div className="grid gap-5 md:grid-cols-3">
          {snapshot.priorities.map((priority) => (
            <Card key={priority.label}>
              <div className="mb-5 flex items-center justify-between">
                <Badge className={statusTone(priority.status)}>{priority.status}</Badge>
              </div>
              <h3 className="text-lg font-semibold">{priority.label}</h3>
              <p className="mt-2 text-sm leading-6 text-white/54">{priority.detail}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <SectionHeader title={snapshot.scope.assignedWorkTitle} href="/tasks" action="View all" />
            <div className="mt-4 space-y-3">
              {snapshot.tasks.length === 0 ? <EmptyState text="No active assigned tasks." /> : null}
              {snapshot.tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="grid grid-cols-[1fr_150px_110px] items-center gap-4 rounded-lg border border-white/10 bg-black/16 px-4 py-3 text-sm transition hover:bg-white/[0.055]"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-white/42">{task.owner}</p>
                  </div>
                  <Badge>{task.state}</Badge>
                  <span className="text-right text-white/70">{task.priority}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title={snapshot.scope.progressTitle} href="/onboarding" action="Open" />
            <div className="mt-5">
              <div className="flex items-end justify-between">
                <span className="text-5xl font-semibold">{snapshot.onboardingPercent}%</span>
                <span className="text-sm text-white/48">{snapshot.scope.progressLabel}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${snapshot.onboardingPercent}%` }} />
              </div>
              <p className="mt-4 text-sm text-white/52">{snapshot.scope.hoursLabel}</p>
              <Button asChild className="mt-5 w-full" variant="accent">
                <Link href={snapshot.scope.progressHref}>{snapshot.scope.progressAction}</Link>
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <ListCard title="Client Updates" href="/clients" items={snapshot.clientUpdates.map((item) => `${item.company}: ${item.update} (${item.risk})`)} />
          <ListCard title="Lead Follow-ups" href="/leads" items={snapshot.leadFollowUps.map((item) => `${item.company}: ${item.nextAction} ${item.value}`)} />
          <ListCard title="Unread Announcements" href="/announcements" items={snapshot.announcements.map((item) => `${item.category}: ${item.title}`)} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <SectionHeader title={snapshot.scope.approvalsTitle} href="/approvals" action="Review" />
            <div className="mt-4 space-y-3">
              {snapshot.approvals.length === 0 ? <EmptyState text="No open approvals in your scope." /> : null}
              {snapshot.approvals.map((approval) => (
                <Link key={approval.id} href={`/approvals/${approval.id}`} className="block rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/[0.065]">
                  <p className="font-medium">{approval.summary}</p>
                  <p className="mt-1 text-sm text-white/52">{approval.impact}</p>
                  <p className="mt-3 font-mono text-xs text-warning">{approval.deadline}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Activity Timeline" href="/admin/audit-log" action="Audit" />
            <div className="mt-4 space-y-3">
              {snapshot.activity.length === 0 ? <EmptyState text={snapshot.scope.activityEmpty} /> : null}
              {snapshot.activity.map((event) => (
                <div key={`${event.actor}-${event.time}-${event.target}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/14 px-4 py-3">
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
      </div>
    </section>
  );
}

function SectionHeader({ title, href, action }: { title: string; href: string; action: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold">{title}</h3>
      <Button asChild variant="ghost" size="sm">
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}

function ListCard({ title, href, items }: { title: string; href: string; items: string[] }) {
  return (
    <Card>
      <SectionHeader title={title} href={href} action="Open" />
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <EmptyState text="Nothing needs attention right now." /> : null}
        {items.map((item) => (
          <p key={item} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-white/62">
            {item}
          </p>
        ))}
      </div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/48">{text}</p>;
}

function statusTone(status: string) {
  if (status === "urgent") return "border-danger/40 bg-danger/10 text-danger";
  if (status === "active") return "border-warning/40 bg-warning/10 text-warning";
  return "border-accent/40 bg-accent/10 text-accent";
}
