import Link from "next/link";
import { Bot, CheckSquare, FileText, LifeBuoy, Target } from "lucide-react";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildNovaSummary } from "@/server/data/dashboard";
import { requireUser } from "@/server/permissions/authorize";

const founderActions = [
  { label: "Review approvals", href: "/approvals", icon: CheckSquare },
  { label: "Check lead pipeline", href: "/crm", icon: Target },
  { label: "Review reports", href: "/daily-reports", icon: FileText },
  { label: "Support queue", href: "/admin/support", icon: LifeBuoy }
];

const operationsActions = [
  { label: "My tasks", href: "/tasks", icon: CheckSquare },
  { label: "Lead follow-ups", href: "/leads?filter=Follow-Up%20Due", icon: Target },
  { label: "Daily report", href: "/daily-reports/new", icon: FileText },
  { label: "Support ticket", href: "/support", icon: LifeBuoy }
];

export default async function NovaPage() {
  const user = await requireUser();
  const summary = await buildNovaSummary(user);
  const actions = user.role === "Founder" ? founderActions : operationsActions;

  return (
    <PageSection eyebrow="Nova" title="Briefing" description="Permission-scoped operational context and next action entry points.">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent text-zinc-950">
              <Bot className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">Nova Briefing</h3>
                <Badge>{user.role}</Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/64">{summary}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Actions</h3>
          <div className="mt-4 space-y-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3 text-sm text-white/72 transition hover:bg-white/[0.065] hover:text-white">
                  <Icon className="size-4 text-accent" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </PageSection>
  );
}
